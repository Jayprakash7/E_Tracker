import { useState, useMemo } from 'react';
import { Trash2, Pencil, Search, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSplit } from '../context/SplitContext';
import {
  formatCurrency,
  formatDate,
  getMonthName,
  getPersonalAmount,
  getPersonalTotal,
} from '../utils/helpers';
import EditExpenseModal from './EditExpenseModal';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i, label: getMonthName(i) }));
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function ExpenseList() {
  const { expenses, categories, getCategoryById, deleteExpense } = useApp();
  const { splits } = useSplit();
  const hasSplit = (expenseId) => splits.some(s => s.expenseId === expenseId);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      const matchMonth = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      const matchCat = selectedCategory ? e.categoryId === selectedCategory : true;
      const matchSearch = search
        ? e.title.toLowerCase().includes(search.toLowerCase()) ||
          (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()))
        : true;
      return matchMonth && matchCat && matchSearch;
    });
  }, [expenses, selectedMonth, selectedYear, selectedCategory, search]);

  const total = useMemo(
    () => filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0),
    [filtered]
  );

  const myTotal = useMemo(
    () => getPersonalTotal(filtered, splits),
    [filtered, splits]
  );

  const handleDelete = (id) => {
    deleteExpense(id);
    setConfirmDelete(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">
            {getMonthName(selectedMonth)} {selectedYear}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card filters-bar">
        {/* Search */}
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <select
            className="form-input filter-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            className="form-input filter-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className="form-input filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary strip */}
      {filtered.length > 0 && (
        <div className="list-summary">
          <span>{filtered.length} expense{filtered.length !== 1 ? 's' : ''}</span>
          <div className="list-summary-right">
            <span className="list-total">Total: {formatCurrency(total)}</span>
            {myTotal < total && (
              <span className="list-my-total">My share: {formatCurrency(myTotal)}</span>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>No expenses found for this period.</p>
          </div>
        </div>
      ) : (
        <div className="expense-list">
          {filtered.map((expense) => {
            const cat = getCategoryById(expense.categoryId);
            return (
              <div key={expense.id} className="expense-card">
                <div
                  className="expense-cat-dot"
                  style={{ background: cat?.color || '#64748b' }}
                />
                <div
                  className="expense-icon"
                  style={{ background: (cat?.color || '#64748b') + '22' }}
                >
                  <span>{cat?.icon || '📦'}</span>
                </div>
                <div className="expense-info">
                    <p className="expense-title">
                      {expense.title}
                      {hasSplit(expense.id) && (
                        <span className="split-badge">Split</span>
                      )}
                    </p>
                  <p className="expense-meta">
                    {cat?.name || 'Other'} &nbsp;•&nbsp; {formatDate(expense.date)}
                    {expense.notes && (
                      <span className="expense-notes"> &nbsp;•&nbsp; {expense.notes}</span>
                    )}
                  </p>
                </div>
                <div className="expense-amount-col">
                  <p className="expense-amount">-{formatCurrency(expense.amount)}</p>
                  {hasSplit(expense.id) && (
                    <p className="expense-my-share">
                      My share: {formatCurrency(getPersonalAmount(expense, splits))}
                    </p>
                  )}
                </div>
                <div className="expense-actions">
                  <button
                    className="icon-btn icon-btn--edit"
                    onClick={() => setEditingExpense(expense)}
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-btn icon-btn--delete"
                    onClick={() => setConfirmDelete(expense.id)}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Expense?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(confirmDelete)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
}
