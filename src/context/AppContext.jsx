import { createContext, useContext, useState, useEffect } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const AppContext = createContext(null);

export const DEFAULT_CATEGORIES = [
  { id: 'cat1', name: 'Food & Dining',    color: '#f59e0b', icon: '\u{1F354}' },
  { id: 'cat2', name: 'Transport',         color: '#3b82f6', icon: '\u{1F697}' },
  { id: 'cat3', name: 'Shopping',          color: '#ec4899', icon: '\u{1F6CD}' },
  { id: 'cat4', name: 'Bills & Utilities', color: '#8b5cf6', icon: '\u{1F4A1}' },
  { id: 'cat5', name: 'Health & Medical',  color: '#22c55e', icon: '\u{1F48A}' },
  { id: 'cat6', name: 'Entertainment',     color: '#ef4444', icon: '\u{1F3AC}' },
  { id: 'cat7', name: 'Education',         color: '#06b6d4', icon: '\u{1F4DA}' },
  { id: 'cat8', name: 'Other',             color: '#64748b', icon: '\u{1F4E6}' },
];

// Seed default categories — always overwrites to fix any corrupted icons
async function seedCategories(userId) {
  await Promise.all(
    DEFAULT_CATEGORIES.map((cat) =>
      setDoc(doc(db, 'users', userId, 'categories', cat.id), {
        name: cat.name, color: cat.color, icon: cat.icon,
      }, { merge: true })
    )
  );
}

export function AppProvider({ children, userId }) {
  const [expenses,   setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);

  // Seed defaults + subscribe to expenses
  useEffect(() => {
    seedCategories(userId);

    const unsubExp = onSnapshot(
      collection(db, 'users', userId, 'expenses'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort: newest date first; within same date, latest createdAt first
        list.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          const ta = a.createdAt || '';
          const tb = b.createdAt || '';
          return tb.localeCompare(ta);
        });
        setExpenses(list);
      }
    );
    const unsubCat = onSnapshot(
      collection(db, 'users', userId, 'categories'),
      (snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubExp(); unsubCat(); };
  }, [userId]);

  /* â”€â”€ Expense operations â”€â”€ */
  const addExpense = async (data) => {
    const ref = await addDoc(collection(db, 'users', userId, 'expenses'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { ...data, id: ref.id };
  };

  const updateExpense = (id, data) =>
    updateDoc(doc(db, 'users', userId, 'expenses', id), data);

  const deleteExpense = (id) =>
    deleteDoc(doc(db, 'users', userId, 'expenses', id));

  /* â”€â”€ Category operations â”€â”€ */
  const addCategory = async (data) => {
    const ref = await addDoc(collection(db, 'users', userId, 'categories'), data);
    return { ...data, id: ref.id };
  };

  const updateCategory = (id, data) =>
    updateDoc(doc(db, 'users', userId, 'categories', id), data);

  const deleteCategory = (id) =>
    deleteDoc(doc(db, 'users', userId, 'categories', id));

  const getCategoryById = (id) => categories.find((c) => c.id === id);

  return (
    <AppContext.Provider value={{
      expenses, categories,
      addExpense, updateExpense, deleteExpense,
      addCategory, updateCategory, deleteCategory,
      getCategoryById,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};
