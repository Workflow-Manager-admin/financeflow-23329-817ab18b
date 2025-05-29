import React, { useState, useRef, useEffect } from 'react';
import './SavingsGoalModal.css';

// PUBLIC_INTERFACE
function SavingsGoalModal({ onSave, onClose, initial }) {
  const [amount, setAmount] = useState(initial?.target || '');
  const [label, setLabel] = useState(initial?.label || '');
  const [error, setError] = useState('');
  const ref = useRef();
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!label) { setError('Goal name required'); return; }
    if (!amount || Number(amount) <= 0) { setError('Enter valid target amount'); return; }
    setError('');
    onSave({ label, target: Number(amount), achieved: false });
  }

  return (
    <div className="goalmodal-bg" role="dialog" aria-modal="true">
      <form className="goalmodal" onSubmit={handleSubmit}>
        <h3>Set Savings Goal</h3>
        <input
          ref={ref}
          type="text"
          aria-label="Goal name"
          placeholder="Goal (e.g., Emergency Fund)"
          maxLength={32}
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <input
          type="number"
          aria-label="Target amount"
          placeholder="Amount in $"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        {error && <div className="goalmodal-error">{error}</div>}
        <div className="goalmodal-btnrow">
          <button type="submit" className="btn btn-large">Save</button>
          <button className="btn btn-cancel" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default SavingsGoalModal;
