import { useState } from 'react';
import { Plus, X, Divide } from 'lucide-react';
import { useSplit } from '../context/SplitContext';

export default function SplitSection({ totalAmount, onSplitChange }) {
  const { people, addPerson } = useSplit();

  const [selected, setSelected] = useState([]);       // array of personId
  const [amounts, setAmounts]   = useState({});        // { personId: string }
  const [newName, setNewName]   = useState('');
  const [showInput, setShowInput] = useState(false);

  const total = parseFloat(totalAmount) || 0;

  const notify = (sel, amts) => {
    if (sel.length === 0) { onSplitChange(null); return; }
    const entries = sel
      .map(pid => {
        const person = people.find(p => p.id === pid);
        return { personId: pid, personName: person?.name || '', shareAmount: parseFloat(amts[pid]) || 0 };
      })
      .filter(e => e.shareAmount > 0);
    onSplitChange(entries.length > 0 ? entries : null);
  };

  const togglePerson = (pid) => {
    let newSel;
    let newAmts = { ...amounts };
    if (selected.includes(pid)) {
      newSel = selected.filter(id => id !== pid);
      delete newAmts[pid];
    } else {
      newSel = [...selected, pid];
    }
    setSelected(newSel);
    setAmounts(newAmts);
    notify(newSel, newAmts);
  };

  const handleAmountChange = (pid, value) => {
    const newAmts = { ...amounts, [pid]: value };
    setAmounts(newAmts);
    notify(selected, newAmts);
  };

  const splitEqually = () => {
    if (selected.length === 0 || total <= 0) return;
    const perPerson = Math.floor((total / (selected.length + 1)) * 100) / 100;
    const newAmts = {};
    selected.forEach(pid => { newAmts[pid] = String(perPerson); });
    setAmounts(newAmts);
    notify(selected, newAmts);
  };

  const handleAddPerson = () => {
    if (!newName.trim()) return;
    const person = addPerson(newName.trim());
    const newSel = [...selected, person.id];
    setSelected(newSel);
    setNewName('');
    setShowInput(false);
    notify(newSel, amounts);
  };

  const totalSplit = selected.reduce((t, pid) => t + (parseFloat(amounts[pid]) || 0), 0);
  const yourShare  = Math.max(0, total - totalSplit);
  const isOver     = totalSplit > total;

  return (
    <div className="split-section">
      {/* Header */}
      <div className="split-section-header">
        <p className="split-label">Split with</p>
        <button
          type="button"
          className="btn-split-equal"
          onClick={splitEqually}
          disabled={selected.length === 0 || !total}
        >
          <Divide size={13} /> Equal split
        </button>
      </div>

      {/* People chips */}
      <div className="person-chips">
        {people.map(person => {
          const isActive = selected.includes(person.id);
          return (
            <button
              key={person.id}
              type="button"
              className={`person-chip ${isActive ? 'person-chip--active' : ''}`}
              style={isActive ? { background: person.color + '20', borderColor: person.color, color: person.color } : {}}
              onClick={() => togglePerson(person.id)}
            >
              <span
                className="person-chip-avatar"
                style={{ background: isActive ? person.color : '#e2e8f0', color: isActive ? '#fff' : '#64748b' }}
              >
                {person.name[0].toUpperCase()}
              </span>
              {person.name}
              {isActive && <X size={11} />}
            </button>
          );
        })}

        {/* Add person inline */}
        {showInput ? (
          <div className="person-chip-input-wrap">
            <input
              autoFocus
              className="person-chip-input"
              placeholder="Name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddPerson(); }
                if (e.key === 'Escape') { setShowInput(false); setNewName(''); }
              }}
              maxLength={30}
            />
            <button type="button" className="chip-confirm-btn" onClick={handleAddPerson}>✓</button>
            <button type="button" className="chip-cancel-btn" onClick={() => { setShowInput(false); setNewName(''); }}>✕</button>
          </div>
        ) : (
          <button type="button" className="person-chip person-chip--add" onClick={() => setShowInput(true)}>
            <Plus size={13} /> Add person
          </button>
        )}
      </div>

      {/* Amount inputs */}
      {selected.length > 0 && (
        <div className="split-amounts">
          {selected.map(pid => {
            const person = people.find(p => p.id === pid);
            return (
              <div key={pid} className="split-amount-row">
                <div className="split-amount-person">
                  <span className="split-amount-avatar" style={{ background: person?.color }}>
                    {person?.name[0].toUpperCase()}
                  </span>
                  <span className="split-amount-name">{person?.name}</span>
                </div>
                <div className="split-amount-field">
                  <span className="split-amount-prefix">₹</span>
                  <input
                    type="number"
                    className="split-amount-input"
                    placeholder="0"
                    value={amounts[pid] || ''}
                    onChange={e => handleAmountChange(pid, e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            );
          })}

          {/* Summary row */}
          <div className="split-summary">
            <div className="split-summary-row">
              <span>Others total</span>
              <span className={isOver ? 'split-sum-over' : ''}>₹{totalSplit.toFixed(2)}</span>
            </div>
            <div className="split-summary-row split-summary-row--you">
              <span>You pay</span>
              <span>₹{yourShare.toFixed(2)}</span>
            </div>
            {isOver && (
              <p className="split-error-inline">⚠ Split amounts exceed total</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
