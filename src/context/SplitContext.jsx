import { createContext, useContext, useState, useEffect } from 'react';
import { generateId } from '../utils/helpers';

const SplitContext = createContext(null);

const PERSON_COLORS = [
  '#6366f1', '#f59e0b', '#22c55e', '#ef4444',
  '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4',
  '#f97316', '#14b8a6',
];

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export function SplitProvider({ children, userId }) {
  const [people,       setPeople]       = useState(() => load(`et_people_${userId}`, []));
  const [splits,       setSplits]       = useState(() => load(`et_splits_${userId}`, []));
  // overpayments: [{id, personId, personName, amount, date, note}]
  const [overpayments, setOverpayments] = useState(() => load(`et_overpay_${userId}`, []));

  useEffect(() => { localStorage.setItem(`et_people_${userId}`,  JSON.stringify(people));       }, [people,       userId]);
  useEffect(() => { localStorage.setItem(`et_splits_${userId}`,  JSON.stringify(splits));       }, [splits,       userId]);
  useEffect(() => { localStorage.setItem(`et_overpay_${userId}`, JSON.stringify(overpayments)); }, [overpayments, userId]);

  /* â”€â”€ People â”€â”€ */
  const addPerson    = (name) => {
    const color  = PERSON_COLORS[people.length % PERSON_COLORS.length];
    const person = { id: generateId(), name: name.trim(), color };
    setPeople(prev => [...prev, person]);
    return person;
  };
  const deletePerson  = (id) => setPeople(prev => prev.filter(p => p.id !== id));
  const getPersonById = (id) => people.find(p => p.id === id);

  /* â”€â”€ Splits â”€â”€ */
  const addSplit = ({ expenseId = null, expenseTitle, expenseDate, totalAmount, entries }) => {
    const split = {
      id: generateId(),
      expenseId,
      expenseTitle,
      expenseDate,
      totalAmount,
      entries: entries.map(e => ({ ...e, settlements: [] })),
      createdAt: new Date().toISOString(),
    };
    setSplits(prev => [split, ...prev]);
    return split;
  };
  const deleteSplit = (id) => setSplits(prev => prev.filter(s => s.id !== id));

  /* â”€â”€ Computed helpers â”€â”€ */

  // How much is still owed on one entry (always >= 0, overpayments tracked separately)
  const getEntryRemaining = (entry) => {
    const paid = (entry.settlements || []).reduce((t, s) => t + s.amount, 0);
    return Math.max(0, Math.round((entry.shareAmount - paid) * 100) / 100);
  };

  // Total still owed by a person across all splits (>= 0)
  const getPersonOutstanding = (personId) =>
    splits.reduce((total, s) => {
      const e = s.entries.find(en => en.personId === personId);
      return e ? total + getEntryRemaining(e) : total;
    }, 0);

  // Total overpaid by a person (amount they paid MORE than they owed) â†’ you owe them
  const getPersonOverpaid = (personId) =>
    overpayments
      .filter(o => o.personId === personId)
      .reduce((t, o) => t + o.amount, 0);

  // Net balance for a person:  positive = they owe you | negative = you owe them
  const getPersonBalance = (personId) => {
    const balance = getPersonOutstanding(personId) - getPersonOverpaid(personId);
    return Math.round(balance * 100) / 100;
  };

  // Sum of all positive balances (what you will receive)
  const getTotalOutstanding = () =>
    people.reduce((t, p) => {
      const b = getPersonBalance(p.id);
      return t + (b > 0 ? b : 0);
    }, 0);

  /* â”€â”€ Settle: distribute payment oldest-first; excess â†’ overpayment â”€â”€ */
  const settlePersonTotal = (personId, paymentAmount, note = '') => {
    const person = people.find(p => p.id === personId);
    const personSplits = splits
      .filter(s => s.entries.some(e => e.personId === personId && getEntryRemaining(e) > 0))
      .sort((a, b) => new Date(a.expenseDate) - new Date(b.expenseDate));

    let remaining = Math.round(parseFloat(paymentAmount) * 100) / 100;

    setSplits(prev => {
      let updated = [...prev];
      for (const split of personSplits) {
        if (remaining <= 0) break;
        updated = updated.map(s => {
          if (s.id !== split.id) return s;
          return {
            ...s,
            entries: s.entries.map(e => {
              if (e.personId !== personId) return e;
              const owed      = getEntryRemaining(e);
              const toSettle  = Math.min(owed, remaining);
              remaining       = Math.round((remaining - toSettle) * 100) / 100;
              if (toSettle <= 0) return e;
              return {
                ...e,
                settlements: [
                  ...e.settlements,
                  { id: generateId(), amount: toSettle, date: new Date().toISOString().split('T')[0], note: note.trim() },
                ],
              };
            }),
          };
        });
      }
      return updated;
    });

    // Any remainder after clearing all splits = overpayment (you owe them)
    if (remaining > 0) {
      setOverpayments(prev => [
        ...prev,
        {
          id:         generateId(),
          personId,
          personName: person?.name || '',
          amount:     remaining,
          date:       new Date().toISOString().split('T')[0],
          note:       note.trim(),
        },
      ]);
    }
  };

  // Clear an overpayment (e.g. once you pay them back)
  const clearOverpayment = (id) =>
    setOverpayments(prev => prev.filter(o => o.id !== id));

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
  if (!ctx) throw new Error('useSplit must be inside SplitProvider');
  return ctx;
};