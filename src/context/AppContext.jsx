import { createContext, useContext, useState, useEffect } from 'react';
import { generateId } from '../utils/helpers';

const AppContext = createContext(null);

export const DEFAULT_CATEGORIES = [
  { id: 'cat1', name: 'Food & Dining',     color: '#f59e0b', icon: '🍔' },
  { id: 'cat2', name: 'Transport',          color: '#3b82f6', icon: '🚗' },
  { id: 'cat3', name: 'Shopping',           color: '#ec4899', icon: '🛍️' },
  { id: 'cat4', name: 'Bills & Utilities',  color: '#8b5cf6', icon: '💡' },
  { id: 'cat5', name: 'Health & Medical',   color: '#22c55e', icon: '💊' },
  { id: 'cat6', name: 'Entertainment',      color: '#ef4444', icon: '🎬' },
  { id: 'cat7', name: 'Education',          color: '#06b6d4', icon: '📚' },
  { id: 'cat8', name: 'Other',              color: '#64748b', icon: '📦' },
];

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children, userId }) {
  const [expenses, setExpenses] = useState(() =>
    loadFromStorage(`et_expenses_${userId}`, [])
  );
  const [categories, setCategories] = useState(() =>
    loadFromStorage(`et_categories_${userId}`, DEFAULT_CATEGORIES)
  );

  useEffect(() => {
    localStorage.setItem(`et_expenses_${userId}`, JSON.stringify(expenses));
  }, [expenses, userId]);

  useEffect(() => {
    localStorage.setItem(`et_categories_${userId}`, JSON.stringify(categories));
  }, [categories, userId]);

  /* ── Expense operations ── */
  const addExpense = (data) => {
    const expense = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  };

  const updateExpense = (id, data) =>
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));

  const deleteExpense = (id) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));

  /* ── Category operations ── */
  const addCategory = (data) => {
    const cat = { ...data, id: generateId() };
    setCategories((prev) => [...prev, cat]);
    return cat;
  };

  const updateCategory = (id, data) =>
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));

  const deleteCategory = (id) =>
    setCategories((prev) => prev.filter((c) => c.id !== id));

  const getCategoryById = (id) => categories.find((c) => c.id === id);

  return (
    <AppContext.Provider
      value={{
        expenses,
        categories,
        addExpense,
        updateExpense,
        deleteExpense,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};
