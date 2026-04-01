import { createContext, useContext, useState } from 'react';
import { generateId } from '../utils/helpers';

const AVATAR_COLORS = [
  { color: '#6366f1', bg: '#e0e7ff' },
  { color: '#f59e0b', bg: '#fef3c7' },
  { color: '#22c55e', bg: '#dcfce7' },
  { color: '#ef4444', bg: '#fee2e2' },
  { color: '#3b82f6', bg: '#dbeafe' },
  { color: '#ec4899', bg: '#fce7f3' },
  { color: '#8b5cf6', bg: '#ede9fe' },
  { color: '#06b6d4', bg: '#cffafe' },
  { color: '#f97316', bg: '#ffedd5' },
  { color: '#14b8a6', bg: '#ccfbf1' },
];

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Registry: array of { id, name, initials, color, bg }
  const [users, setUsers] = useState(() => load('et_users', []));

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('et_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const saveUsers = (updated) => {
    setUsers(updated);
    localStorage.setItem('et_users', JSON.stringify(updated));
  };

  // Register a new user with a chosen name and PIN — returns false if name taken
  const register = (name, pin) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: 'Name cannot be empty' };
    if (users.some(u => u.name.toLowerCase() === trimmed.toLowerCase()))
      return { ok: false, error: 'That username is already taken' };
    if (!/^\d{4}$/.test(pin)) return { ok: false, error: 'PIN must be exactly 4 digits' };

    const palette = AVATAR_COLORS[users.length % AVATAR_COLORS.length];
    const user = {
      id:       generateId(),
      name:     trimmed,
      initials: trimmed.slice(0, 2).toUpperCase(),
      color:    palette.color,
      bg:       palette.bg,
    };
    const updated = [...users, user];
    saveUsers(updated);
    localStorage.setItem(`et_pin_${user.id}`, pin);
    // Auto-login after registration
    setCurrentUser(user);
    localStorage.setItem('et_current_user', JSON.stringify(user));
    return { ok: true };
  };

  // Login with userId + pin
  const login = (userId, pin) => {
    const stored = localStorage.getItem(`et_pin_${userId}`);
    if (stored !== pin) return false;
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    setCurrentUser(user);
    localStorage.setItem('et_current_user', JSON.stringify(user));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('et_current_user');
  };

  // Remove a profile and wipe all its data from localStorage
  const removeUser = (userId) => {
    const keys = [
      `et_pin_${userId}`,
      `et_expenses_${userId}`,
      `et_categories_${userId}`,
      `et_people_${userId}`,
      `et_splits_${userId}`,
      `et_overpay_${userId}`,
    ];
    keys.forEach(k => localStorage.removeItem(k));
    const updated = users.filter(u => u.id !== userId);
    saveUsers(updated);
    // If current user was deleted, log out
    if (currentUser?.id === userId) logout();
  };

  return (
    <AuthContext.Provider value={{ users, currentUser, register, login, logout, removeUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
