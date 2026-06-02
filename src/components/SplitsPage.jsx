import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Users, Plus, CheckCircle, ChevronDown, ChevronUp, History, Download, Loader } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useSplit } from '../context/SplitContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import SettleUpModal from './SettleUpModal';

export default function SplitsPage() {
  const {
    people, splits, overpayments,
    addPerson, deletePerson,
    deleteSplit, clearOverpayment,
    getEntryRemaining, getPersonOutstanding,
    getPersonOverpaid, getPersonBalance, getTotalOutstanding,
  } = useSplit();

  const [settleTarget,          setSettleTarget]          = useState(null);
  const [activeTab,             setActiveTab]             = useState('outstanding');
  const [expandedHistoryPerson, setExpandedHistoryPerson] = useState(null);
  const [pdfLoadingPerson,      setPdfLoadingPerson]      = useState(null);
  const [newPersonName,         setNewPersonName]         = useState('');
  const [showAddPerson,       setShowAddPerson]       = useState(false);
  const [confirmDeleteSplit,  setConfirmDeleteSplit]  = useState(null);

  const outstandingSplits  = splits.filter(s => s.entries.some(e => getEntryRemaining(e) > 0));
  const settledSplits      = splits.filter(s => s.entries.every(e => getEntryRemaining(e) === 0));
  const totalOutstanding   = getTotalOutstanding();
  const outstandingPeople  = people.filter(p => getPersonBalance(p.id) > 0);
  // People who overpaid (you owe them)
  const youOwePeople       = people.filter(p => getPersonBalance(p.id) < 0);

  const downloadHistoryPDF = async (person, personEntries, grandTotalPaid, grandTotalOwed, trueRemaining) => {
    setPdfLoadingPerson(person.id);
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const rows = personEntries.map((pe, i) => {
      const settlementRows = (pe.entry.settlements || [])
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(s => `
          <tr style="background:#f8fafc">
            <td style="padding:6px 14px 6px 28px;color:#64748b;font-size:12px;border-bottom:1px solid #f1f5f9">
              &nbsp;&nbsp;↳ ${new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </td>
            <td style="padding:6px 14px;color:#64748b;font-size:12px;border-bottom:1px solid #f1f5f9">${s.note || 'Payment'}</td>
            <td style="padding:6px 14px;color:#22c55e;font-weight:700;font-size:12px;text-align:right;border-bottom:1px solid #f1f5f9">+${formatCurrency(s.amount)}</td>
          </tr>`).join('');
      const remaining = pe.remaining;
      return `
        <tr style="background:${i % 2 === 0 ? '#f1f5f9' : '#fff'}">
          <td style="padding:9px 14px;color:#1e293b;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0">${pe.split.expenseTitle}</td>
          <td style="padding:9px 14px;color:#64748b;font-size:12px;border-bottom:1px solid #e2e8f0">${formatDate(pe.split.expenseDate)}</td>
          <td style="padding:9px 14px;color:${remaining > 0 ? '#ef4444' : '#22c55e'};font-weight:700;font-size:12px;text-align:right;border-bottom:1px solid #e2e8f0">
            ${remaining > 0 ? '₹' + remaining.toFixed(2) + ' left' : '✓ Cleared'}
          </td>
        </tr>
        ${settlementRows}`;
    }).join('');

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;background:#fff;font-family:Arial,sans-serif;';
    container.innerHTML = `
      <div style="background:#6366f1;color:#fff;padding:24px 40px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:26px;font-weight:700">E-Tracker</span>
        <span style="font-size:12px;opacity:.85">Payment History Statement</span>
      </div>
      <div style="padding:30px 40px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
          <div>
            <div style="font-size:18px;font-weight:700;color:#1e293b">${person.name} — Payment History</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px">Generated on: ${date}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:#64748b">Total Paid</div>
            <div style="font-size:20px;font-weight:700;color:#22c55e">${formatCurrency(grandTotalPaid)}</div>
            ${trueRemaining > 0
              ? `<div style="font-size:11px;color:#ef4444;font-weight:600;margin-top:4px">₹${trueRemaining.toFixed(2)} still due</div>`
              : `<div style="font-size:11px;color:#22c55e;font-weight:600;margin-top:4px">✓ Fully Cleared</div>`}
          </div>
        </div>
        <div style="border-top:1px solid #e2e8f0;margin-bottom:16px"></div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#6366f1">
              <th style="padding:10px 14px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;text-align:left">Expense</th>
              <th style="padding:10px 14px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;text-align:left">Date / Note</th>
              <th style="padding:10px 14px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;text-align:right">Status / Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:20px;display:flex;gap:12px">
          <div style="flex:1;background:#f0fdf4;border-radius:10px;padding:14px 20px;text-align:center">
            <div style="font-size:11px;color:#64748b">Total Paid</div>
            <div style="font-size:18px;font-weight:700;color:#16a34a">${formatCurrency(grandTotalPaid)}</div>
          </div>
          <div style="flex:1;background:${trueRemaining > 0 ? '#fef2f2' : '#f0fdf4'};border-radius:10px;padding:14px 20px;text-align:center">
            <div style="font-size:11px;color:#64748b">Still Due</div>
            <div style="font-size:18px;font-weight:700;color:${trueRemaining > 0 ? '#ef4444' : '#16a34a'}">${trueRemaining > 0 ? formatCurrency(trueRemaining) : '✓ Clear'}</div>
          </div>
        </div>
      </div>
      <div style="margin-top:20px;padding:12px 40px;background:#f1f5f9;display:flex;justify-content:space-between">
        <span style="font-size:10px;color:#64748b;font-style:italic">Made by Jay</span>
        <span style="font-size:10px;color:#64748b;font-style:italic">&copy; 2026 E-Tracker. All rights reserved.</span>
      </div>`;
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { scale: 1.5, useCORS: true, backgroundColor: '#fff', logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, Math.min(imgH, pageH));
      pdf.save(`${person.name}_payment_history.pdf`);
    } finally {
      document.body.removeChild(container);
      setPdfLoadingPerson(null);
    }
  };

  const handleAddPerson = () => {
    if (!newPersonName.trim()) return;
    addPerson(newPersonName.trim());
    setNewPersonName('');
    setShowAddPerson(false);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Splits & Dues</h1>
          <p className="page-subtitle">Track who owes you money</p>
        </div>
        <Link to="/add" className="btn btn-primary hide-on-mobile">+ Add Expense</Link>
      </div>

      {/* People summary — outstanding only */}
      {totalOutstanding > 0 && (
        <div className="card splits-summary-card">
          <div className="splits-summary-header">
            <div>
              <p className="splits-summary-label">Total to receive</p>
              <p className="splits-summary-amount">{formatCurrency(totalOutstanding)}</p>
            </div>
          </div>
          <div className="splits-people-row">
            {outstandingPeople.map(person => (
              <button
                key={person.id}
                className="splits-person-pill"
                style={{ borderColor: person.color }}
                onClick={() => setSettleTarget(person)}
              >
                <span className="splits-pill-avatar" style={{ background: person.color }}>
                  {person.name[0]}
                </span>
                <div className="splits-pill-info">
                  <span className="splits-pill-name">{person.name}</span>
                  <div className="splits-pill-footer">
                    <span className="splits-pill-amount" style={{ color: person.color }}>
                      {formatCurrency(getPersonBalance(person.id))}
                    </span>
                    <span className="splits-pill-settle">Settle →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── YOU OWE section (overpayments) ── */}
      {youOwePeople.length > 0 && (
        <div className="card you-owe-card">
          <div className="you-owe-header">
            <span className="you-owe-icon">↩️</span>
            <div>
              <p className="you-owe-title">You Owe</p>
              <p className="you-owe-subtitle">They overpaid — you need to return this</p>
            </div>
          </div>
          {youOwePeople.map(person => {
            const amountYouOwe = Math.abs(getPersonBalance(person.id));
            const personOverpays = overpayments.filter(o => o.personId === person.id);
            return (
              <div key={person.id} className="you-owe-row">
                <span className="you-owe-avatar" style={{ background: person.color }}>
                  {person.name[0]}
                </span>
                <div className="you-owe-info">
                  <span className="you-owe-name">{person.name}</span>
                  <span className="you-owe-detail">
                    paid {formatCurrency(getPersonOverpaid(person.id))} total
                  </span>
                </div>
                <div className="you-owe-right">
                  <span className="you-owe-amount">
                    Return {formatCurrency(amountYouOwe)}
                  </span>
                  {/* Mark individual overpayments as cleared once you return the cash */}
                  <div className="you-owe-overpays">
                    {personOverpays.map(o => (
                      <div key={o.id} className="you-owe-overpay-row">
                        <span className="you-owe-overpay-date">{o.date}</span>
                        <span className="you-owe-overpay-amount" style={{ color: person.color }}>
                          ₹{o.amount.toFixed(2)}
                          {o.note ? ` · ${o.note}` : ''}
                        </span>
                        <button
                          className="btn-settle-inline"
                          style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0', fontSize: 11 }}
                          onClick={() => clearOverpayment(o.id)}
                          title="Mark as returned"
                        >
                          ✓ Returned
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab switcher */}
      <div className="splits-tabs">
        <button
          className={`splits-tab ${activeTab === 'outstanding' ? 'splits-tab--active' : ''}`}
          onClick={() => setActiveTab('outstanding')}
        >
          Outstanding
          {outstandingSplits.length > 0 && (
            <span className="splits-tab-badge">{outstandingSplits.length}</span>
          )}
        </button>
        <button
          className={`splits-tab ${activeTab === 'history' ? 'splits-tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={14} />
          Payment History
        </button>
      </div>

      {/* ── OUTSTANDING TAB ── */}
      {activeTab === 'outstanding' && (
        <>
          {outstandingSplits.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <CheckCircle size={40} style={{ color: '#22c55e', marginBottom: 10 }} />
                <p style={{ fontWeight: 600 }}>All clear!</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  No outstanding dues.{' '}
                  <Link to="/add" className="link-btn">Add an expense</Link>{' '}
                  and use the split option.
                </p>
              </div>
            </div>
          ) : (
            <div className="split-cards">
              {outstandingSplits.map(split => (
                <div key={split.id} className="split-card">
                  <div className="split-card-top">
                    <div>
                      <p className="split-card-title">{split.expenseTitle}</p>
                      <p className="split-card-meta">
                        {formatDate(split.expenseDate)} · Total {formatCurrency(split.totalAmount)}
                      </p>
                    </div>
                    <button
                      className="icon-btn icon-btn--delete"
                      onClick={() => setConfirmDeleteSplit(split.id)}
                      title="Delete split"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="split-entries">
                    {split.entries.map(entry => {
                      const remaining = getEntryRemaining(entry);
                      const paid = entry.settlements.reduce((t, s) => t + s.amount, 0);
                      const person = people.find(p => p.id === entry.personId);
                      const color = person?.color || '#64748b';
                      const isSettled = remaining === 0;
                      return (
                        <div key={entry.personId} className={`split-entry ${isSettled ? 'split-entry--settled' : ''}`}>
                          <div className="split-entry-left">
                            <span className="split-entry-avatar" style={{ background: color }}>
                              {entry.personName[0].toUpperCase()}
                            </span>
                            <div className="split-entry-info">
                              <span className="split-entry-name">{entry.personName}</span>
                              <span className="split-entry-share-label">
                                Share: {formatCurrency(entry.shareAmount)}
                                {paid > 0 && ` · Paid: ${formatCurrency(paid)}`}
                              </span>
                            </div>
                          </div>
                          <div className="split-entry-right">
                            {isSettled ? (
                              <span className="split-cleared-badge">✓ Cleared</span>
                            ) : (
                              <>
                                <span className="split-remaining" style={{ color }}>
                                  ₹{remaining.toFixed(2)} left
                                </span>
                                <button
                                  className="btn-settle-inline"
                                  style={{ background: color + '20', color, borderColor: color + '40' }}
                                  onClick={() => person && setSettleTarget(person)}
                                >
                                  Settle
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (() => {
        const peopleWithHistory = people.filter(person =>
          splits.some(s => s.entries.some(e => e.personId === person.id && (e.settlements || []).length > 0))
        );
        if (peopleWithHistory.length === 0) return (
          <div className="card">
            <div className="empty-state">
              <History size={36} style={{ color: '#94a3b8', marginBottom: 10 }} />
              <p style={{ fontWeight: 600 }}>No payment history yet</p>
              <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-secondary)' }}>
                Payments will appear here once someone settles their dues.
              </p>
            </div>
          </div>
        );

        return (
          <div className="payment-history-list">
            {peopleWithHistory.map(person => {
              const personEntries = splits
                .filter(s => s.entries.some(e => e.personId === person.id && (e.settlements || []).length > 0))
                .map(s => {
                  const entry = s.entries.find(e => e.personId === person.id);
                  const totalPaid = (entry.settlements || []).reduce((t, se) => t + se.amount, 0);
                  const remaining = getEntryRemaining(entry);
                  return { split: s, entry, totalPaid, remaining };
                })
                .sort((a, b) => new Date(b.split.expenseDate) - new Date(a.split.expenseDate));

              const grandTotalPaid = personEntries.reduce((t, pe) => t + pe.totalPaid, 0);
              const grandTotalOwed = personEntries.reduce((t, pe) => t + pe.entry.shareAmount, 0);
              // True remaining = ALL splits for this person (not just the ones with payments)
              const trueRemaining  = getPersonOutstanding(person.id);
              const isExpanded     = expandedHistoryPerson === person.id;

              return (
                <div key={person.id} className="ph-person-card">
                  <button
                    className="ph-person-header"
                    onClick={() => setExpandedHistoryPerson(isExpanded ? null : person.id)}
                  >
                    <div className="ph-person-left">
                      <span className="ph-avatar" style={{ background: person.color }}>{person.name[0]}</span>
                      <div>
                        <p className="ph-person-name">{person.name}</p>
                        <p className="ph-person-sub">
                          Paid {formatCurrency(grandTotalPaid)} of {formatCurrency(grandTotalOwed)}
                            {trueRemaining > 0
                              ? <span className="ph-owing"> · ₹{trueRemaining.toFixed(2)} still due</span>
                              : <span className="ph-cleared"> · Fully cleared ✓</span>}
                          </p>
                        </div>
                      </div>
                      <div className="ph-person-right">
                        <span className={trueRemaining > 0 ? 'ph-badge ph-badge--due' : 'ph-badge ph-badge--done'}>
                          {trueRemaining > 0 ? `₹${trueRemaining.toFixed(2)} left` : '✓ Done'}
                      </span>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="ph-entries">
                      <div className="ph-download-bar">
                        <button
                          className="btn btn-primary ph-download-btn"
                          disabled={pdfLoadingPerson === person.id}
                          onClick={() => downloadHistoryPDF(person, personEntries, grandTotalPaid, grandTotalOwed, trueRemaining)}
                        >
                          {pdfLoadingPerson === person.id
                            ? <><Loader size={13} className="spin" /> Generating...</>
                            : <><Download size={13} /> Download PDF</>}
                        </button>
                      </div>
                      {personEntries.map(({ split, entry, totalPaid, remaining }) => (
                        <div key={split.id} className="ph-entry">
                          <div className="ph-entry-header">
                            <span className="ph-entry-title">{split.expenseTitle}</span>
                            <span className="ph-entry-date">{formatDate(split.expenseDate)}</span>
                            <span className="ph-entry-share">Share: {formatCurrency(entry.shareAmount)}</span>
                          </div>
                          <div className="ph-settlements">
                            {(entry.settlements || [])
                              .sort((a, b) => new Date(a.date) - new Date(b.date))
                              .map((s, i) => (
                                <div key={s.id || i} className="ph-settlement-row">
                                  <span className="ph-s-dot" style={{ background: person.color }} />
                                  <span className="ph-s-date">{new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  <span className="ph-s-note">{s.note || 'Payment'}</span>
                                  <span className="ph-s-amount" style={{ color: person.color }}>+{formatCurrency(s.amount)}</span>
                                </div>
                              ))}
                          </div>
                          <div className="ph-entry-footer">
                            <span>Paid: <strong>{formatCurrency(totalPaid)}</strong></span>
                            {remaining > 0
                              ? <span className="ph-entry-rem">₹{remaining.toFixed(2)} remaining</span>
                              : <span className="ph-entry-done">✓ Fully paid</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Manage People */}
      <div className="card manage-people-card">
        <div className="card-header">
          <h2 className="card-title">
            <Users size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            People
          </h2>
          <button
            className="btn btn-primary"
            style={{ padding: '7px 14px', fontSize: 13 }}
            onClick={() => setShowAddPerson(true)}
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {showAddPerson && (
          <div className="add-person-row">
            <input
              autoFocus
              className="form-input"
              placeholder="Enter name..."
              value={newPersonName}
              onChange={e => setNewPersonName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddPerson();
                if (e.key === 'Escape') setShowAddPerson(false);
              }}
              maxLength={30}
            />
            <button className="btn btn-primary" onClick={handleAddPerson}>Add</button>
            <button className="btn btn-ghost" onClick={() => setShowAddPerson(false)}>Cancel</button>
          </div>
        )}

        {people.length === 0 ? (
          <p className="empty-people-text">
            No people yet. Add people to start splitting expenses.
          </p>
        ) : (
          <div className="people-manage-list">
            {people.map(person => {
              const balance = getPersonBalance(person.id);
              return (
                <div key={person.id} className="people-manage-row">
                  <span
                    className="people-manage-avatar"
                    style={{ background: person.color + '22', color: person.color }}
                  >
                    {person.name[0].toUpperCase()}
                  </span>
                  <span className="people-manage-name">{person.name}</span>
                  <span
                    className="people-manage-status"
                    style={{ color: balance > 0 ? '#ef4444' : balance < 0 ? '#f97316' : '#22c55e' }}
                  >
                    {balance > 0
                      ? `Owes ${formatCurrency(balance)}`
                      : balance < 0
                      ? `You owe ${formatCurrency(Math.abs(balance))}`
                      : '✓ Clear'}
                  </span>
                  <button
                    className="icon-btn icon-btn--delete"
                    onClick={() => deletePerson(person.id)}
                    title="Remove person"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete split confirmation */}
      {confirmDeleteSplit && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteSplit(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete this split?</h3>
            <p>All settlement records for this split will be removed.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteSplit(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => { deleteSplit(confirmDeleteSplit); setConfirmDeleteSplit(null); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      {settleTarget && (
        <SettleUpModal person={settleTarget} onClose={() => setSettleTarget(null)} />
      )}
    </div>
  );
}
