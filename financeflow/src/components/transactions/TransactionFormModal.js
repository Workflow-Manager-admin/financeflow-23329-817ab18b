import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './TransactionFormModal.css';
import { usePreferences } from '../PreferencesProvider';

const defaultForm = {
  type: 'expense',
  category: '',
  amount: '',
  date: '',
  description: '',
};

/*
 * Categories: "Salary" removed from expense categories and replaced by "Rent/House".
 * Legacy: If editing a transaction with category "Salary", the UI should treat it as "Rent/House".
 * (Also: 'Investment' is present as category but not touched here per requirements)
 */
const categories = [
  'Food', 'Transport', 'Shopping', 'Utilities', 'Subscriptions',
  'Rent/House', 'Investment', 'Gift', 'Healthcare', 'Other'
];

/**
 * TransactionFormModal: Modal dialog to add/edit a transaction,
 * taking currencySymbol from props or preferences context for live updates.
 */
function TransactionFormModal({ onSave, onClose, initial, currencySymbol }) {
  // When editing an existing transaction, if category is "Salary", map to "Rent/House"
  const mappedInitial = initial && initial.type === 'expense' && initial.category === 'Salary'
    ? { ...initial, category: 'Rent/House' }
    : initial;
  const [form, setForm] = useState(mappedInitial || defaultForm);
  const [error, setError] = useState('');
  const ref = useRef();
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);

  // Always call at top-level
  const preferences = usePreferences();
  const liveCurrencySymbol = currencySymbol || (preferences && preferences.currencySymbol) || '$';

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
    if (typeof onSave !== 'function') {
      // User-friendly error + dev warning, do not crash
      setError('Unexpected form error, please reload the page.');
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('TransactionFormModal error: onSave prop is not defined or not a function.');
      }
      return;
    }
    onSave(tx);
    setError('');
  }

  return (
    <div>
      {/* Modal Backdrop */}
      <div
        className="modal-backdrop"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        style={{ animation: "fadeIn 0.23s" }}
      />
      {/* Modal Dialog */}
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="txmodal-title"
        tabIndex={-1}
        onKeyDown={e => {
          if (e.key === 'Escape') onClose && onClose();
        }}
      >
        <form className="txmodal-form" onSubmit={handleSubmit} autoComplete="off">
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Close"
            tabIndex={0}
            onClick={onClose}
          >
            <svg width="22" height="22" viewBox="0 0 22 22">
              <line x1="6" y1="6" x2="16" y2="16" stroke="#6C2EBE" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="6" x2="6" y2="16" stroke="#6C2EBE" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <h3 id="txmodal-title" style={{ marginBottom: 14, fontWeight: 800, color: "var(--primary)" }}>
            {initial ? 'Edit' : 'Add'} Transaction
          </h3>
          <select
            ref={ref}
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            aria-label="Type"
            style={{ marginBottom: 7 }}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          {form.type === 'expense' && (
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              aria-label="Category"
              required
              style={{ marginBottom: 7 }}
            >
              <option value="">Category</option>
              {categories.map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span style={{
              color: "var(--primary,#6C2EBE)",
              fontWeight: 600,
              fontSize: "1.09em"
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
              required
            />
          </div>
          <input
            type="date"
            aria-label="Date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ marginBottom: 7 }}
            required
          />
          <input
            type="text"
            aria-label="Description"
            maxLength={64}
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ marginBottom: 9 }}
          />
          {error && <div className="txmodal-error">{error}</div>}
          <div className="txmodal-btnrow">
            <button type="submit" className="btn btn-large">{initial ? 'Update' : 'Add'}</button>
            <button type="button" className="btn btn-cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

TransactionFormModal.propTypes = {
  // PUBLIC_INTERFACE
  /** Handler function to save a new or edited transaction (required). */
  onSave: PropTypes.func.isRequired,
  /** Handler to close the modal. */
  onClose: PropTypes.func,
  /** Initial transaction object for editing mode. */
  initial: PropTypes.object,
  /** Currency symbol for display, falls back to context if not provided. */
  currencySymbol: PropTypes.string,
};

export default TransactionFormModal;
