import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePreferences } from './PreferencesProvider';

/**
 * Robust fallback to detect navigation for hash-based routing.
 * (This app uses window.location.hash for view navigation.)
 * Always call hooks at the top level for compatibility with React rules.
 */
function useNavLocation() {
  const [pathname, setPathname] = useState(window.location.hash || '/');
  useEffect(() => {
    const handler = () => setPathname(window.location.hash || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return { pathname };
}

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
 * Ensures the budgets are persisted across navigation, reloads, and state changes.
 */
function BudgetPlanner({ transactions = [], showToast }) {
  const { currencySymbol } = usePreferences() || { currencySymbol: '$' };
  const [budgets, setBudgets] = useState({});
  const [editingRow, setEditingRow] = useState(null); // Category string or null
  const [rowDraft, setRowDraft] = useState({});
  const [justSavedCat, setJustSavedCat] = useState(null);
  const [summary, setSummary] = useState({}); // for total budget and income warnings
  const [lastError, setLastError] = useState(null);

  // Detect hash navigation changes for reload
  const navLocation = useNavLocation();
  const lastLocationRef = useRef(navLocation && navLocation.pathname);

  // Loads budgets from localStorage and updates state
  const loadBudgets = useCallback(() => {
    try {
      const lsBudgets = localStorage.getItem(STORAGE_BUDGETS_KEY);
      setBudgets(lsBudgets ? JSON.parse(lsBudgets) : {});
    } catch {
      setBudgets({});
    }
  }, []);

  // On mount and tab visibility, always load budgets from localStorage
  useEffect(() => {
    loadBudgets();
    // Reload on tab focus/visibility
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

  // Reload budgets when navigation (tab/view) changes
  useEffect(() => {
    if (navLocation && navLocation.pathname !== lastLocationRef.current) {
      loadBudgets();
      lastLocationRef.current = navLocation.pathname;
    }
    // On first mount (or if budgets is empty), ensure in-sync with localStorage
    if (budgets && typeof budgets === 'object' && Object.keys(budgets).length === 0) {
      loadBudgets();
    }
    // eslint-disable-next-line
  }, [navLocation]);

  // Keep rowDraft synced with state on edit
  useEffect(() => {
    if (editingRow) {
      setRowDraft({ value: Number(budgets[editingRow] || 0) });
      setLastError(null);
    }
  }, [editingRow, budgets]);

  // Always write budgets state to localStorage on change
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

  // Show toast notification on save if available
  useEffect(() => {
    if (justSavedCat) {
      if (typeof showToast === 'function') {
        showToast('budget saved!', 'success');
      }
      // Reset after showing
      setTimeout(() => setJustSavedCat(null), 1000);
    }
  }, [justSavedCat, showToast]);

  // Actuals per-category for current month
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

  // Compute summary: total budgeted, income, warning if over budget
  useEffect(() => {
    let totalBudget = 0;
    for (let cat of EXPENSE_CATEGORIES) {
      totalBudget += Number(budgets[cat] || 0);
    }
    let income = 0;
    for (let tx of transactions) {
      if (tx.type === 'income' && tx.date && tx.date.startsWith(monthStr)) {
        income += Number(tx.amount);
      }
    }
    setSummary({ totalBudget, income, isOver: totalBudget > income });
  }, [budgets, transactions, monthStr]);

  // Enforce: Do not allow increasing a budget that would push total budgets > income for the month,
  // unless income is zero (then allow, with a warning)
  // Always allow reduction.
  // Returns: true if allowed, false if blocked
  const handleSaveBudget = (cat, rawValue) => {
    let val = parseFloat(String(rawValue).replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(val) || val < 0) val = 0;
    // If no month income, allow any budget (just warn)
    let priorBudget = Number(budgets[cat] || 0);
    let nextBudgets = { ...budgets, [cat]: val };
    let nextTotal = 0;
    for (let c of EXPENSE_CATEGORIES) {
      nextTotal += Number(nextBudgets[c] || 0);
    }
    let income = summary.income !== undefined ? summary.income : 0;
    if (income !== 0 && nextTotal > income && val > priorBudget) {
      setLastError(`Cannot set this budget: total budgets (${currencySymbol}${nextTotal.toFixed(2)}) exceed income (${currencySymbol}${income.toFixed(2)}). (Reduce another category or increase income.)`);
      return false;
    }
    setBudgets(nextBudgets);
    try {
      // Always update localStorage with the latest value directly on save
      localStorage.setItem(STORAGE_BUDGETS_KEY, JSON.stringify(nextBudgets));
    } catch {}
    setEditingRow(null);
    setRowDraft({});
    setJustSavedCat(cat);
    setLastError(null);
    if (typeof showToast === 'function') {
      showToast('budget saved!', 'success');
    }
    return true;
  };

  // Compute variance per-category for over-budget flag
  function getVarianceNote(variance, cat) {
    // If variance < 0 (over), note
    if (variance < 0) {
      return (<span style={{ color: 'var(--expense,#E74C3C)', fontSize: "0.96em", fontWeight: 500 }}> (exceeds)</span>);
    }
    return null;
  }

  // Budget summary row (Total Budget, Income, Budget Status)
  function renderBudgetSummary() {
    const { totalBudget = 0, income = 0, isOver = false } = summary;
    return (
      <div style={{
        padding: "13px 0 14px 0",
        marginBottom: 5,
        background: "rgba(108,46,190,0.05)",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignItems: "flex-start"
      }}>
        <div>
          <b>Total Budgeted:</b> <span>{currencySymbol}{totalBudget.toFixed(2)}</span>
        </div>
        <div>
          <b>Income this Month:</b> <span>{currencySymbol}{income.toFixed(2)}</span>
        </div>
        <div>
          {income === 0 && totalBudget > 0 && (
            <span style={{ color: "var(--expense,#E74C3C)", fontWeight: 500 }}>
              You do not have any income transactions this month; budgets will not be compared to income.
            </span>
          )}
          {income > 0 && isOver && (
            <span style={{ color: "var(--expense,#E74C3C)", fontWeight: 500 }}>
              Over Budget! Your expense budgets exceed your income for the month.
            </span>
          )}
          {income > 0 && !isOver && (
            <span style={{ color: "var(--income,#22C55E)", fontWeight: 500 }}>
              Budgets are within your income.
            </span>
          )}
        </div>
      </div>
    );
  }

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
        {/* Show summary panel */}
        {renderBudgetSummary()}
        {/* Optional lastError, e.g. for blocking raises */}
        {lastError && <div style={{ color: "var(--expense,#E74C3C)", marginBottom: 8 }}>{lastError}</div>}
        <div style={{ overflowX: "auto", width: "100%", marginBottom: 4 }}>
          <table
            className="budgetplanner-table"
            style={{
              minWidth: 420,
              width: "100%",
              maxWidth: 680,
              tableLayout: "fixed",
              fontSize: "1em",
            }}
          >
            <colgroup>
              <col style={{ minWidth: 110, width: "31%" }} />
              <col style={{ minWidth: 85, width: "23%" }} />
              <col style={{ minWidth: 85, width: "23%" }} />
              <col style={{ minWidth: 92, width: "23%" }} />
              <col style={{ minWidth: 35, width: "auto" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: "1.01em", padding: "9px 6px" }}>Category</th>
                <th style={{ textAlign: 'right', fontSize: "1.01em", padding: "9px 6px" }}>Budget</th>
                <th style={{ textAlign: 'right', fontSize: "1.01em", padding: "9px 6px" }}>Actual</th>
                <th style={{ textAlign: 'right', fontSize: "1.01em", padding: "9px 6px" }}>Variance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {EXPENSE_CATEGORIES.map((cat) => {
                const budgetVal = Number(budgets[cat] || 0);
                const actual = Number(actuals[cat] || 0);
                const isEditing = editingRow === cat;
                const variance = budgetVal - actual;
                const varColor = variance >= 0 ? 'var(--income,#22C55E)' : 'var(--expense,#E74C3C)';
                return (
                  <tr key={cat}>
                    <td className="budgetplanner-category-cell" style={{
                      fontWeight: 600,
                      color: 'var(--text-color, #402060)',
                      fontSize: '1.05em',
                      paddingLeft: 13,
                      paddingRight: 6,
                      textAlign: 'left',
                      minWidth: 70,
                      maxWidth: 175,
                      wordBreak: 'break-word'
                    }}>{cat}</td>
                    <td className="budgetplanner-budget-cell"
                        style={{ textAlign: 'right', padding: "8px 5px" }}>
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
                              typeof rowDraft.value === 'number'
                                && rowDraft.value !== 0
                                  ? rowDraft.value
                                  : rowDraft.value === 0
                                  ? ''
                                  : rowDraft.value || ''
                            }
                            onChange={e => {
                              let candidateValue = e.target.value === '' ? '' : parseFloat(e.target.value);
                              setRowDraft({ value: candidateValue });
                              setLastError(null);
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
                                setLastError(null);
                              }
                            }}
                          />
                          {/* Save/checkmark icon button */}
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
                            {/* Modern checkmark SVG */}
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
                          {/* Cancel/x icon button */}
                          <button
                            type="button"
                            className="budgetplanner-cancel-btn"
                            onClick={e => {
                              e.preventDefault();
                              setEditingRow(null);
                              setRowDraft({});
                              setLastError(null);
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
                            {/* Minimal cancel/X SVG */}
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
                        <>
                          <span tabIndex={0} className="budgetplanner-edit-span" style={{ minWidth: 35, width: 52, fontSize: "1em", padding: "3px 5px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {currencySymbol}{Number(budgetVal || 0).toFixed(2)}
                            <button
                              className="budgetplanner-edit-btn"
                              onClick={e => {
                                e.preventDefault();
                                setEditingRow(cat);
                                setLastError(null);
                              }}
                              aria-label={`Edit budget for ${cat}`}
                              title="Edit"
                              disabled={editingRow !== null}
                              style={{
                                background: 'none',
                                border: 'none',
                                marginLeft: 3,
                                padding: 0,
                                fontSize: '1em',
                                cursor: editingRow === null ? 'pointer' : 'not-allowed',
                                color: 'var(--primary, #6C2EBE)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                opacity: editingRow !== null ? 0.5 : 0.96
                              }}
                              tabIndex={0}
                              type="button"
                            >
                              {/* Simple pencil/edit SVG matching TransactionList */}
                              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
                                <path d="M14.8 3.8l1.4-1.3a2 2 0 112.8 2.8l-1.3 1.4-2.9-2.9zM3 17l2.4-.3c.2 0 .4-.1.5-.2L16.7 6.7l-2.9-2.9L3.6 14.1c-.1.1-.2.3-.2.5L3 17z" stroke="currentColor" strokeWidth="1.15" fill="none"/>
                              </svg>
                            </button>
                          </span>
                        </>
                      )}
                    </td>
                    <td className="budgetplanner-actual-cell"
                        style={{ textAlign: 'right', padding: "8px 5px", fontSize: '1em'}}>
                      {currencySymbol}{actual.toFixed(2)}
                    </td>
                    <td className="budgetplanner-variance-cell" style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: varColor,
                        fontSize: "1.11em",
                        letterSpacing: "0.01em",
                        padding: "8px 5px"
                      }}>
                      {variance >= 0 ? '+' : ''}
                      {currencySymbol}{variance.toFixed(2)}
                      {getVarianceNote(variance, cat)}
                    </td>
                    <td className="budgetplanner-actions-cell" style={{padding: "2px 2px", minWidth: 54}}>
                      {isEditing ? (
                        // No text buttons: handled as icon controls next to input above, so leave actions cell empty for editing row
                        <span></span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <button
                            className="btn btn-large"
                            style={{ minWidth: 32, padding: "6px 11px", fontSize: "0.99em" }}
                            onClick={e => {
                              e.preventDefault();
                              setEditingRow(cat);
                              setLastError(null);
                            }}
                            aria-label={`Edit budget for ${cat}`}
                            disabled={editingRow !== null}
                          >Edit</button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1em', marginTop: 23, marginLeft: 6 }}>
          <ul style={{ marginLeft: 9, paddingLeft: 0, listStyle: 'circle', color: 'var(--primary)', fontSize: '0.99em' }}>
            <li>Budgets and variances are per-category for the current month.</li>
            <li>Edit the budget for each category by clicking Edit. Only one row can be in edit mode at a time.</li>
            <li>
              Variance = <strong>Budget − Actual</strong>: <span style={{ color: 'var(--income,#22C55E)' }}>green</span> is under, <span style={{ color: 'var(--expense,#E74C3C)' }}>red</span> is over budget.
            </li>
            <li>Month: {monthStr}</li>
            <li>Your budget settings are auto-saved in your browser (one device).</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default BudgetPlanner;
