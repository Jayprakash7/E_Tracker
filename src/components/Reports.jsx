import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { Wallet, TrendingUp, Tag, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSplit } from '../context/SplitContext';
import {
  formatCurrency,
  getMonthName,
  getMonthExpenses,
  getPersonalTotal,
  getPersonalCategoryTotals,
  getPersonalDailyTotals,
  getPersonalMonthlyTotals,
  getWeeklyTotals,
} from '../utils/helpers';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i, label: getMonthName(i) }));
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function Reports() {
  const { expenses, categories } = useApp();
  const { splits } = useSplit();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const monthExpenses = useMemo(
    () => getMonthExpenses(expenses, selectedMonth, selectedYear),
    [expenses, selectedMonth, selectedYear]
  );

  // ── Everything below is MY personal spend only ──
  const myMonthTotal = useMemo(
    () => getPersonalTotal(monthExpenses, splits),
    [monthExpenses, splits]
  );

  const myAvgDaily = useMemo(() => {
    if (monthExpenses.length === 0) return 0;
    const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return myMonthTotal / days;
  }, [myMonthTotal, monthExpenses, selectedMonth, selectedYear]);

  const myCategoryTotals = useMemo(
    () => getPersonalCategoryTotals(monthExpenses, categories, splits),
    [monthExpenses, categories, splits]
  );

  const myDailyData = useMemo(
    () => getPersonalDailyTotals(monthExpenses, selectedMonth, selectedYear, splits),
    [monthExpenses, selectedMonth, selectedYear, splits]
  );

  const myYearlyTrend = useMemo(
    () => getPersonalMonthlyTotals(expenses, splits, 12),
    [expenses, splits]
  );

  const weeklyData = useMemo(
    () => getWeeklyTotals(expenses, splits, 4),
    [expenses, splits]
  );

  const topCategory = myCategoryTotals[0];

  const myAllTimeTotal = useMemo(
    () => getPersonalTotal(expenses, splits),
    [expenses, splits]
  );

  const myAllTimePercent = useMemo(
    () => myAllTimeTotal > 0 ? ((myMonthTotal / myAllTimeTotal) * 100).toFixed(1) : 0,
    [myMonthTotal, myAllTimeTotal]
  );

  return (
    <div className="page">
      <div className="reports-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Your personal spending — splits excluded</p>
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

      {/* Summary cards — all MY spend */}
      <div className="stats-grid stats-grid--4">
        <div className="stat-card stat-card--primary">
          <div className="stat-icon"><Wallet size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">My Spend</p>
            <p className="stat-value">{formatCurrency(myMonthTotal)}</p>
            <p className="stat-meta">{monthExpenses.length} transactions</p>
          </div>
        </div>
        <div className="stat-card stat-card--orange">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">My Daily Avg</p>
            <p className="stat-value">{formatCurrency(myAvgDaily)}</p>
            <p className="stat-meta">per day this month</p>
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
          <div className="stat-icon"><CalendarDays size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">% of My All Time</p>
            <p className="stat-value">{myAllTimePercent}%</p>
            <p className="stat-meta">of total personal spend</p>
          </div>
        </div>
      </div>

      {/* Weekly Personal Breakdown */}
      <div className="card chart-card chart-card--full">
        <div className="weekly-card-header">
          <div>
            <h2 className="card-title">Weekly Breakdown</h2>
            <p className="card-subtitle">Your actual spend each week</p>
          </div>
        </div>
        {weeklyData.every(w => w.personal === 0) ? (
          <div className="empty-chart">No data yet</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v === 0 ? '' : `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'My Spend']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="personal" fill="#6366f1" radius={[4, 4, 0, 0]} name="My Spend" />
              </BarChart>
            </ResponsiveContainer>
            <div className="weekly-summary-row">
              {weeklyData.map((w, i) => (
                <div key={i} className="weekly-summary-item">
                  <p className="wsi-label">{w.label}</p>
                  <p className="wsi-personal">{formatCurrency(w.personal)}</p>
                  {w.total > w.personal && (
                    <p className="wsi-saved">+{formatCurrency(w.total - w.personal)} split</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Daily spending chart — my spend only */}
      <div className="card chart-card chart-card--full">
        <h2 className="card-title">
          My Daily Spend — {getMonthName(selectedMonth)} {selectedYear}
        </h2>
        {myMonthTotal === 0 ? (
          <div className="empty-chart">No personal expenses this month</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={myDailyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v === 0 ? '' : `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(l) => `Day ${l}`} />
              <Bar dataKey="amount" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie + Category table — my spend only */}
      <div className="charts-row">
        <div className="card chart-card">
          <h2 className="card-title">My Category Breakdown</h2>
          {myCategoryTotals.length === 0 ? (
            <div className="empty-chart">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={myCategoryTotals}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  dataKey="total"
                  nameKey="name"
                >
                  {myCategoryTotals.map((cat) => (
                    <Cell key={cat.id} fill={cat.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category summary table — my spend only */}
        <div className="card">
          <h2 className="card-title">My Category Summary</h2>
          {myCategoryTotals.length === 0 ? (
            <div className="empty-state"><p>No personal expenses this month.</p></div>
          ) : (
            <div className="category-table">
              {myCategoryTotals.map((cat) => {
                const pct = myMonthTotal > 0 ? ((cat.total / myMonthTotal) * 100).toFixed(1) : 0;
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

      {/* 12-month personal trend */}
      <div className="card chart-card chart-card--full">
        <h2 className="card-title">12-Month Personal Spend Trend</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={myYearlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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

