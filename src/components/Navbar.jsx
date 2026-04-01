import { NavLink } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  List,
  BarChart2,
  Tag,
  Wallet,
  Plus,
  LogOut,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Desktop sidebar — all pages
const DESKTOP_NAV = [
  { to: '/',           label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/add',        label: 'Add Expense', icon: PlusCircle },
  { to: '/expenses',   label: 'Expenses',    icon: List },
  { to: '/splits',     label: 'Splits',      icon: Users },
  { to: '/reports',    label: 'Reports',     icon: BarChart2 },
  { to: '/categories', label: 'Categories',  icon: Tag },
];

// Mobile bottom nav — 5 key pages (FAB handles Add)
const MOBILE_NAV = [
  { to: '/',         label: 'Home',      icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses',  icon: List },
  { to: '/splits',   label: 'Splits',    icon: Users },
  { to: '/reports',  label: 'Reports',   icon: BarChart2 },
  { to: '/categories', label: 'More',   icon: Tag },
];

export default function Navbar() {
  const { currentUser, logout } = useAuth();

  return (
    <>
      {/* ── Mobile top header ── */}
      <header className="mobile-topbar">
        <div className="mobile-brand">
          <Wallet size={20} className="brand-icon" />
          <span className="brand-name">E-Tracker</span>
        </div>
        <div className="mobile-user-info">
          <div
            className="user-avatar user-avatar--sm"
            style={{ background: currentUser.bg, color: currentUser.color }}
          >
            {currentUser.initials}
          </div>
          <span className="mobile-user-name">{currentUser.name}</span>
          <button className="icon-btn topbar-logout" onClick={logout} title="Logout">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* ── Sidebar (desktop) ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Wallet size={26} className="brand-icon" />
          <span className="brand-name">E-Tracker</span>
        </div>
        <nav className="sidebar-nav">
          {DESKTOP_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div
            className="user-avatar user-avatar--sm"
            style={{ background: currentUser.bg, color: currentUser.color }}
          >
            {currentUser.initials}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{currentUser.name}</p>
            <p className="sidebar-user-role">My Account</p>
          </div>
          <button className="icon-btn icon-btn--logout" onClick={logout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="bottom-nav">
        {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'bottom-nav-item--active' : ''}`
            }
          >
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── FAB: floating add button on mobile ── */}
      <Link to="/add" className="fab" aria-label="Add expense">
        <Plus size={26} />
      </Link>
    </>
  );
}
