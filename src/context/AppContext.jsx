import { createContext, useContext, useState, useEffect } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, setDoc, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

const AppContext = createContext(null);

export const DEFAULT_CATEGORIES = [
  { id: 'cat1', name: 'Food & Dining',     color: '#f59e0b', icon: 'ðŸ”' },
  { id: 'cat2', name: 'Transport',          color: '#3b82f6', icon: 'ðŸš—' },
  { id: 'cat3', name: 'Shopping',           color: '#ec4899', icon: 'ðŸ›ï¸' },
  { id: 'cat4', name: 'Bills & Utilities',  color: '#8b5cf6', icon: 'ðŸ’¡' },
  { id: 'cat5', name: 'Health & Medical',   color: '#22c55e', icon: 'ðŸ’Š' },
  { id: 'cat6', name: 'Entertainment',      color: '#ef4444', icon: 'ðŸŽ¬' },
  { id: 'cat7', name: 'Education',          color: '#06b6d4', icon: 'ðŸ“š' },
  { id: 'cat8', name: 'Other',              color: '#64748b', icon: 'ðŸ“¦' },
];

// Seed default categories if the user has none yet
async function seedCategories(userId) {
  const col = collection(db, 'users', userId, 'categories');
  const snap = await getDocs(col);
  if (snap.empty) {
    await Promise.all(
      DEFAULT_CATEGORIES.map((cat) =>
        setDoc(doc(db, 'users', userId, 'categories', cat.id), {
          name: cat.name, color: cat.color, icon: cat.icon,
        })
      )
    );
  }
}

export function AppProvider({ children, userId }) {
  const [expenses,   setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);

  // Seed defaults + subscribe to expenses
  useEffect(() => {
    seedCategories(userId);

    const unsubExp = onSnapshot(
      collection(db, 'users', userId, 'expenses'),
      (snap) => setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
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
