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
 */
function BudgetPlanner() {
  const { currencySymbol } = usePreferences() || { currencySymbol: '$' };
  const [budgets, setBudgets] = useState({});
  const [editing, setEditing] = useState({});
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

  // Handle budget cell edit
  const handleBudgetChange = (cat, val) => {
    setBudgets((prev) => ({ ...prev, [cat]: val }));
  };

  // Commit edit on blur or Enter
  const handleBudgetCommit = (cat) => {
    setEditing((prev) => ({ ...prev, [cat]: false }));
    setBudgets((prev) => {
      const raw = prev[cat];
      let val = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
      if (isNaN(val) || val < 0) val = 0;
      return { ...prev, [cat]: val };
    });
  };

  // Enable click-to-edit cell
  const startEdit = (cat) => setEditing((prev) => ({ ...prev, [cat]: true }));

  return (
    <section className="placeholder-view">
      <h1 style={{marginBottom: 17}}>Budget Planner</h1>
      <div className="container" style={{maxWidth: 500, marginTop: 14}}>
        <table style={{width: '100%', background: 'var(--surface,#fff)', borderRadius: 13, boxShadow: '0 2px 16px rgba(60,42,150,0.07)', overflow: 'hidden', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{background: 'var(--secondary,#F5F6FA)', color: 'var(--primary,#6C2EBE)'}}>
              <th style={{textAlign: 'left', padding: '12px', fontWeight: 600, fontSize: '1.05em'}}>Category</th>
              <th style={{textAlign: 'right', padding: '12px'}}>Budget</th>
              <th style={{textAlign: 'right', padding: '12px'}}>Actual</th>
              <th style={{textAlign: 'right', padding: '12px'}}>Variance</th>
            </tr>
          </thead>
          <tbody>
            {EXPENSE_CATEGORIES.map((cat) => {
              const budget = Number(budgets[cat] || 0);
              const actual = Number(actuals[cat] || 0);
              const variance = budget - actual;
              const varColor = variance >= 0 ? 'var(--income,#22C55E)' : 'var(--expense,#E74C3C)';
              return (
                <tr key={cat} style={{borderBottom: '1px solid var(--secondary,#eee)'}}>
                  <td style={{padding: '11px 12px', fontWeight: 500}}>{cat}</td>
                  <td style={{padding: '11px 12px', textAlign: 'right'}}>
                    {editing[cat]
                      ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          autoFocus
                          value={budgets[cat] === 0 ? '' : budgets[cat] || ''}
                          onChange={e => handleBudgetChange(cat, e.target.value)}
                          onBlur={() => handleBudgetCommit(cat)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleBudgetCommit(cat);
                          }}
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
                          onClick={() => startEdit(cat)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') startEdit(cat); }}
                          style={{
                            display: 'inline-block',
                            width: 82, textAlign: 'right', cursor: 'pointer', padding: '2px 5px', background: 'none'
                          }}
                          aria-label={`Edit budget for ${cat}`}
                        >
                          {currencySymbol}{Number(budget || 0).toFixed(2)}
                        </span>
                      )
                    }
                  </td>
                  <td style={{padding: '11px 12px', textAlign: 'right'}}>
                    {currencySymbol}{actual.toFixed(2)}
                  </td>
                  <td style={{padding: '11px 12px', textAlign: 'right', fontWeight: 600, color: varColor}}>
                    {variance >= 0 ? '+' : ''}
                    {currencySymbol}{variance.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{color: 'var(--text-secondary)', fontSize: '1.035em', marginTop: 19}}>
          <ul style={{marginLeft: 19, paddingLeft: 0, listStyle: 'circle', color: 'var(--primary)', fontSize:'0.99em'}}>
            <li>Edit the "Budget" cell for each category and press Enter or click away to save.</li>
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
