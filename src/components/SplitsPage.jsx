import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Users, Plus, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
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

  const [settleTarget,        setSettleTarget]        = useState(null);
  const [showHistory,         setShowHistory]         = useState(false);
  const [newPersonName,       setNewPersonName]       = useState('');
  const [showAddPerson,       setShowAddPerson]       = useState(false);
  const [confirmDeleteSplit,  setConfirmDeleteSplit]  = useState(null);

  const outstandingSplits  = splits.filter(s => s.entries.some(e => getEntryRemaining(e) > 0));
  const settledSplits      = splits.filter(s => s.entries.every(e => getEntryRemaining(e) === 0));
  const totalOutstanding   = getTotalOutstanding();
  const outstandingPeople  = people.filter(p => getPersonBalance(p.id) > 0);
  // People who overpaid (you owe them)
  const youOwePeople       = people.filter(p => getPersonBalance(p.id) < 0);

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

      {/* Outstanding splits */}
      <h2 className="section-title">Outstanding</h2>

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
                    <div
                      key={entry.personId}
                      className={`split-entry ${isSettled ? 'split-entry--settled' : ''}`}
                    >
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

      {/* History */}
      {settledSplits.length > 0 && (
        <div className="history-section">
          <button className="history-toggle" onClick={() => setShowHistory(v => !v)}>
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            History ({settledSplits.length} settled)
          </button>
          {showHistory && (
            <div className="split-cards" style={{ marginTop: 10 }}>
              {settledSplits.map(split => (
                <div key={split.id} className="split-card split-card--settled">
                  <div className="split-card-top">
                    <div>
                      <p className="split-card-title">{split.expenseTitle}</p>
                      <p className="split-card-meta">{formatDate(split.expenseDate)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="settled-badge">✓ Settled</span>
                      <button
                        className="icon-btn icon-btn--delete"
                        onClick={() => setConfirmDeleteSplit(split.id)}
                        title="Delete split"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="split-entries">
                    {split.entries.map(entry => (
                      <div key={entry.personId} className="split-entry split-entry--settled">
                        <div className="split-entry-left">
                          <span className="split-entry-avatar" style={{ background: '#22c55e' }}>
                            {entry.personName[0]}
                          </span>
                          <span className="split-entry-name">{entry.personName}</span>
                        </div>
                        <span className="split-cleared-badge">
                          {formatCurrency(entry.shareAmount)} · Cleared
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
