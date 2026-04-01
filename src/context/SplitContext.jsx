import { createContext, useContext, useState, useEffect } from "react";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { generateId } from "../utils/helpers";

const SplitContext = createContext(null);

const PERSON_COLORS = [
  "#6366f1","#f59e0b","#22c55e","#ef4444",
  "#3b82f6","#ec4899","#8b5cf6","#06b6d4","#f97316","#14b8a6",
];

export function SplitProvider({ children, userId }) {
  const [people,       setPeople]       = useState([]);
  const [splits,       setSplits]       = useState([]);
  const [overpayments, setOverpayments] = useState([]);

  useEffect(() => {
    const unsubPeople = onSnapshot(
      collection(db, "users", userId, "people"),
      (snap) => setPeople(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubSplits = onSnapshot(
      collection(db, "users", userId, "splits"),
      (snap) => setSplits(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubOverpay = onSnapshot(
      collection(db, "users", userId, "overpayments"),
      (snap) => setOverpayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubPeople(); unsubSplits(); unsubOverpay(); };
  }, [userId]);

  /* -- People -- */
  const addPerson = async (name) => {
    const color = PERSON_COLORS[people.length % PERSON_COLORS.length];
    const ref   = await addDoc(collection(db, "users", userId, "people"), { name: name.trim(), color });
    return { id: ref.id, name: name.trim(), color };
  };
  const deletePerson  = (id) => deleteDoc(doc(db, "users", userId, "people", id));
  const getPersonById = (id) => people.find((p) => p.id === id);

  /* -- Splits -- */
  const addSplit = async ({ expenseId = null, expenseTitle, expenseDate, totalAmount, entries }) => {
    const split = {
      expenseId,
      expenseTitle,
      expenseDate,
      totalAmount,
      entries: entries.map((e) => ({ ...e, settlements: [] })),
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db, "users", userId, "splits"), split);
    return { id: ref.id, ...split };
  };
  const deleteSplit = (id) => deleteDoc(doc(db, "users", userId, "splits", id));

  /* -- Computed helpers (pure, no Firestore calls) -- */
  const getEntryRemaining = (entry) => {
    const paid = (entry.settlements || []).reduce((t, s) => t + s.amount, 0);
    return Math.max(0, Math.round((entry.shareAmount - paid) * 100) / 100);
  };

  const getPersonOutstanding = (personId) =>
    splits.reduce((total, s) => {
      const e = s.entries?.find((en) => en.personId === personId);
      return e ? total + getEntryRemaining(e) : total;
    }, 0);

  const getPersonOverpaid = (personId) =>
    overpayments
      .filter((o) => o.personId === personId)
      .reduce((t, o) => t + o.amount, 0);

  const getPersonBalance = (personId) =>
    Math.round((getPersonOutstanding(personId) - getPersonOverpaid(personId)) * 100) / 100;

  const getTotalOutstanding = () =>
    people.reduce((t, p) => {
      const b = getPersonBalance(p.id);
      return t + (b > 0 ? b : 0);
    }, 0);

  /* -- Settle: oldest-first; excess -> overpayment -- */
  const settlePersonTotal = async (personId, paymentAmount, note = "") => {
    const person = people.find((p) => p.id === personId);
    const personSplits = splits
      .filter((s) => s.entries?.some((e) => e.personId === personId && getEntryRemaining(e) > 0))
      .sort((a, b) => new Date(a.expenseDate) - new Date(b.expenseDate));

    let remaining = Math.round(parseFloat(paymentAmount) * 100) / 100;

    for (const split of personSplits) {
      if (remaining <= 0) break;
      const updatedEntries = split.entries.map((e) => {
        if (e.personId !== personId) return e;
        const owed     = getEntryRemaining(e);
        const toSettle = Math.min(owed, remaining);
        remaining      = Math.round((remaining - toSettle) * 100) / 100;
        if (toSettle <= 0) return e;
        return {
          ...e,
          settlements: [
            ...(e.settlements || []),
            { id: generateId(), amount: toSettle, date: new Date().toISOString().split("T")[0], note: note.trim() },
          ],
        };
      });
      await updateDoc(doc(db, "users", userId, "splits", split.id), { entries: updatedEntries });
    }

    if (remaining > 0) {
      await addDoc(collection(db, "users", userId, "overpayments"), {
        personId,
        personName: person?.name || "",
        amount:     remaining,
        date:       new Date().toISOString().split("T")[0],
        note:       note.trim(),
      });
    }
  };

  const clearOverpayment = (id) =>
    deleteDoc(doc(db, "users", userId, "overpayments", id));

  return (
    <SplitContext.Provider value={{
      people, splits, overpayments,
      addPerson, deletePerson, getPersonById,
      addSplit, deleteSplit,
      settlePersonTotal, clearOverpayment,
      getEntryRemaining, getPersonOutstanding,
      getPersonOverpaid, getPersonBalance, getTotalOutstanding,
    }}>
      {children}
    </SplitContext.Provider>
  );
}

export const useSplit = () => {
  const ctx = useContext(SplitContext);
  if (!ctx) throw new Error("useSplit must be inside SplitProvider");
  return ctx;
};