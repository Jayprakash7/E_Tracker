import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, SplitSquareVertical } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSplit } from '../context/SplitContext';
import SplitSection from './SplitSection';
import { todayString } from '../utils/helpers';

const INITIAL_FORM = {
  title: '',
  amount: '',
  categoryId: '',
  date: todayString(),
  notes: '',
};

export default function AddExpense() {
  const { categories, addExpense } = useApp();
  const { addSplit } = useSplit();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [enableSplit,  setEnableSplit]  = useState(false);
  const [splitEntries, setSplitEntries] = useState(null); // [{personId, personName, shareAmount}]
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0)
      errs.amount = 'Enter a valid amount';
    if (!form.categoryId) errs.categoryId = 'Please select a category';
    if (!form.date) errs.date = 'Date is required';
    if (enableSplit && splitEntries) {
      const splitTotal = splitEntries.reduce((t, e) => t + e.shareAmount, 0);
      if (splitTotal > parseFloat(form.amount || 0) + 0.01)
        errs.split = 'Split amounts exceed the total expense';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const expense = addExpense({
      title: form.title.trim(),
      amount: parseFloat(form.amount),
      categoryId: form.categoryId,
      date: form.date,
      notes: form.notes.trim(),
    });
    // Save split if configured
    if (enableSplit && splitEntries && splitEntries.length > 0) {
      addSplit({
        expenseId:     expense.id,
        expenseTitle:  form.title.trim(),
        expenseDate:   form.date,
        totalAmount:   parseFloat(form.amount),
        entries:       splitEntries,
      });
    }
    setSuccess(true);
    setForm({ ...INITIAL_FORM, date: todayString() });
    setEnableSplit(false);
    setSplitEntries(null);
    setErrors({});
    setTimeout(() => {
      setSuccess(false);
      navigate('/expenses');
    }, 1500);
  };

  const handleReset = () => {
    setForm({ ...INITIAL_FORM, date: todayString() });
    setErrors({});
    setEnableSplit(false);
    setSplitEntries(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Expense</h1>
          <p className="page-subtitle">Record a new expense</p>
        </div>
      </div>

      {success && (
        <div className="alert alert--success">
          <CheckCircle size={18} />
          <span>Expense added successfully!</span>
        </div>
      )}

      <div className="card form-card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={`form-input ${errors.title ? 'form-input--error' : ''}`}
              placeholder="e.g. Lunch at restaurant"
              value={form.title}
              onChange={handleChange}
              maxLength={80}
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label" htmlFor="amount">
              Amount (₹) <span className="required">*</span>
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              className={`form-input ${errors.amount ? 'form-input--error' : ''}`}
              placeholder="0.00"
              value={form.amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
            />
            {errors.amount && <p className="form-error">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="categoryId">
              Category <span className="required">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className={`form-input ${errors.categoryId ? 'form-input--error' : ''}`}
              value={form.categoryId}
              onChange={handleChange}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="form-error">{errors.categoryId}</p>
            )}
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="date">
              Date <span className="required">*</span>
            </label>
            <input
              id="date"
              name="date"
              type="date"
              className={`form-input ${errors.date ? 'form-input--error' : ''}`}
              value={form.date}
              onChange={handleChange}
              max={todayString()}
            />
            {errors.date && <p className="form-error">{errors.date}</p>}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="notes">
              Notes <span className="optional">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              className="form-input form-textarea"
              placeholder="Any additional details..."
              value={form.notes}
              onChange={handleChange}
              rows={3}
              maxLength={200}
            />
          </div>

          {/* ── Split toggle ── */}
          <div className="split-toggle-wrap">
            <label className="split-toggle-label">
              <div className="split-toggle-text">
                <SplitSquareVertical size={16} />
                <span>Split this expense</span>
              </div>
              <div
                className={`toggle-switch ${enableSplit ? 'toggle-switch--on' : ''}`}
                onClick={() => { setEnableSplit(v => !v); setSplitEntries(null); }}
                role="switch"
                aria-checked={enableSplit}
                tabIndex={0}
                onKeyDown={e => e.key === ' ' && setEnableSplit(v => !v)}
              >
                <span className="toggle-thumb" />
              </div>
            </label>
          </div>

          {/* Split section */}
          {enableSplit && (
            <SplitSection
              totalAmount={form.amount}
              onSplitChange={setSplitEntries}
            />
          )}
          {errors.split && <p className="form-error" style={{ marginTop: -8 }}>{errors.split}</p>}

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={handleReset}>
              Clear
            </button>
            <button type="submit" className="btn btn-primary">
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
