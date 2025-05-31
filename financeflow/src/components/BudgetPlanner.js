import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePreferences } from './PreferencesProvider';

/**
 * BudgetPlanner component allows budgeting per category and shows dynamic actuals/variance.
 * Now shows 'Actual Expenses' and 'Variance' columns, computes variance, and uses edit icon only.
 * 
 * Data is persisted in localStorage and loads reliably on tab/view switch.
 */

const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Utilities', 'Subscriptions',
  'Rent/House', 'Gift', 'Healthcare', 'Other'
];
const STORAGE_BUDGETS_KEY = 'fflow-budgets-v1';

// PUBLIC_INTERFACE
function BudgetPlanner({ transactions = [] }) {
  const { currencySymbol } = usePreferences() || { currencySymbol: '$' };
  const [budgets, setBudgets] = useState({});
  const [editingRow, setEditingRow] = useState(null);
  const [rowDraft, setRowDraft] = useState({});
  const [error, setError] = useState('');

  // Only load budgets from localStorage on mount or out-of-sync event.
  const loadBudgets = useCallback(() => {
    try {
      const lsBudgets = localStorage.getItem(STORAGE_BUDGETS_KEY);
      setBudgets(lsBudgets ? JSON.parse(lsBudgets) : {});
    } catch {
      setBudgets({});
    }
  }, []);

  useEffect(() => {
    loadBudgets();
    // Reload on tab focus
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadBudgets();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadBudgets]);

  // Keep rowDraft synced with state on edit
  useEffect(() => {
    if (editingRow) {
      setRowDraft({ value: Number(budgets[editingRow] || 0) });
      setError('');
    }
  }, [editingRow, budgets]);

  // Always save to localStorage on budgets state change
  useEffect(() => {
    if (
      budgets &&
      typeof budgets === 'object' &&
      Object.keys(budgets).length >= 0
    ) {
      localStorage.setItem(STORAGE_BUDGETS_KEY, JSON.stringify(budgets));
    }
  }, [budgets]);

  // Compute actual expenses per category for current month (default behavior, can be changed)
  const monthStr = new Date().toISOString().slice(0, 7);
  const actualExpenses = {};
  transactions.filter(tx => tx.type === 'expense').forEach(tx => {
    const category = tx.category === 'Salary' ? 'Rent/House' : tx.category;
    // Only sum for this month
    if (tx.date && tx.date.slice(0, 7) === monthStr) {
      actualExpenses[category] = (actualExpenses[category] || 0) + Number(tx.amount || 0);
    }
  });

  // Handle save action for budget input
  const handleSaveBudget = (cat, rawValue) => {
    let val = parseFloat(String(rawValue).replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(val) || val < 0) val = 0;
    let nextBudgets = { ...budgets, [cat]: val };
    setBudgets(nextBudgets);
    try {
      localStorage.setItem(STORAGE_BUDGETS_KEY, JSON.stringify(nextBudgets));
    } catch {}
    setEditingRow(null);
    setRowDraft({});
    setError('');
    return true;
  };

  // Remove separate Edit button: only render edit icon inline
  // Add 'Actual Expenses' and 'Variance' columns, dynamically updating
  return (
    <section className="placeholder-view">
      <div
        className="container"
        style={{
          maxWidth: 720,
          minWidth: 250,
          background: "var(--surface,#fff)",
          borderRadius: 18,
          boxShadow: "0 6px 36px rgba(60,42,150,0.10)",
          marginTop: 24,
          marginBottom: 0,
          padding: "0 0 30px 0",
          border: "1.2px solid var(--secondary, #ececec)",
          animation: 'fadein 0.18s'
        }}
      >
        <h1
          style={{
            marginTop: 24,
            marginBottom: 18,
            fontSize: "2.02rem",
            color: "var(--primary,#6C2EBE)",
            fontWeight: 800,
            letterSpacing: "0.01em",
            textAlign: "left",
            lineHeight: 1.13
          }}
        >
          Budget Planner
        </h1>
        <div style={{ overflowX: "auto", width: "100%", marginBottom: 4 }}>
          <table
            className="budgetplanner-table"
            style={{
              minWidth: 490,
              width: "100%",
              maxWidth: 740,
              tableLayout: "fixed",
              fontSize: "1em",
            }}
          >
            <colgroup>
              <col style={{ minWidth: 110, width: "33%" }} />
              <col style={{ minWidth: 78, width: "18%" }} />
              <col style={{ minWidth: 78, width: "18%" }} />
              <col style={{ minWidth: 90, width: "21%" }} />
              <col style={{ minWidth: 44, width: "auto" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: "1.01em", padding: "9px 6px" }}>Category</th>
                <th style={{ textAlign: 'right' }}>Budget Set</th>
                <th style={{ textAlign: 'right' }}>Actual Expenses</th>
                <th style={{ textAlign: 'right' }}>Variance</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {EXPENSE_CATEGORIES.map((cat) => {
                const budgetVal = Number(budgets[cat] || 0);
                const isEditing = editingRow === cat;
                const actual = Number(actualExpenses[cat] || 0);
                const variance = budgetVal - actual;
                return (
                  <tr key={cat}>
                    <td className="budgetplanner-category-cell">{cat}</td>
                    <td className="budgetplanner-budget-cell">
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <input
                            className="budgetplanner-input"
                            type="number"
                            min={0}
                            step="0.01"
                            autoFocus
                            style={{ width: 70, fontSize: '1em', padding: '4px 7px'}}
                            value={
                              (rowDraft.value === 0) ? '' :
                                (typeof rowDraft.value === 'number' && !Number.isNaN(rowDraft.value)) ? rowDraft.value : rowDraft.value || ''
                            }
                            onChange={e => {
                              let v = e.target.value;
                              if (/^-?[0-9]*\.?[0-9]*$/.test(v) || v === "") {
                                setRowDraft({ value: v === "" ? "" : parseFloat(v) });
                              }
                            }}
                            aria-label={`Budget for ${cat}`}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveBudget(cat, rowDraft.value);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setEditingRow(null);
                                setRowDraft({});
                                setError('');
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="budgetplanner-save-btn"
                            onClick={e => {
                              e.preventDefault();
                              handleSaveBudget(cat, rowDraft.value);
                            }}
                            aria-label={`Save budget for ${cat}`}
                            style={{
                              marginLeft: 2,
                              border: 'none',
                              background: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              color: 'var(--income,#22C55E)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '1.25em'
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path
                                d="M5 11l3.2 3.4a1 1 0 0 0 1.5-.1l5.3-6.5"
                                stroke="currentColor"
                                strokeWidth="2.1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="budgetplanner-cancel-btn"
                            onClick={e => {
                              e.preventDefault();
                              setEditingRow(null);
                              setRowDraft({});
                              setError('');
                            }}
                            aria-label={`Cancel editing budget for ${cat}`}
                            style={{
                              marginLeft: 1,
                              border: 'none',
                              background: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              color: 'var(--expense,#E74C3C)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '1.18em'
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path
                                d="M5.6 5.6l6.8 6.8M12.4 5.6l-6.8 6.8"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span
                          tabIndex={0}
                          className="budgetplanner-edit-span"
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: 'pointer' }}
                          onClick={editingRow === null ? () => setEditingRow(cat) : undefined}
                          aria-label={`Edit budget for ${cat}`}
                        >
                          {currencySymbol}{budgetVal.toFixed(2)}
                          <button
                            tabIndex={0}
                            type="button"
                            className="budgetplanner-edit-btn"
                            onClick={e => {
                              e.preventDefault();
                              setEditingRow(cat);
                              setError('');
                            }}
                            aria-label={`Edit budget for ${cat}`}
                            title="Edit"
                            disabled={editingRow !== null}
                            style={{
                              background: 'none',
                              border: 'none',
                              marginLeft: 4,
                              padding: 0,
                              fontSize: '1em',
                              cursor: editingRow === null ? 'pointer' : 'not-allowed',
                              color: 'var(--primary, #6C2EBE)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              opacity: editingRow !== null ? 0.5 : 1
                            }}
                          >
                            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
                              <path d="M14.8 3.8l1.4-1.3a2 2 0 112.8 2.8l-1.3 1.4-2.9-2.9zM3 17l2.4-.3c.2 0 .4-.1.5-.2L16.7 6.7l-2.9-2.9L3.6 14.1c-.1.1-.2.3-.2.5L3 17z" stroke="currentColor" strokeWidth="1.15" fill="none"/>
                            </svg>
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="budgetplanner-actual-cell" style={{ textAlign: 'right' }}>
                      {currencySymbol}{actual.toFixed(2)}
                    </td>
                    <td className="budgetplanner-variance-cell" style={{
                          textAlign: 'right',
                          color: variance < 0
                            ? 'var(--expense,#E74C3C)'
                            : 'var(--income,#22C55E)',
                          fontWeight: 600,
                        }}>
                      {variance >= 0
                        ? <>+{currencySymbol}{Math.abs(variance).toFixed(2)}</>
                        : <>-{currencySymbol}{Math.abs(variance).toFixed(2)}</>
                      }
                    </td>
                    <td className="budgetplanner-actions-cell" style={{padding: "2px 2px", minWidth: 44}}>
                      {/* No separate edit button any more */}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {error && (
          <div style={{ color: 'var(--expense,#E74C3C)', fontWeight: 500, marginLeft: 8, marginBottom: 10 }}>
            {error}
          </div>
        )}
        <div style={{ color: 'var(--text-secondary)', fontSize: '1em', marginTop: 23, marginLeft: 6 }}>
          <ul style={{ marginLeft: 9, paddingLeft: 0, listStyle: 'circle', color: 'var(--primary)', fontSize: '0.99em' }}>
            <li>Budgets are auto-saved for each category. Enter numbers only.</li>
            <li>'Actual Expenses' and 'Variance' update live from your transactions for this month.</li>
            <li>Variance = Budget Set - Actual Expenses. Positive means under budget; negative is over budget.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default BudgetPlanner;
