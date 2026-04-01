import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { SplitProvider } from './context/SplitContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AddExpense from './components/AddExpense';
import ExpenseList from './components/ExpenseList';
import Reports from './components/Reports';
import ManageCategories from './components/ManageCategories';
import SplitsPage from './components/SplitsPage';
import LoginPage from './components/LoginPage';

function AppContent() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <AppProvider key={currentUser.id} userId={currentUser.id}>
      <SplitProvider key={currentUser.id} userId={currentUser.id}>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/add"        element={<AddExpense />} />
              <Route path="/expenses"   element={<ExpenseList />} />
              <Route path="/reports"    element={<Reports />} />
              <Route path="/categories" element={<ManageCategories />} />
              <Route path="/splits"     element={<SplitsPage />} />
            </Routes>
          </main>
        </div>
      </SplitProvider>
    </AppProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
