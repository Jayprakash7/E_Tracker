import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PRESET_COLORS = [
  '#6366f1', '#f59e0b', '#3b82f6', '#ec4899',
  '#8b5cf6', '#22c55e', '#ef4444', '#06b6d4',
  '#f97316', '#14b8a6', '#a855f7', '#64748b',
];

const PRESET_ICONS = ['🍔', '🚗', '🛍️', '💡', '💊', '🎬', '📚', '📦', '✈️', '🏠', '💰', '🎵', '🍕', '☕', '🏋️', '🎮'];

const EMPTY_FORM = { name: '', color: '#6366f1', icon: '📦' };

export default function ManageCategories() {
  const { categories, expenses, addCategory, updateCategory, deleteCategory } = useApp();

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const getExpenseCount = (catId) => expenses.filter((e) => e.categoryId === catId).length;

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (
      categories.some(
        (c) => c.name.toLowerCase() === form.name.toLowerCase().trim() && c.id !== editingId
      )
    )
      errs.name = 'Category name already exists';
    return errs;
  };

  const startAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
    setShowAdd(true);
  };

  const startEdit = (cat) => {
    setForm({ name: cat.name, color: cat.color, icon: cat.icon });
    setErrors({});
    setEditingId(cat.id);
    setShowAdd(true);
  };

  const handleCancel = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (editingId) {
      updateCategory(editingId, { name: form.name.trim(), color: form.color, icon: form.icon });
    } else {
      addCategory({ name: form.name.trim(), color: form.color, icon: form.icon });
    }
    handleCancel();
  };

  const handleDelete = (id) => {
    deleteCategory(id);
    expenses
      .filter((e) => e.categoryId === id)
      .forEach((e) => {/* expenses without category will show "Other" via getCategoryById returning undefined */ });
    setConfirmDelete(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Categories</h1>
          <p className="page-subtitle">{categories.length} categories</p>
        </div>
        <button className="btn btn-primary" onClick={startAdd}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Add / Edit form */}
      {showAdd && (
        <div className="card form-card category-form">
          <h3 className="form-section-title">
            {editingId ? 'Edit Category' : 'New Category'}
          </h3>

          <div className="form-group">
            <label className="form-label">Name <span className="required">*</span></label>
            <input
              type="text"
              className={`form-input ${errors.name ? 'form-input--error' : ''}`}
              placeholder="e.g. Groceries"
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                if (errors.name) setErrors((p) => ({ ...p, name: '' }));
              }}
              maxLength={40}
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${form.color === c ? 'color-swatch--active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="icon-picker">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={`icon-swatch ${form.icon === ic ? 'icon-swatch--active' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, icon: ic }))}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="cat-preview">
            <span
              className="cat-preview-icon"
              style={{ background: form.color + '22' }}
            >
              {form.icon}
            </span>
            <span className="cat-preview-name" style={{ color: form.color }}>
              {form.name || 'Preview'}
            </span>
          </div>

          <div className="form-actions">
            <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editingId ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </div>
      )}

      {/* Category list */}
      <div className="category-list">
        {categories.map((cat) => {
          const count = getExpenseCount(cat.id);
          return (
            <div key={cat.id} className="category-card">
              <div
                className="cat-card-icon"
                style={{ background: cat.color + '22', borderColor: cat.color + '44' }}
              >
                <span>{cat.icon}</span>
              </div>
              <div className="cat-card-info">
                <p className="cat-card-name">{cat.name}</p>
                <p className="cat-card-meta">{count} expense{count !== 1 ? 's' : ''}</p>
              </div>
              <div
                className="cat-card-color"
                style={{ background: cat.color }}
              />
              <div className="expense-actions">
                <button
                  className="icon-btn icon-btn--edit"
                  onClick={() => startEdit(cat)}
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-btn icon-btn--delete"
                  onClick={() => setConfirmDelete(cat)}
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete &ldquo;{confirmDelete.name}&rdquo;?</h3>
            {getExpenseCount(confirmDelete.id) > 0 && (
              <p className="warn-text">
                ⚠️ {getExpenseCount(confirmDelete.id)} expense(s) use this category. They will show as &quot;Unknown&quot;.
              </p>
            )}
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
