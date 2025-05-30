import React, { useRef, useState, useEffect } from 'react';
import './TransactionFormModal.css';

const defaultForm = {
  type: 'expense',
  category: '',
  amount: '',
  date: '',
  description: '',
};

// Categories example
const categories = [
  'Food', 'Transport', 'Shopping', 'Utilities', 'Subscriptions',
  'Salary', 'Investment', 'Gift', 'Healthcare', 'Other'
];

import { usePreferences } from '../PreferencesProvider';

// PUBLIC_INTERFACE
function TransactionFormModal({ onSave, onClose, initial, currencySymbol }) {
  const [form, setForm] = useState(initial || defaultForm);
  const [error, setError] = useState('');
  const ref = useRef();
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);

  // For fallback if not passed as prop
  const preferences = usePreferences ? usePreferences() : {};
  const liveCurrencySymbol = currencySymbol || preferences.currencySymbol || '$';

  function validate() {
    if (form.type === 'expense' && !form.category) return 'Category required.';
    if (!form.amount || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) return 'Amount must be positive.';
    if (!form.date) return 'Date required.';
    return '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    // Only include category for expense, remove it for income
    let tx = { ...form, amount: Number(form.amount), id: initial?.id || undefined };
    if (form.type !== 'expense') {
      delete tx.category;
    }
    onSave(tx);
    setError('');
  }

  return (
    <div className="txmodal-bg" role="dialog" aria-modal="true">
      <form className="txmodal" onSubmit={handleSubmit}>
        <h3>{initial ? 'Edit' : 'Add'} Transaction</h3>
        <select
          ref={ref}
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          aria-label="Type"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        {/* Show category selection only if type is expense */}
        {form.type === 'expense' && (
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            aria-label="Category"
            required
          >
            <option value="">Category</option>
            {categories.map(c =>
              <option key={c} value={c}>{c}</option>
            )}
          </select>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
              color: "var(--primary,#6C2EBE)",
              fontWeight: 600,
              fontSize: "1.10em"
            }}>
            {liveCurrencySymbol}
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            aria-label="Amount"
            placeholder="Amount"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            style={{ flex: 1 }}
          />
        </div>
        <input
          type="date"
          aria-label="Date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
        />
        <input
          type="text"
          aria-label="Description"
          maxLength={64}
          placeholder="Description (optional)"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
        {error && <div className="txmodal-error">{error}</div>}
        <div className="txmodal-btnrow">
          <button type="submit" className="btn btn-large">{initial ? 'Update' : 'Add'}</button>
          <button type="button" className="btn btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default TransactionFormModal;
