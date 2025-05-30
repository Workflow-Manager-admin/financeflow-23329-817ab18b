eftmimport React, { useState, useEffect } from 'react';
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
 */
function BudgetPlanner() {
  const { currencySymbol } = usePreferences() || { currencySymbol: '$' };
  const [budgets, setBudgets] = useState({});
  const [editing, setEditing] = useState({});
  const [rowDrafts, setRowDrafts] = useState({});
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

  // Keep rowDrafts in sync with budgets for new categories/budget changes
  useEffect(() => {
    // Only update for rows NOT currently being edited
    setRowDrafts((prev) => {
      const next = { ...prev };
      for (const cat of EXPENSE_CATEGORIES) {
        if (!editing[cat]) next[cat] = Number(budgets[cat] || 0);
      }
      return next;
    });
    // eslint-disable-next-line
  }, [budgets]);

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
          padding: "0 0 34px 0",
          marginTop: 30,
        }}
      >
        <div style={{ padding: "34px 17px 0 17px", display: "flex", alignItems: "flex-end", gap: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              color: "var(--primary,#6C2EBE)",
              fontWeight: 700,
              letterSpacing: "0.01em",
              textAlign: "left",
              flex: "1 1 auto",
            }}
          >
            Budget Planner
          </h1>
        </div>
        <div style={{ padding: "0 17px" }}>
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
              const rowDraft = rowDrafts[cat] ?? budgetPrev;
              const actual = Number(actuals[cat] || 0);
              const variance = budgetPrev - actual;
              const varColor = variance >= 0 ? 'var(--income,#22C55E)' : 'var(--expense,#E74C3C)';
              return (
                <tr key={cat} style={{ borderBottom: '1px solid var(--secondary,#eee)' }}>
                  <td style={{ padding: '11px 12px', fontWeight: 500 }}>{cat}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                    {editing[cat]
                      ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          autoFocus
                          value={rowDraft === 0 ? '' : rowDraft}
                          onChange={e => setRowDrafts(prev => ({ ...prev, [cat]: e.target.value }))}
                          style={{
                            width: 82, fontSize: '1em', textAlign: 'right',
                            padding: '5px 5px', borderRadius: 5,
                            border: '1px solid var(--secondary,#bbbbbf)'
                          }}
                          aria-label={`Budget for ${cat}`}
                        />
                      )
                      : (
                        <span
                          tabIndex={0}
                          style={{
                            display: 'inline-block',
                            width: 82, textAlign: 'right', padding: '2px 5px', background: 'none'
                          }}
                        >
                          {currencySymbol}{Number(budgetPrev || 0).toFixed(2)}
                        </span>
                      )
                    }
                  </td>
                  <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                    {currencySymbol}{actual.toFixed(2)}
                  </td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 600, color: varColor }}>
                    {variance >= 0 ? '+' : ''}
                    {currencySymbol}{variance.toFixed(2)}
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'center', width: 88 }}>
                    {editing[cat] ? (
                      <div style={{ display: "flex", gap: 7, justifyContent: "center" }}>
                        <button
                          className="btn btn-large"
                          style={{ minWidth: 34, padding: "4px 11px", fontSize: "0.99em" }}
                          onClick={e => {
                            e.preventDefault();
                            setEditing(prev => ({ ...prev, [cat]: false }));
                            setBudgets(prev => {
                              let val = parseFloat(String(rowDraft).replace(/[^0-9.]/g, ''));
                              if (isNaN(val) || val < 0) val = 0;
                              return { ...prev, [cat]: val };
                            });
                          }}
                          aria-label={`Save budget for ${cat}`}
                        >Save</button>
                        <button
                          className="btn btn-cancel"
                          style={{ minWidth: 34, padding: "4px 11px", fontSize: "0.99em" }}
                          onClick={e => {
                            e.preventDefault();
                            setEditing(prev => ({ ...prev, [cat]: false }));
                            setRowDrafts(prev => ({ ...prev, [cat]: Number(budgets[cat] || 0) }));
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
                          setEditing(prev => ({ ...prev, [cat]: true }));
                          setRowDrafts(prev => ({ ...prev, [cat]: Number(budgets[cat] || 0) }));
                        }}
                        aria-label={`Edit budget for ${cat}`}
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
            <li>Edit the budget for each category by clicking Edit. Save or Cancel each change independently.</li>
            <li>Variance is green if under budget, red if over.</li>
            <li>Month: {monthStr}</li>
            <li>Currencies are shown in your preferred symbol from Preferences.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default BudgetPlanner;
 l