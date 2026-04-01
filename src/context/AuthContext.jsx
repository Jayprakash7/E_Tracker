import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, deleteDoc,
  collection, onSnapshot, getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const AVATAR_COLORS = [
  { color: "#6366f1", bg: "#e0e7ff" },
  { color: "#f59e0b", bg: "#fef3c7" },
  { color: "#22c55e", bg: "#dcfce7" },
  { color: "#ef4444", bg: "#fee2e2" },
  { color: "#3b82f6", bg: "#dbeafe" },
  { color: "#ec4899", bg: "#fce7f3" },
  { color: "#8b5cf6", bg: "#ede9fe" },
  { color: "#06b6d4", bg: "#cffafe" },
  { color: "#f97316", bg: "#ffedd5" },
  { color: "#14b8a6", bg: "#ccfbf1" },
];

// Synthetic email from display name (Firebase Auth needs email format)
const toEmail = (name) =>
  name.toLowerCase().replace(/\s+/g, ".") + "@etracker.local";

// Firebase password must be >= 6 chars; pad the 4-digit PIN
const toPassword = (pin) => pin + "__et";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users,       setUsers]       = useState([]);
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = still loading
  const [loading,     setLoading]     = useState(true);

  // Listen to public profiles collection (shows all users on login screen)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "profiles"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "profiles", firebaseUser.uid));
        if (snap.exists()) {
          setCurrentUser({ id: firebaseUser.uid, ...snap.data() });
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Register a new user — name + 4-digit PIN
  const register = async (name, pin) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Name cannot be empty" };
    if (!/^\d{4}$/.test(pin)) return { ok: false, error: "PIN must be 4 digits" };

    try {
      const email = toEmail(trimmed);
      const cred  = await createUserWithEmailAndPassword(auth, email, toPassword(pin));

      const palette = AVATAR_COLORS[users.length % AVATAR_COLORS.length];
      const profile = {
        name:     trimmed,
        initials: trimmed.slice(0, 2).toUpperCase(),
        color:    palette.color,
        bg:       palette.bg,
        email,
      };

      await setDoc(doc(db, "profiles", cred.user.uid), profile);
      setCurrentUser({ id: cred.user.uid, ...profile });
      return { ok: true };
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        return { ok: false, error: "That name is already taken" };
      }
      return { ok: false, error: "Registration failed. Try again." };
    }
  };

  // Login with display name + PIN
  const login = async (name, pin) => {
    const user = users.find((u) => u.name.toLowerCase() === name.trim().toLowerCase());
    if (!user) return { ok: false, error: "No account found with that name" };
    try {
      await signInWithEmailAndPassword(auth, user.email, toPassword(pin));
      return { ok: true };
    } catch {
      return { ok: false, error: "Wrong PIN. Try again." };
    }
  };

  const logout = () => signOut(auth);

  // Remove a profile and all its Firestore data
  const removeUser = async (userId) => {
    const subCollections = ["expenses", "categories", "people", "splits", "overpayments"];
    for (const col of subCollections) {
      const snap = await getDocs(collection(db, "users", userId, col));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    }
    await deleteDoc(doc(db, "profiles", userId));
    if (currentUser?.id === userId) await logout();
  };

  // Show a full-screen loader while Firebase resolves auth state
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#1e1b4b,#312e81,#4c1d95)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "4px solid rgba(255,255,255,.2)",
          borderTopColor: "#fff",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 14 }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ users, currentUser, register, login, logout, removeUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};