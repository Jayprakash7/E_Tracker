import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todayString } from '../utils/helpers';
import { X } from 'lucide-react';

export default function EditExpenseModal({ expense, onClose }) {
  const { categories, updateExpense } = useApp();

  const [form, setForm] = useState({
    title: expense.title,
    amount: String(expense.amount),
    categoryId: expense.categoryId,
    date: expense.date,
    notes: expense.notes || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0)
      errs.amount = 'Enter a valid amount';
    if (!form.categoryId) errs.categoryId = 'Please select a category';
    if (!form.date) errs.date = 'Date is required';
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
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    updateExpense(expense.id, {
      title: form.title.trim(),
      amount: parseFloat(form.amount),
      categoryId: form.categoryId,
      date: form.date,
      notes: form.notes.trim(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Expense</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Title <span className="required">*</span></label>
            <input name="title" type="text" className={`form-input ${errors.title ? 'form-input--error' : ''}`}
              value={form.title} onChange={handleChange} maxLength={80} />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) <span className="required">*</span></label>
            <input name="amount" type="number" className={`form-input ${errors.amount ? 'form-input--error' : ''}`}
              value={form.amount} onChange={handleChange} min="0.01" step="0.01" />
            {errors.amount && <p className="form-error">{errors.amount}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Category <span className="required">*</span></label>
            <select name="categoryId" className={`form-input ${errors.categoryId ? 'form-input--error' : ''}`}
              value={form.categoryId} onChange={handleChange}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="form-error">{errors.categoryId}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Date <span className="required">*</span></label>
            <input name="date" type="date" className={`form-input ${errors.date ? 'form-input--error' : ''}`}
              value={form.date} onChange={handleChange} max={todayString()} />
            {errors.date && <p className="form-error">{errors.date}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Notes <span className="optional">(optional)</span></label>
            <textarea name="notes" className="form-input form-textarea"
              value={form.notes} onChange={handleChange} rows={2} maxLength={200} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
