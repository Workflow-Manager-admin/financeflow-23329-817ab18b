import React, { useState, useEffect } from 'react';
import { usePreferences } from './PreferencesProvider';

// Expense categories (matching TransactionFormModal minus 'Investment' & 'Salary')
const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Utilities', 'Subscriptions',
  'Rent/House', 'Gift', 'Healthcare', 'Other'
];

const STORAGE_BUDGETS_KEY = 'fflow-budgets-v1';
const STORAGE_TRANSACTIONS_KEY = 'fflow-transactions-v1';

// PUBLIC_INTERFACE
/**
 * BudgetPlanner displays and edits monthly budgets per expense category (excl. investments).
 * Shows: Category, Budget (editable), Actual (current month), Variance (color-coded).
 * Persists budgets in localStorage; reads currency symbol from preferences.
 * Reverted: Category heading restored to classic, no margin shift/grouping with content.
 */
function BudgetPlanner() {
  const { currencySymbol } = usePreferences() || { currencySymbol: '$' };
  const [budgets, setBudgets] = useState({});
  const [editingRow, setEditingRow] = useState(null); // Category string or null
  const [rowDraft, setRowDraft] = useState({});
  const [transactions, setTransactions] = useState([]);

  // On mount, load budgets and transactions
  useEffect(() => {
    try {
      setBudgets(JSON.parse(localStorage.getItem(STORAGE_BUDGETS_KEY)) || {});
    } catch {
      setBudgets({});
    }
    try {
      setTransactions(JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS_KEY)) || []);
    } catch {
      setTransactions([]);
    }
  }, []);

  // Update the rowDraft if budgets or editingRow changes
  useEffect(() => {
    if (editingRow) {
      setRowDraft({ value: Number(budgets[editingRow] || 0) });
    }
  }, [editingRow, budgets]);

  // Save budgets to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_BUDGETS_KEY, JSON.stringify(budgets));
  }, [budgets]);

  // Calculate actual spent for current month for each category
  const monthStr = new Date().toISOString().slice(0, 7); // e.g., '2024-06'
  const actuals = React.useMemo(() => {
    // Map legacy 'Salary' to 'Rent/House'
    const mapCat = (cat) => (cat === 'Salary' ? 'Rent/House' : cat);
    const out = {};
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        if (tx.category && tx.date && tx.date.startsWith(monthStr)) {
          const category = mapCat(tx.category);
          if (!out[category]) out[category] = 0;
          out[category] += Number(tx.amount);
        }
      }
    });
    return out;
  }, [transactions, monthStr]);

  return (
    <section className="placeholder-view">
      <div
        className="container"
        style={{
          maxWidth: 500,
          background: "var(--surface,#fff)",
          borderRadius: 13,
          boxShadow: "0 2px 16px rgba(60,42,150,0.07)",
          marginTop: 24,
          marginBottom: 0,
          padding: "0 0 32px 0"
        }}
      >
        {/* ORIGINAL Budget heading, no margin/shift */}
        <h1
          style={{
            marginTop: 20,
            marginBottom: 20,
            fontSize: "2rem",
            color: "var(--primary,#6C2EBE)",
            fontWeight: 700,
            letterSpacing: "0.01em",
            textAlign: "left",
            lineHeight: 1.13
          }}
        >
          Budget Planner
        </h1>
        <div>
          <table style={{ width: '100%', background: 'var(--surface,#fff)', borderRadius: 13, boxShadow: '0 2px 16px rgba(60,42,150,0.07)', overflow: 'hidden', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary,#F5F6FA)', color: 'var(--primary,#6C2EBE)' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600, fontSize: '1.05em' }}>Category</th>
                <th style={{ textAlign: 'right', padding: '12px' }}>Budget</th>
                <th style={{ textAlign: 'right', padding: '12px' }}>Actual</th>
                <th style={{ textAlign: 'right', padding: '12px' }}>Variance</th>
                <th style={{ textAlign: 'center', padding: '12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {EXPENSE_CATEGORIES.map((cat) => {
                const budgetPrev = Number(budgets[cat] || 0);
                const actual = Number(actuals[cat] || 0);
                const variance = budgetPrev - actual;
                const varColor = variance >= 0 ? 'var(--income,#22C55E)' : 'var(--expense,#E74C3C)';
                const isEditing = editingRow === cat;
                return (
                  <tr key={cat} style={{ borderBottom: '1px solid var(--secondary,#eee)' }}>
                    <td style={{ padding: '11px 12px', fontWeight: 500 }}>{cat}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          autoFocus
                          value={typeof rowDraft.value === 'number' && rowDraft.value !== 0 ? rowDraft.value : rowDraft.value === 0 ? '' : rowDraft.value || ''}
                          onChange={e => setRowDraft({ value: e.target.value })}
                          style={{
                            width: 82, fontSize: '1em', textAlign: 'right',
                            padding: '5px 5px', borderRadius: 5,
                            border: '1px solid var(--secondary,#bbbbbf)'
                          }}
                          aria-label={`Budget for ${cat}`}
                        />
                      ) : (
                        <span
                          tabIndex={0}
                          style={{
                            display: 'inline-block',
                            width: 82, textAlign: 'right', padding: '2px 5px', background: 'none'
                          }}
                        >
                          {currencySymbol}{Number(budgetPrev || 0).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                      {currencySymbol}{actual.toFixed(2)}
                    </td>
                    <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 600, color: varColor }}>
                      {variance >= 0 ? '+' : ''}
                      {currencySymbol}{variance.toFixed(2)}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', width: 88 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 7, justifyContent: "center" }}>
                          <button
                            className="btn btn-large"
                            style={{ minWidth: 34, padding: "4px 11px", fontSize: "0.99em" }}
                            onClick={e => {
                              e.preventDefault();
                              let val = parseFloat(String(rowDraft.value).replace(/[^0-9.]/g, ''));
                              if (isNaN(val) || val < 0) val = 0;
                              setBudgets(prev => ({ ...prev, [cat]: val }));
                              setEditingRow(null);
                              setRowDraft({});
                            }}
                            aria-label={`Save budget for ${cat}`}
                          >Save</button>
                          <button
                            className="btn btn-cancel"
                            style={{ minWidth: 34, padding: "4px 11px", fontSize: "0.99em" }}
                            onClick={e => {
                              e.preventDefault();
                              setEditingRow(null);
                              setRowDraft({});
                            }}
                            aria-label={`Cancel editing budget for ${cat}`}
                          >Cancel</button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-large"
                          style={{ minWidth: 34, padding: "4px 11px", fontSize: "0.97em" }}
                          onClick={e => {
                            e.preventDefault();
                            setEditingRow(cat);
                          }}
                          aria-label={`Edit budget for ${cat}`}
                          disabled={editingRow !== null}
                        >Edit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.035em', marginTop: 19 }}>
            <ul style={{ marginLeft: 19, paddingLeft: 0, listStyle: 'circle', color: 'var(--primary)', fontSize: '0.99em' }}>
              <li>Edit the budget for each category by clicking Edit. Only one row can be in edit mode at a time.</li>
              <li>Save or Cancel your changes for each row as needed. Changes are persisted per-category.</li>
              <li>Variance is green if under budget, red if over.</li>
              <li>Month: {monthStr}</li>
              <li>Currencies are shown in your preferred symbol from Preferences.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BudgetPlanner;
