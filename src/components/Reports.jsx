import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { Wallet, TrendingUp, Tag, Percent } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency,
  getMonthName,
  getMonthExpenses,
  getTotalAmount,
  getCategoryTotals,
  getDailyTotals,
  getMonthlyTotals,
} from '../utils/helpers';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i, label: getMonthName(i) }));
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function Reports() {
  const { expenses, categories } = useApp();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const monthExpenses = useMemo(
    () => getMonthExpenses(expenses, selectedMonth, selectedYear),
    [expenses, selectedMonth, selectedYear]
  );

  const monthTotal = useMemo(() => getTotalAmount(monthExpenses), [monthExpenses]);
  const avgDaily = useMemo(() => {
    if (monthExpenses.length === 0) return 0;
    const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return monthTotal / days;
  }, [monthExpenses, monthTotal, selectedMonth, selectedYear]);

  const categoryTotals = useMemo(
    () => getCategoryTotals(monthExpenses, categories),
    [monthExpenses, categories]
  );

  const dailyData = useMemo(
    () => getDailyTotals(monthExpenses, selectedMonth, selectedYear),
    [monthExpenses, selectedMonth, selectedYear]
  );

  const yearlyTrend = useMemo(() => getMonthlyTotals(expenses, 12), [expenses]);

  const topCategory = categoryTotals[0];

  const totalMonthPercent = useMemo(() => {
    const grand = getTotalAmount(expenses);
    return grand > 0 ? ((monthTotal / grand) * 100).toFixed(1) : 0;
  }, [monthTotal, expenses]);

  return (
    <div className="page">
      <div className="reports-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Spending analysis & insights</p>
        </div>
        <div className="filters-group reports-filters">
          <select
            className="form-input filter-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className="form-input filter-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid stats-grid--4">
        <div className="stat-card stat-card--primary">
          <div className="stat-icon"><Wallet size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">Total Spending</p>
            <p className="stat-value">{formatCurrency(monthTotal)}</p>
            <p className="stat-meta">{monthExpenses.length} transactions</p>
          </div>
        </div>
        <div className="stat-card stat-card--orange">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">Daily Average</p>
            <p className="stat-value">{formatCurrency(avgDaily)}</p>
            <p className="stat-meta">per day</p>
          </div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="stat-icon"><Tag size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">Top Category</p>
            <p className="stat-value stat-value--sm">
              {topCategory ? topCategory.icon + ' ' + topCategory.name : '—'}
            </p>
            <p className="stat-meta">
              {topCategory ? formatCurrency(topCategory.total) : 'No data'}
            </p>
          </div>
        </div>
        <div className="stat-card stat-card--purple">
          <div className="stat-icon"><Percent size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">% of All Time</p>
            <p className="stat-value">{totalMonthPercent}%</p>
            <p className="stat-meta">of total spending</p>
          </div>
        </div>
      </div>

      {/* Daily spending chart */}
      <div className="card chart-card chart-card--full">
        <h2 className="card-title">
          Daily Spending — {getMonthName(selectedMonth)} {selectedYear}
        </h2>
        {monthTotal === 0 ? (
          <div className="empty-chart">No expenses this month</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v === 0 ? '' : `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(l) => `Day ${l}`} />
              <Bar dataKey="amount" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie + Category table */}
      <div className="charts-row">
        <div className="card chart-card">
          <h2 className="card-title">Category Breakdown</h2>
          {categoryTotals.length === 0 ? (
            <div className="empty-chart">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryTotals}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  dataKey="total"
                  nameKey="name"
                >
                  {categoryTotals.map((cat) => (
                    <Cell key={cat.id} fill={cat.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category summary table */}
        <div className="card">
          <h2 className="card-title">Category Summary</h2>
          {categoryTotals.length === 0 ? (
            <div className="empty-state"><p>No expenses this month.</p></div>
          ) : (
            <div className="category-table">
              {categoryTotals.map((cat) => {
                const pct = monthTotal > 0 ? ((cat.total / monthTotal) * 100).toFixed(1) : 0;
                return (
                  <div key={cat.id} className="cat-row">
                    <div className="cat-row-top">
                      <div className="cat-row-left">
                        <span className="cat-dot" style={{ background: cat.color }} />
                        <span className="cat-icon">{cat.icon}</span>
                        <span className="cat-name">{cat.name}</span>
                      </div>
                      <div className="cat-row-meta">
                        <span className="cat-pct">{pct}%</span>
                        <span className="cat-amount">{formatCurrency(cat.total)}</span>
                      </div>
                    </div>
                    <div className="cat-bar-wrap">
                      <div className="cat-bar" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 12-month trend */}
      <div className="card chart-card chart-card--full">
        <h2 className="card-title">12-Month Spending Trend</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={yearlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#6366f1' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
