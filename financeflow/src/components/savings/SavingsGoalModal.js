import React, { useState, useRef, useEffect } from 'react';
import './SavingsGoalModal.css';

// PUBLIC_INTERFACE
function SavingsGoalModal({ onSave, onClose, initial }) {
  const [amount, setAmount] = useState(initial?.target || '');
  // Now use period (weekly, monthly, quarterly, yearly) instead of label text input
  const [period, setPeriod] = useState(initial?.period || 'monthly');
  const [error, setError] = useState('');
  const ref = useRef();
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!period) { setError('Please select a period.'); return; }
    if (!amount || Number(amount) <= 0) { setError('Enter valid target amount'); return; }
    setError('');
    onSave({ period, target: Number(amount), achieved: false });
  }

  return (
    <div className="goalmodal-bg" role="dialog" aria-modal="true">
      <form className="goalmodal" onSubmit={handleSubmit}>
        <h3>Set Savings Goal</h3>
        <select
          ref={ref}
          aria-label="Savings period"
          value={period}
          onChange={e => setPeriod(e.target.value)}
        >
          <option value="weekly">Weekly Goal</option>
          <option value="monthly">Monthly Goal</option>
          <option value="quarterly">Quarterly Goal</option>
          <option value="yearly">Yearly Goal</option>
        </select>
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
