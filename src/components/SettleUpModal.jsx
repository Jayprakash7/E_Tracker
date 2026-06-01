import { useState } from 'react';
import { X, Download, Loader } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useSplit } from '../context/SplitContext';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function SettleUpModal({ person, onClose }) {
  const { splits, settlePersonTotal, getEntryRemaining, getPersonOutstanding } = useSplit();

  const [amount, setAmount] = useState('');
  const [note,   setNote]   = useState('');
  const [error,  setError]  = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const totalOwed = getPersonOutstanding(person.id);
  const val       = parseFloat(amount) || 0;
  const overpaid  = val > totalOwed ? Math.round((val - totalOwed) * 100) / 100 : 0;

  // Person's unsettled splits sorted oldest first
  const personSplits = splits
    .filter(s => s.entries.some(e => e.personId === person.id && getEntryRemaining(e) > 0))
    .sort((a, b) => new Date(a.expenseDate) - new Date(b.expenseDate));

  const downloadPDF = async () => {
    setPdfLoading(true);
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const rows = personSplits.map((s, i) => {
      const entry = s.entries.find(e => e.personId === person.id);
      const remaining = getEntryRemaining(entry);
      return `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
        <td style="padding:10px 14px;color:#1e293b;font-size:13px;border-bottom:1px solid #f1f5f9">${s.expenseTitle}</td>
        <td style="padding:10px 14px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9">${formatDate(s.expenseDate)}</td>
        <td style="padding:10px 14px;color:#6366f1;font-weight:700;font-size:13px;text-align:right;border-bottom:1px solid #f1f5f9">${formatCurrency(remaining)}</td>
      </tr>`;
    }).join('');

    // Build an off-screen div with the styled content
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;background:#fff;font-family:Arial,sans-serif;';
    container.innerHTML = `
      <div style="background:#6366f1;color:#fff;padding:24px 40px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:26px;font-weight:700">E-Tracker</span>
        <span style="font-size:12px;opacity:.85">Split &amp; Dues Statement</span>
      </div>
      <div style="padding:30px 40px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
          <div>
            <div style="font-size:18px;font-weight:700;color:#1e293b">${person.name}'s Outstanding Dues</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px">Generated on: ${date}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:#64748b">Total Outstanding</div>
            <div style="font-size:20px;font-weight:700;color:#6366f1">${formatCurrency(totalOwed)}</div>
          </div>
        </div>
        <div style="border-top:1px solid #e2e8f0;margin-bottom:16px"></div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:10px 14px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;text-align:left">Expense</th>
              <th style="padding:10px 14px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;text-align:left">Date</th>
              <th style="padding:10px 14px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;text-align:right">Amount Due</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:20px;background:#6366f1;border-radius:10px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
          <span style="color:#fff;font-size:14px;font-weight:700">Total to Receive</span>
          <span style="color:#fff;font-size:14px;font-weight:700">${formatCurrency(totalOwed)}</span>
        </div>
      </div>
      <div style="margin-top:20px;padding:12px 40px;background:#f1f5f9;display:flex;justify-content:space-between">
        <span style="font-size:10px;color:#64748b;font-style:italic">Made by Jay</span>
        <span style="font-size:10px;color:#64748b;font-style:italic">&copy; 2026 E-Tracker. All rights reserved.</span>
      </div>`;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, Math.min(imgH, pageH));
      pdf.save(`${person.name}_dues_statement.pdf`);
    } finally {
      document.body.removeChild(container);
      setPdfLoading(false);
    }
  };

  // Preview — which splits will be cleared and whether there's overpayment
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
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={downloadPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? <Loader size={15} className="spin" /> : <Download size={15} />}
            {pdfLoading ? 'Generating...' : 'Download PDF'}
          </button>
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