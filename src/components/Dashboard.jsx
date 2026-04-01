import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, ArrowUpRight, Calendar, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSplit } from '../context/SplitContext';
import {
  formatCurrency,
  formatDate,
  getMonthName,
  getMonthExpenses,
  getTotalAmount,
  getCategoryTotals,
  getMonthlyTotals,
} from '../utils/helpers';

export default function Dashboard() {
  const { expenses, categories, getCategoryById } = useApp();
  const { people, getTotalOutstanding, getPersonOutstanding, getPersonBalance } = useSplit();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const monthExpenses = useMemo(
    () => getMonthExpenses(expenses, currentMonth, currentYear),
    [expenses, currentMonth, currentYear]
  );

  const todayExpenses = useMemo(
    () => expenses.filter((e) => e.date === todayStr),
    [expenses, todayStr]
  );

  const monthTotal = useMemo(() => getTotalAmount(monthExpenses), [monthExpenses]);
  const todayTotal = useMemo(() => getTotalAmount(todayExpenses), [todayExpenses]);

  const categoryTotals = useMemo(
    () => getCategoryTotals(monthExpenses, categories),
    [monthExpenses, categories]
  );

  const monthlyTrend = useMemo(() => getMonthlyTotals(expenses, 6), [expenses]);

  const recentExpenses = useMemo(
    () => [...expenses].slice(0, 8),
    [expenses]
  );

  const topCategory = categoryTotals[0];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {getMonthName(currentMonth)} {currentYear}
          </p>
        </div>
        <Link to="/add" className="btn btn-primary hide-on-mobile">
          + Add Expense
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--primary">
          <div className="stat-icon">
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">This Month</p>
            <p className="stat-value">{formatCurrency(monthTotal)}</p>
            <p className="stat-meta">{monthExpenses.length} transactions</p>
          </div>
        </div>

        <div className="stat-card stat-card--orange">
          <div className="stat-icon">
            <Calendar size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Today</p>
            <p className="stat-value">{formatCurrency(todayTotal)}</p>
            <p className="stat-meta">{todayExpenses.length} transactions</p>
          </div>
        </div>

        <div className="stat-card stat-card--green">
          <div className="stat-icon">
            <ShoppingBag size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Expenses</p>
            <p className="stat-value">{expenses.length}</p>
            <p className="stat-meta">all time</p>
          </div>
        </div>

        <div className="stat-card stat-card--purple">
          <div className="stat-icon">
            <ArrowUpRight size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Top Category</p>
            <p className="stat-value stat-value--sm">
              {topCategory ? topCategory.icon + ' ' + topCategory.name : '—'}
            </p>
            <p className="stat-meta">
              {topCategory ? formatCurrency(topCategory.total) : 'No expenses yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Monthly Trend */}
        <div className="card chart-card">
          <h2 className="card-title">Monthly Trend</h2>
          {monthlyTrend.every((m) => m.amount === 0) ? (
            <div className="empty-chart">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card chart-card dash-pie-card">
          <h2 className="card-title">This Month by Category</h2>
          {categoryTotals.length === 0 ? (
            <div className="empty-chart">No expenses this month</div>
          ) : (
            <div className="dash-pie-wrap">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={38}
                    dataKey="total"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {categoryTotals.map((cat) => (
                      <Cell key={cat.id} fill={cat.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [formatCurrency(v), name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Custom legend grid */}
              <div className="dash-pie-legend">
                {categoryTotals.map((cat) => {
                  const pct = monthTotal > 0 ? ((cat.total / monthTotal) * 100).toFixed(0) : 0;
                  return (
                    <div key={cat.id} className="dash-pie-leg-item">
                      <span className="dash-pie-leg-dot" style={{ background: cat.color }} />
                      <span className="dash-pie-leg-icon">{cat.icon}</span>
                      <span className="dash-pie-leg-name">{cat.name}</span>
                      <span className="dash-pie-leg-pct" style={{ color: cat.color }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Transactions</h2>
          <Link to="/expenses" className="link-btn">
            View All →
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses yet.</p>
            <Link to="/add" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Add your first expense
            </Link>
          </div>
        ) : (
          <div className="transaction-list">
            {recentExpenses.map((expense) => {
              const cat = getCategoryById(expense.categoryId);
              return (
                <div key={expense.id} className="transaction-item">
                  <div className="transaction-icon" style={{ background: cat?.color + '22' }}>
                    <span>{cat?.icon || '📦'}</span>
                  </div>
                  <div className="transaction-info">
                    <p className="transaction-title">{expense.title}</p>
                    <p className="transaction-meta">
                      {cat?.name || 'Other'} • {formatDate(expense.date)}
                    </p>
                  </div>
                  <p className="transaction-amount">
                    -{formatCurrency(expense.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}      </div>

      {/* Outstanding splits summary */}
      {getTotalOutstanding() > 0 && (
        <div className="card splits-dashboard-card">
          <div className="card-header">
            <h2 className="card-title">💸 Outstanding Dues</h2>
            <Link to="/splits" className="link-btn">View All →</Link>
          </div>
          <p className="splits-dash-total">
            {formatCurrency(getTotalOutstanding())} to receive
          </p>
          <div className="splits-dash-people">
            {people
              .filter(p => getPersonBalance(p.id) > 0)
              .map(person => (
                <div key={person.id} className="splits-dash-row">
                  <span className="splits-dash-avatar" style={{ background: person.color }}>
                    {person.name[0]}
                  </span>
                  <span className="splits-dash-name">{person.name}</span>
                  <span className="splits-dash-amount" style={{ color: person.color }}>
                    {formatCurrency(getPersonBalance(person.id))}
                  </span>
                  <span className="splits-dash-label">owes you</span>
                </div>
              ))}
            {people
              .filter(p => getPersonBalance(p.id) < 0)
              .map(person => (
                <div key={person.id} className="splits-dash-row">
                  <span className="splits-dash-avatar" style={{ background: person.color }}>
                    {person.name[0]}
                  </span>
                  <span className="splits-dash-name">{person.name}</span>
                  <span className="splits-dash-amount" style={{ color: '#f97316' }}>
                    {formatCurrency(Math.abs(getPersonBalance(person.id)))}
                  </span>
                  <span className="splits-dash-label" style={{ color: '#f97316' }}>you owe</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
