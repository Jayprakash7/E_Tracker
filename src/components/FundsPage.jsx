import { useState, useRef } from 'react';
import { PlusCircle, Trash2, ArrowDownCircle, ArrowUpCircle, Download, Loader, X, ChevronDown, ChevronUp, Wallet, Pencil, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useFunds } from '../context/FundsContext';
import { useAuth } from '../context/AuthContext';

const TODAY = () => new Date().toISOString().split('T')[0];

/* ── small helpers ── */
const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; };

export default function FundsPage() {
  const { funds, addFund, deleteFund, renameFund, addTransaction, deleteTransaction, getFundTransactions, getFundBalance } = useFunds();
  const { currentUser } = useAuth();
  const myName = currentUser?.name || 'Me';

  const [editingFundId,   setEditingFundId]   = useState(null);
  const [editingFundName, setEditingFundName] = useState('');

  /* -- new fund form -- */
  const [showFundForm, setShowFundForm] = useState(false);
  const [fundForm, setFundForm]         = useState({ name: '', initialAmount: '' });
  const [fundErrors, setFundErrors]     = useState({});

  /* -- selected fund view -- */
  const [activeFundId, setActiveFundId] = useState(null);

  /* -- transaction form -- */
  const [showTxForm, setShowTxForm] = useState(false);
  const [txForm, setTxForm]         = useState({ description: '', totalExpense: '', selfAmount: '', fundAmount: '', type: 'debit', date: TODAY(), notes: '' });
  const [txErrors, setTxErrors]     = useState({});

  // derived: how much comes from the fund
  const fundDeduction = (() => {
    if (txForm.type !== 'debit') return 0;
    if (txForm.fundAmount !== '') return Math.max(0, parseFloat(txForm.fundAmount) || 0);
    const total = parseFloat(txForm.totalExpense) || 0;
    const self  = parseFloat(txForm.selfAmount)   || 0;
    if (total > 0 && txForm.selfAmount !== '') return Math.max(0, total - self);
    if (total > 0) return total;
    return 0;
  })();

  /* -- pdf -- */
  const [pdfLoading, setPdfLoading] = useState(false);
  const printRef = useRef(null);

  const activeFund = funds.find(f => f.id === activeFundId) || null;
  const txList     = activeFund ? getFundTransactions(activeFundId) : [];
  const balance    = activeFund ? getFundBalance(activeFund) : 0;

  /* running balance per row */
  const rowsWithBalance = txList.reduce((acc, tx) => {
    const prev = acc.length ? acc[acc.length - 1].running : activeFund.initialAmount;
    const running = tx.type === 'credit' ? prev + tx.amount : prev - tx.amount;
    acc.push({ ...tx, running });
    return acc;
  }, []);

  /* ── Fund form handlers ── */
  const handleAddFund = async () => {
    const errs = {};
    if (!fundForm.name.trim())                                         errs.name   = 'Name required';
    if (!fundForm.initialAmount || isNaN(fundForm.initialAmount) || parseFloat(fundForm.initialAmount) < 0)
                                                                       errs.amount = 'Enter a valid amount';
    if (Object.keys(errs).length) { setFundErrors(errs); return; }
    await addFund(fundForm.name, fundForm.initialAmount);
    setFundForm({ name: '', initialAmount: '' });
    setFundErrors({});
    setShowFundForm(false);
  };

  const handleDeleteFund = async (fundId) => {
    if (!window.confirm('Delete this fund and all its transactions?')) return;
    if (activeFundId === fundId) setActiveFundId(null);
    await deleteFund(fundId);
  };

  /* ── Tx form handlers ── */
  const handleAddTx = async () => {
    const errs = {};
    const total = parseFloat(txForm.totalExpense) || 0;
    const self  = parseFloat(txForm.selfAmount)   || 0;
    if (!txForm.description.trim())               errs.description  = 'Description required';
    if (!txForm.totalExpense || total <= 0)        errs.totalExpense = 'Enter a valid amount';
    if (txForm.type === 'debit' && txForm.selfAmount !== '' && (self < 0 || self >= total))
                                                   errs.selfAmount   = `Must be between ₹0 and ${fmt(total - 0.01)}`;
    if (!txForm.date)                              errs.date         = 'Date required';
    if (Object.keys(errs).length) { setTxErrors(errs); return; }

    const manualFund = parseFloat(txForm.fundAmount) || 0;
    const isSplit = txForm.type === 'debit' && (self > 0 || manualFund > 0) && (self > 0 || txForm.selfAmount !== '');
    const fundAmt = txForm.fundAmount !== '' ? manualFund : (isSplit ? total - self : total);
    const hasSplit = txForm.type === 'debit' && (self > 0 || manualFund > 0);

    await addTransaction(activeFundId, {
      description:  txForm.description,
      amount:       fundAmt,                       // only this deducted from fund
      totalExpense: hasSplit ? total    : null,
      selfAmount:   hasSplit ? self     : null,
      type:         txForm.type,
      date:         txForm.date,
      notes:        txForm.notes,
    });
    setTxForm({ description: '', totalExpense: '', selfAmount: '', fundAmount: '', type: 'debit', date: TODAY(), notes: '' });
    setTxErrors({});
    setShowTxForm(false);
  };

  /* ── PDF ── */
  const downloadPDF = async () => {
    if (!printRef.current || !activeFund) return;
    setPdfLoading(true);
    try {
      const el = printRef.current;

      // Force desktop width so PDF always looks clean regardless of device
      const prevStyle = el.getAttribute('style') || '';
      el.style.width        = '900px';
      el.style.minWidth     = '900px';
      el.style.position     = 'relative';
      el.style.left         = '0';
      el.style.top          = '0';
      el.style.transform    = 'none';

      const canvas = await html2canvas(el, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 900,
        windowWidth: 1200,
      });

      // Restore original styles
      el.setAttribute('style', prevStyle);

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      const pageH = pdf.internal.pageSize.getHeight();
      let y = 0;
      while (y < h) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -y, w, h);
        y += pageH;
      }
      pdf.save(`${activeFund.name}_report.pdf`);
    } catch(e) {
      // restore style on error too
      if (printRef.current) printRef.current.setAttribute('style', printRef.current._prevStyle || '');
      throw e;
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Funds</h1>
          <p className="page-subtitle">Track pooled money &amp; spending</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowFundForm(v => !v)}>
          <PlusCircle size={16} /> New Fund
        </button>
      </div>

      {/* ── New Fund form ── */}
      {showFundForm && (
        <div className="card fund-form-card">
          <div className="fund-form-header">
            <span>Create Fund</span>
            <button className="icon-btn" onClick={() => { setShowFundForm(false); setFundErrors({}); }}><X size={16} /></button>
          </div>
          <div className="fund-form-row">
            <div className="fund-form-field">
              <label className="form-label">Fund name *</label>
              <input className={`form-input ${fundErrors.name ? 'form-input--error' : ''}`}
                placeholder="Enter fund name"
                value={fundForm.name}
                onChange={e => setFundForm(p => ({ ...p, name: e.target.value }))}
              />
              {fundErrors.name && <p className="form-error">{fundErrors.name}</p>}
            </div>
            <div className="fund-form-field">
              <label className="form-label">Opening balance (₹) *</label>
              <input className={`form-input ${fundErrors.amount ? 'form-input--error' : ''}`}
                type="number" min="0" placeholder="Enter opening amount"
                value={fundForm.initialAmount}
                onChange={e => setFundForm(p => ({ ...p, initialAmount: e.target.value }))}
              />
              {fundErrors.amount && <p className="form-error">{fundErrors.amount}</p>}
            </div>
          </div>
          <div className="fund-form-actions">
            <button className="btn btn-ghost" onClick={() => { setShowFundForm(false); setFundErrors({}); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddFund}>Create Fund</button>
          </div>
        </div>
      )}

      {/* ── Fund cards list ── */}
      {funds.length === 0 ? (
        <div className="empty-state">
          <Wallet size={40} className="empty-icon" />
          <p>No funds yet. Create one to start tracking.</p>
        </div>
      ) : (
        <div className="fund-cards-grid">
          {funds.map(fund => {
            const bal = getFundBalance(fund);
            const isActive = activeFundId === fund.id;
            return (
              <div
                key={fund.id}
                className={`fund-card ${isActive ? 'fund-card--active' : ''}`}
                onClick={() => setActiveFundId(isActive ? null : fund.id)}
              >
                <div className="fund-card-top">
                  {editingFundId === fund.id ? (
                    <div className="fund-card-rename" onClick={e => e.stopPropagation()}>
                      <input
                        className="fund-rename-input"
                        value={editingFundName}
                        onChange={e => setEditingFundName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && editingFundName.trim()) { renameFund(fund.id, editingFundName); setEditingFundId(null); }
                          if (e.key === 'Escape') setEditingFundId(null);
                        }}
                        autoFocus
                      />
                      <button className="icon-btn icon-btn--edit" style={{color:'#16a34a'}} onClick={e => { e.stopPropagation(); if (editingFundName.trim()) { renameFund(fund.id, editingFundName); setEditingFundId(null); } }}>
                        <Check size={14} />
                      </button>
                      <button className="icon-btn icon-btn--logout" onClick={e => { e.stopPropagation(); setEditingFundId(null); }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="fund-card-name">{fund.name}</div>
                      <div className="fund-card-actions" onClick={e => e.stopPropagation()}>
                        <button className="icon-btn icon-btn--edit" title="Rename" onClick={e => { e.stopPropagation(); setEditingFundId(fund.id); setEditingFundName(fund.name); }}>
                          <Pencil size={13} />
                        </button>
                        <button className="icon-btn icon-btn--danger" title="Delete" onClick={e => { e.stopPropagation(); handleDeleteFund(fund.id); }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div className="fund-card-amounts">
                  <div className="fund-card-stat">
                    <span className="fund-card-stat-label">Opening</span>
                    <span className="fund-card-stat-value">{fmt(fund.initialAmount)}</span>
                  </div>
                  <div className="fund-card-stat">
                    <span className="fund-card-stat-label">Remaining</span>
                    <span className={`fund-card-stat-value fund-bal ${bal < 0 ? 'fund-bal--negative' : 'fund-bal--positive'}`}>{fmt(bal)}</span>
                  </div>
                </div>
                <div className="fund-card-toggle">
                  {isActive ? <><ChevronUp size={14}/> Hide details</> : <><ChevronDown size={14}/> View transactions</>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Transaction panel ── */}
      {activeFund && (
        <div className="card fund-tx-panel">
          <div className="fund-tx-header">
            <div>
              <h2 className="fund-tx-title">{activeFund.name}</h2>
              <p className="fund-tx-subtitle">
                Opening: {fmt(activeFund.initialAmount)} &nbsp;·&nbsp;
                Remaining: <strong className={balance < 0 ? 'text-danger' : 'text-success'}>{fmt(balance)}</strong>
              </p>
            </div>
            <div className="fund-tx-actions">
              <button className="btn btn-ghost fund-pdf-btn" onClick={downloadPDF} disabled={pdfLoading}>
                {pdfLoading ? <Loader size={15} className="spin" /> : <Download size={15} />}
                {pdfLoading ? 'Generating…' : 'PDF'}
              </button>
              <button className="btn btn-primary" onClick={() => setShowTxForm(v => !v)}>
                <PlusCircle size={15} /> Add Entry
              </button>
            </div>
          </div>

          {/* Tx form */}
          {showTxForm && (
            <div className="fund-tx-form">
              <div className="fund-tx-type-toggle">
                <button
                  type="button"
                  className={`fund-type-btn ${txForm.type === 'debit' ? 'fund-type-btn--debit' : ''}`}
                  onClick={() => setTxForm(p => ({ ...p, type: 'debit' }))}
                >
                  <ArrowDownCircle size={14} /> Debit (spent)
                </button>
                <button
                  type="button"
                  className={`fund-type-btn ${txForm.type === 'credit' ? 'fund-type-btn--credit' : ''}`}
                  onClick={() => setTxForm(p => ({ ...p, type: 'credit' }))}
                >
                  <ArrowUpCircle size={14} /> Credit (added)
                </button>
              </div>
              <div className="fund-form-row">
                <div className="fund-form-field fund-form-field--wide">
                  <label className="form-label">Description *</label>
                  <input className={`form-input ${txErrors.description ? 'form-input--error' : ''}`}
                    placeholder="Enter description"
                    value={txForm.description}
                    onChange={e => setTxForm(p => ({ ...p, description: e.target.value }))}
                  />
                  {txErrors.description && <p className="form-error">{txErrors.description}</p>}
                </div>
                <div className="fund-form-field">
                  <label className="form-label">Total expense (₹) *</label>
                  <input className={`form-input ${txErrors.totalExpense ? 'form-input--error' : ''}`}
                    type="number" min="0" placeholder="Enter total amount"
                    value={txForm.totalExpense}
                    onChange={e => {
                      const total = parseFloat(e.target.value) || 0;
                      const self = parseFloat(txForm.selfAmount) || 0;
                      const autoFund = total > 0 && self > 0 ? Math.max(0, total - self) : '';
                      setTxForm(p => ({ ...p, totalExpense: e.target.value, fundAmount: autoFund === '' ? p.fundAmount : String(autoFund) }));
                    }}
                  />
                  {txErrors.totalExpense
                    ? <p className="form-error">{txErrors.totalExpense}</p>
                    : <p className="fund-field-hint">Full cost of this expense</p>
                  }
                </div>
                <div className="fund-form-field">
                  <label className="form-label">Date *</label>
                  <input className={`form-input ${txErrors.date ? 'form-input--error' : ''}`}
                    type="date"
                    value={txForm.date}
                    onChange={e => setTxForm(p => ({ ...p, date: e.target.value }))}
                  />
                  {txErrors.date && <p className="form-error">{txErrors.date}</p>}
                </div>
              </div>
              {txForm.type === 'debit' && (
                <div className="fund-form-row">
                  <div className="fund-form-field">
                    <label className="form-label">Paid by me (₹) <span className="fund-label-hint">optional</span></label>
                    <input className={`form-input ${txErrors.selfAmount ? 'form-input--error' : ''}`}
                      type="number" min="0" placeholder="Enter your contribution"
                      value={txForm.selfAmount}
                      onChange={e => {
                        const self = parseFloat(e.target.value) || 0;
                        const total = parseFloat(txForm.totalExpense) || 0;
                        const autoFund = total > 0 && self > 0 ? Math.max(0, total - self) : '';
                        setTxForm(p => ({ ...p, selfAmount: e.target.value, fundAmount: autoFund === '' ? p.fundAmount : String(autoFund) }));
                      }}
                    />
                    {txErrors.selfAmount
                      ? <p className="form-error">{txErrors.selfAmount}</p>
                      : <p className="fund-field-hint">Amount you paid from your own pocket</p>
                    }
                  </div>
                  <div className="fund-form-field">
                    <label className="form-label">From {activeFund?.name} (₹) <span className="fund-label-hint">auto-calculated</span></label>
                    <input className={`form-input ${txErrors.fundAmount ? 'form-input--error' : ''}`}
                      type="number" min="0" placeholder="Auto-calculated"
                      value={txForm.fundAmount}
                      onChange={e => setTxForm(p => ({ ...p, fundAmount: e.target.value }))}
                    />
                    {txErrors.fundAmount && <p className="form-error">{txErrors.fundAmount}</p>}
                  </div>
                </div>
              )}
              {/* Live fund deduction preview — only when split values entered */}
              {txForm.type === 'debit' && parseFloat(txForm.totalExpense) > 0 && (txForm.selfAmount !== '' || txForm.fundAmount !== '') && (
                <div className="fund-deduction-preview fund-deduction-preview--cards">
                  <div className="fund-deduction-card fund-deduction-card--total">
                    <span className="fund-deduction-card-label">Total Expense</span>
                    <strong className="fund-deduction-card-val">{fmt(parseFloat(txForm.totalExpense) || 0)}</strong>
                  </div>
                  <div className="fund-deduction-arrow">→</div>
                  <div className="fund-deduction-card fund-deduction-card--self">
                    <span className="fund-deduction-card-label">Paid from {myName}'s account</span>
                    <strong className="fund-deduction-card-val">{fmt(parseFloat(txForm.selfAmount) || 0)}</strong>
                  </div>
                  <div className="fund-deduction-plus">+</div>
                  <div className="fund-deduction-card fund-deduction-card--fund">
                    <span className="fund-deduction-card-label">From {activeFund.name}</span>
                    <strong className="fund-deduction-card-val">{fmt(fundDeduction)}</strong>
                  </div>
                </div>
              )}
              <div className="fund-form-field" style={{ marginTop: 4 }}>
                <label className="form-label">Notes (optional)</label>
                <input className="form-input"
                  placeholder="Add a note (optional)"
                  value={txForm.notes}
                  onChange={e => setTxForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div className="fund-form-actions">
                <button className="btn btn-ghost" onClick={() => { setShowTxForm(false); setTxErrors({}); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddTx}>Save Entry</button>
              </div>
            </div>
          )}

          {/* Printable area */}
          <div ref={printRef} className="fund-print-area">

            {/* ── PDF Header ── */}
            <div className="fund-pdf-hero">
              <div className="fund-pdf-hero-left">
                <div className="fund-pdf-fund-name">{activeFund.name}</div>
                <div className="fund-pdf-subtitle">Fund Transaction Report</div>
              </div>
              <div className="fund-pdf-hero-right">
                <div className="fund-pdf-date">Generated: {fmtDate(TODAY())}</div>
              </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="fund-pdf-summary">
              <div className="fund-pdf-summary-card fund-pdf-summary-card--open">
                <div className="fund-pdf-summary-label">Opening Balance</div>
                <div className="fund-pdf-summary-value">{fmt(activeFund.initialAmount)}</div>
              </div>
              <div className="fund-pdf-summary-card fund-pdf-summary-card--debit">
                <div className="fund-pdf-summary-label">Total Spent (from fund)</div>
                <div className="fund-pdf-summary-value">
                  {fmt(txList.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0))}
                </div>
              </div>
              <div className="fund-pdf-summary-card fund-pdf-summary-card--credit">
                <div className="fund-pdf-summary-label">Total Added</div>
                <div className="fund-pdf-summary-value">
                  {fmt(txList.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0))}
                </div>
              </div>
              <div className={`fund-pdf-summary-card ${balance < 0 ? 'fund-pdf-summary-card--neg' : 'fund-pdf-summary-card--balance'}`}>
                <div className="fund-pdf-summary-label">Remaining Balance</div>
                <div className="fund-pdf-summary-value">{fmt(balance)}</div>
              </div>
            </div>

            {/* ── Section Divider ── */}
            {txList.length > 0 && (
              <div className="fund-history-header">
                <div className="fund-history-title">
                  <span className="fund-history-icon">📋</span>
                  Transaction History
                </div>
                <div className="fund-history-meta">
                  {(() => {
                    const debitCount  = txList.filter(t => t.type === 'debit').length;
                    const creditCount = txList.filter(t => t.type === 'credit').length;
                    const parts = [];
                    if (debitCount  > 0) parts.push(`${debitCount} debit${debitCount  !== 1 ? 's' : ''}`);
                    if (creditCount > 0) parts.push(`${creditCount} credit${creditCount !== 1 ? 's' : ''}`);
                    return `${txList.length} transaction${txList.length !== 1 ? 's' : ''} · ${parts.join(' · ')}`;
                  })()}
                </div>
              </div>
            )}

            {txList.length === 0 ? (
              <div className="fund-empty-tx">No transactions yet.</div>
            ) : (
              <div className="fund-table-wrap">
              <table className="fund-table">
                <thead>
                  <tr>
                    <th style={{width:'95px'}}>Date</th>
                    <th>Description</th>
                    <th className="num-col" style={{width:'120px'}}>Debit (fund)</th>
                    <th className="num-col" style={{width:'120px'}}>Credit</th>
                    <th className="num-col" style={{width:'120px'}}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="fund-table-opening">
                    <td colSpan={4}><strong>Opening Balance</strong></td>
                    <td className="num-col"><strong>{fmt(activeFund.initialAmount)}</strong></td>
                  </tr>
                  {rowsWithBalance.map(tx => (
                    <>
                      <tr key={tx.id} className={`fund-table-row fund-table-row--${tx.type}`}>
                        <td className="fund-td-date">{tx.date ? fmtDate(tx.date) : '—'}</td>
                        <td>
                          <div className="fund-td-desc-wrap">
                            <strong>{tx.description}</strong>
                            {tx.notes && <span className="fund-td-note-inline">{tx.notes}</span>}
                          </div>
                        </td>
                        <td className="num-col fund-debit">{tx.type === 'debit'   ? fmt(tx.amount) : '—'}</td>
                        <td className="num-col fund-credit">{tx.type === 'credit' ? fmt(tx.amount) : '—'}</td>
                        <td className="num-col fund-running-wrap">
                          <span className={tx.running < 0 ? 'fund-bal--negative' : ''}>{fmt(tx.running)}</span>
                          <button className="fund-del-btn" onClick={() => { if (window.confirm('Delete this transaction? This cannot be undone.')) deleteTransaction(tx.id); }} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                      {tx.type === 'debit' && tx.totalExpense && (
                        <tr key={tx.id + '-breakdown'} className="fund-breakdown-row">
                          <td />
                          <td colSpan={4}>
                            <div className="fund-breakdown-cells">
                              <div className="fund-breakdown-cell fund-breakdown-cell--total">
                                <span className="fund-breakdown-label">Total Expense</span>
                                <span className="fund-breakdown-val">{fmt(tx.totalExpense)}</span>
                              </div>
                              <div className="fund-breakdown-arrow">→</div>
                              <div className="fund-breakdown-cell fund-breakdown-cell--self">
                                <span className="fund-breakdown-label">Paid from {myName}'s account</span>
                                <span className="fund-breakdown-val">{fmt(tx.selfAmount ?? 0)}</span>
                              </div>
                              <div className="fund-breakdown-plus">+</div>
                              <div className="fund-breakdown-cell fund-breakdown-cell--fund">
                                <span className="fund-breakdown-label">From {activeFund.name}</span>
                                <span className="fund-breakdown-val">{fmt(tx.amount)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="fund-table-closing">
                    <td colSpan={4}><strong>Closing Balance</strong></td>
                    <td className={`num-col ${balance < 0 ? 'fund-bal--negative' : 'fund-bal--positive'}`}>
                      <strong>{fmt(balance)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
