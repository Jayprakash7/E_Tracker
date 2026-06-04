import { createContext, useContext, useState, useEffect } from "react";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

const FundsContext = createContext(null);

export function FundsProvider({ children, userId }) {
  const [funds,        setFunds]        = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const unsubFunds = onSnapshot(
      collection(db, "users", userId, "funds"),
      (snap) => setFunds(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubTx = onSnapshot(
      collection(db, "users", userId, "fundTransactions"),
      (snap) => setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubFunds(); unsubTx(); };
  }, [userId]);

  /* -- Funds -- */
  const addFund = (name, initialAmount) =>
    addDoc(collection(db, "users", userId, "funds"), {
      name: name.trim(),
      initialAmount: parseFloat(initialAmount) || 0,
      createdAt: new Date().toISOString(),
    });

  const deleteFund = async (fundId) => {
    // delete all transactions for this fund first
    const txForFund = transactions.filter((t) => t.fundId === fundId);
    await Promise.all(txForFund.map((t) => deleteDoc(doc(db, "users", userId, "fundTransactions", t.id))));
    return deleteDoc(doc(db, "users", userId, "funds", fundId));
  };

  const renameFund = (fundId, newName) =>
    updateDoc(doc(db, "users", userId, "funds", fundId), { name: newName.trim() });

  /* -- Transactions -- */
  const addTransaction = (fundId, { description, amount, type, date, notes, totalExpense, selfAmount }) =>
    addDoc(collection(db, "users", userId, "fundTransactions"), {
      fundId,
      description: description.trim(),
      amount: parseFloat(amount),
      type,           // 'debit' | 'credit'
      date,
      notes: notes?.trim() || "",
      totalExpense: totalExpense ?? null,
      selfAmount:   selfAmount   ?? null,
      createdAt: new Date().toISOString(),
    });

  const deleteTransaction = (txId) =>
    deleteDoc(doc(db, "users", userId, "fundTransactions", txId));

  /* -- Computed -- */
  const getFundTransactions = (fundId) =>
    transactions
      .filter((t) => t.fundId === fundId)
      .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  const getFundBalance = (fund) => {
    const txs = getFundTransactions(fund.id);
    const net = txs.reduce((acc, t) => {
      return t.type === "credit" ? acc + t.amount : acc - t.amount;
    }, 0);
    return fund.initialAmount + net;
  };

  return (
    <FundsContext.Provider value={{
      funds, transactions,
      addFund, deleteFund, renameFund,
      addTransaction, deleteTransaction,
      getFundTransactions, getFundBalance,
    }}>
      {children}
    </FundsContext.Provider>
  );
}

export const useFunds = () => useContext(FundsContext);
