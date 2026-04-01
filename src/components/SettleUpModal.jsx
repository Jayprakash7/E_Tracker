import { useState } from 'react';
import { X } from 'lucide-react';
import { useSplit } from '../context/SplitContext';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function SettleUpModal({ person, onClose }) {
  const { splits, settlePersonTotal, getEntryRemaining, getPersonOutstanding } = useSplit();

  const [amount, setAmount] = useState('');
  const [note,   setNote]   = useState('');
  const [error,  setError]  = useState('');

  const totalOwed = getPersonOutstanding(person.id);
  const val       = parseFloat(amount) || 0;
  const overpaid  = val > totalOwed ? Math.round((val - totalOwed) * 100) / 100 : 0;

  // Person's unsettled splits sorted oldest first
  const personSplits = splits
    .filter(s => s.entries.some(e => e.personId === person.id && getEntryRemaining(e) > 0))
    .sort((a, b) => new Date(a.expenseDate) - new Date(b.expenseDate));

  // Preview â€” which splits will be cleared and whether there's overpayment
  const getPreview = () => {
    let remaining = val;
    const rows = personSplits.map(s => {
      const entry     = s.entries.find(e => e.personId === person.id);
      const owed      = getEntryRemaining(entry);
      const toSettle  = Math.min(owed, remaining);
      remaining       = Math.max(0, Math.round((remaining - toSettle) * 100) / 100);
      return { title: s.expenseTitle, date: s.expenseDate, owed, toSettle, fullyCleared: toSettle >= owed };
    }).filter(p => p.toSettle > 0);
    return rows;
  };

  const preview = getPreview();

  const handleSettle = () => {
    if (!val || val <= 0) { setError('Enter a valid amount'); return; }
    settlePersonTotal(person.id, val, note);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settle-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="settle-person-info">
            <span className="settle-avatar" style={{ background: person.color }}>
              {person.name[0]}
            </span>
            <div>
              <h3>Settle Up with {person.name}</h3>
              <p className="settle-owed-label">
                Outstanding: <strong>{formatCurrency(totalOwed)}</strong>
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Breakdown of splits */}
        <div className="settle-breakdown">
          {personSplits.map(s => {
            const entry = s.entries.find(e => e.personId === person.id);
            return (
              <div key={s.id} className="settle-breakdown-row">
                <div className="settle-breakdown-info">
                  <span className="settle-breakdown-title">{s.expenseTitle}</span>
                  <span className="settle-breakdown-date">{formatDate(s.expenseDate)}</span>
                </div>
                <span className="settle-breakdown-amount" style={{ color: person.color }}>
                  {formatCurrency(getEntryRemaining(entry))}
                </span>
              </div>
            );
          })}
        </div>

        {/* Amount input */}
        <div className="form-group" style={{ marginTop: 18 }}>
          <label className="form-label">
            Amount received from {person.name}
          </label>
          <div className="settle-input-row">
            <div className="settle-input-wrap">
              <span className="settle-prefix">₹</span>
              <input
                autoFocus
                type="number"
                className={`form-input ${error ? 'form-input--error' : ''}`}
                style={{ paddingLeft: 28 }}
                placeholder="0.00"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                min="0.01"
                step="0.01"
              />
            </div>
            <button
              type="button"
              className="btn btn-ghost settle-full-btn"
              onClick={() => { setAmount(String(totalOwed)); setError(''); }}
            >
              Full ₹{totalOwed.toFixed(0)}
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>

        {/* Preview: normal splits cleared */}
        {preview.length > 0 && (
          <div className="settle-preview">
            <p className="settle-preview-label">This will apply to:</p>
            {preview.map((p, i) => (
              <div key={i} className="settle-preview-row">
                <span className="settle-preview-title">{p.title}</span>
                {p.fullyCleared ? (
                  <span className="settle-preview-cleared">✓ Fully cleared</span>
                ) : (
                  <span className="settle-preview-partial">
                    ₹{p.toSettle.toFixed(2)} / ₹{p.owed.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Overpayment notice */}
        {overpaid > 0 && (
          <div className="overpay-notice">
            <span className="overpay-icon">⚠️</span>
            <div className="overpay-text">
              <strong>{formatCurrency(overpaid)} extra</strong> — all dues cleared +
              you will owe {formatCurrency(overpaid)} back to {person.name}.
              This will be shown under <em>"You Owe"</em> on the Splits page.
            </div>
          </div>
        )}

        {/* Note */}
        <div className="form-group">
          <label className="form-label">Note <span className="optional">(optional)</span></label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. GPay, Cash, UPI..."
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={50}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ background: person.color, borderColor: person.color }}
            onClick={handleSettle}
          >
            Record Payment
          </button>
        </div>

      </div>
    </div>
  );
}