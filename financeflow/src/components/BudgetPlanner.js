import React, { useState, useEffect } from 'react';
import { usePreferences } from './PreferencesProvider';

// Expense categories (matching TransactionFormModal minus 'Investment' & 'Salary')
const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Utilities', 'Subscriptions',
  'Rent/House', 'Gift', 'Healthcare', 'Other'
];

const STORAGE_BUDGETS_KEY = 'fflow-budgets-v1';

// PUBLIC_INTERFACE
/**
 * BudgetPlanner displays and edits monthly budgets per expense category (excl. investments).
 * Shows: Category, Budget (editable), Actual (current month), Variance (color-coded).
 * Persists budgets in localStorage; reads currency symbol from preferences.
 * Now triggers a "budget saved!" notification on save and persists entered budgets between tab switches using localStorage.
 */
function BudgetPlanner({ transactions = [], showToast }) {
  const { currencySymbol } = usePreferences() || { currencySymbol: '$' };
  const [budgets, setBudgets] = useState({});
  const [editingRow, setEditingRow] = useState(null); // Category string or null
  const [rowDraft, setRowDraft] = useState({});
  const [justSavedCat, setJustSavedCat] = useState(null);

  // Load budgets from localStorage on mount and every navigation (across tab switches)
  useEffect(() => {
    const loadBudgets = () => {
      try {
        const lsBudgets = localStorage.getItem(STORAGE_BUDGETS_KEY);
        setBudgets(lsBudgets ? JSON.parse(lsBudgets) : {});
      } catch {
        setBudgets({});
      }
    };

    loadBudgets();

    // Listen for page visibility change to reload budgets on navigation/tab switch
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadBudgets();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Update the rowDraft if budgets or editingRow changes
  useEffect(() => {
    if (editingRow) {
      setRowDraft({ value: Number(budgets[editingRow] || 0) });
    }
  }, [editingRow, budgets]);

  // Save budgets to localStorage on change
  useEffect(() => {
    if (
      budgets &&
      typeof budgets === 'object' &&
      !Array.isArray(budgets) &&
      Object.keys(budgets).length >= 0
    ) {
      localStorage.setItem(STORAGE_BUDGETS_KEY, JSON.stringify(budgets));
    }
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

  // Calculate total income for the current month
  const monthIncome = React.useMemo(() => {
    let income = 0;
    transactions.forEach(tx => {
      if (tx.type === 'income' && tx.date && tx.date.startsWith(monthStr)) {
        income += Number(tx.amount);
      }
    });
    return income;
  }, [transactions, monthStr]);

  // Show toast notification on save if available
  useEffect(() => {
    if (justSavedCat) {
      if (typeof showToast === 'function') {
        showToast('budget saved!', 'success');
      }
      // Reset after showing
      setTimeout(() => setJustSavedCat(null), 1200);
    }
  }, [justSavedCat, showToast]);

  // Compute the total budgeted (sum of all categories)
  const budgetedTotal = EXPENSE_CATEGORIES.reduce((sum, cat) => sum + Number(budgets[cat] || 0), 0);

  // Determine if there's an income warning
  const overBudget = budgetedTotal > monthIncome && monthIncome !== 0;

  return (
    <section className="placeholder-view">
      <div
        className="container"
        style={{
          maxWidth: 980,
          minWidth: 310,
          background: "var(--surface,#fff)",
          borderRadius: 17,
          boxShadow: "0 3px 28px rgba(60,42,150,0.08)",
          marginTop: 36,
          marginBottom: 0,
          padding: "0 0 44px 0",
          border: "1px solid var(--secondary, #ececec)"
        }}
      >
        <h1
          style={{
            marginTop: 27,
            marginBottom: 26,
            fontSize: "2.3rem",
            color: "var(--primary,#6C2EBE)",
            fontWeight: 800,
            letterSpacing: "0.011em",
            textAlign: "left",
            lineHeight: 1.13
          }}
        >
          Budget Planner
        </h1>
        <div style={{ overflowX: "auto", width: "100%", marginBottom: 8 }}>
          <table className="budgetplanner-table" style={{ minWidth: 700, width: "98%", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "26%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "19%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Category</th>
                <th style={{ textAlign: 'right' }}>Budget</th>
                <th style={{ textAlign: 'right' }}>Actual</th>
                <th style={{ textAlign: 'right' }}>Variance</th>
                <th style={{ textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {EXPENSE_CATEGORIES.map((cat) => {
                const budgetPrev = Number(budgets[cat] || 0);
                const actual = Number(actuals[cat] || 0);
                const isEditing = editingRow === cat;

                // Variance column: Clamp each category's "remaining" based on user's income for the month
                // Compute share of income allocated to this category, only if budgetedTotal > 0 and monthIncome > 0
                let incomeAwareVariance = budgetPrev - actual;
                if (monthIncome > 0 && budgetedTotal > monthIncome) {
                  // Adjusted proportional max for this category: (budgetPrev / budgetedTotal) * monthIncome
                  const allowable = (budgetPrev / budgetedTotal) * monthIncome;
                  incomeAwareVariance = allowable - actual;
                }
                const varColor = incomeAwareVariance >= 0 ? 'var(--income,#22C55E)' : 'var(--expense,#E74C3C)';

                return (
                  <tr key={cat} style={{}}>
                    <td className="budgetplanner-category-cell">{cat}</td>
                    <td className="budgetplanner-budget-cell" style={{ textAlign: 'right' }}>
                      {isEditing ? (
                        <input
                          className="budgetplanner-input"
                          type="number"
                          min={0}
                          step="0.01"
                          autoFocus
                          value={
                            typeof rowDraft.value === 'number'
                              && rowDraft.value !== 0
                                ? rowDraft.value
                                : rowDraft.value === 0
                                ? ''
                                : rowDraft.value || ''
                          }
                          onChange={e => setRowDraft({ value: e.target.value })}
                          aria-label={`Budget for ${cat}`}
                        />
                      ) : (
                        <span
                          tabIndex={0}
                          className="budgetplanner-edit-span"
                        >
                          {currencySymbol}{Number(budgetPrev || 0).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="budgetplanner-actual-cell" style={{ textAlign: 'right' }}>
                      {currencySymbol}{actual.toFixed(2)}
                    </td>
                    <td className="budgetplanner-variance-cell" style={{ textAlign: 'right', fontWeight: 700, color: varColor }}>
                      {incomeAwareVariance >= 0 ? '+' : ''}
                      {currencySymbol}{incomeAwareVariance.toFixed(2)}
                    </td>
                    <td className="budgetplanner-actions-cell">
                      {isEditing ? (
                        <div>
                          <button
                            className="btn btn-large"
                            style={{ minWidth: 34, padding: "4px 11px", fontSize: "0.99em" }}
                            onClick={e => {
                              e.preventDefault();
                              let val = parseFloat(String(rowDraft.value).replace(/[^0-9.]/g, ''));
                              if (!Number.isFinite(val) || val < 0) val = 0;
                              setBudgets(prev => {
                                const updated = { ...prev, [cat]: val };
                                try {
                                  localStorage.setItem(STORAGE_BUDGETS_KEY, JSON.stringify(updated));
                                } catch {}
                                return updated;
                              });
                              setEditingRow(null);
                              setRowDraft({});
                              setJustSavedCat(cat);
                              if (typeof showToast === 'function') {
                                showToast('budget saved!', 'success');
                              }
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                          {justSavedCat === cat && !showToast && (
                            <span style={{ color: 'var(--income,#22C55E)', marginLeft: 6, fontWeight: 500, transition: 'opacity 0.18s', opacity: 0.90 }}>
                              budget saved!
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="budgetplanner-summary-row" style={{ display: 'flex', flexWrap: 'wrap', marginTop: 10, gap: '44px 24px', alignItems: 'center', justifyContent: 'flex-start', fontSize: '1.08em', color: 'var(--primary)' }}>
          <div>
            <span style={{ fontWeight: 500 }}>Total Budgeted:</span> {currencySymbol}{budgetedTotal.toFixed(2)}
          </div>
          <div>
            <span style={{ fontWeight: 500 }}>Income this Month:</span> {currencySymbol}{monthIncome.toFixed(2)}
          </div>
          {monthIncome > 0 && (
            <div style={{ fontWeight: 500, color: overBudget ? 'var(--expense,#E74C3C)' : 'var(--income,#22C55E)' }}>
              {overBudget
                ? '⚠️ Over Budget! Your expense budgets exceed your income. Variance recalculated accordingly.'
                : '✓ Budgets are within your income.'}
            </div>
          )}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1.08em', marginTop: 23 }}>
          <ul style={{ marginLeft: 28, paddingLeft: 0, listStyle: 'circle', color: 'var(--primary)', fontSize: '1em' }}>
            <li>Visually expanded table for clear, non-scrunched overview and easier editing.</li>
            <li>Edit the budget for each category by clicking Edit. Only one row can be in edit mode at a time.</li>
            <li>Variance is <span style={{ color: 'var(--income,#22C55E)' }}>green</span> if under budget (with income-awareness), <span style={{ color: 'var(--expense,#E74C3C)' }}>red</span> if over.</li>
            <li>Variance now factors in your monthly income: you cannot allocate >100% of your income to expenses.</li>
            <li>Month: {monthStr}</li>
            <li>Currencies are shown in your preferred symbol from Preferences.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default BudgetPlanner;
