import React from "react";
import "./TransactionList.css";
import { usePreferences } from "../PreferencesProvider";

/**
 * TransactionList - Modern, visually appealing list with clear hierarchy.
 *
 * @param {Object[]} transactions - Array of transaction objects.
 * @param {Function} [onEdit] - Handler for edit action.
 * @param {Function} [onDelete] - Handler for delete action.
 * @param {string} [emptyMsg] - Message when the list is empty.
 * @param {boolean} [modernExpenses=false] - Use modern, expenses-specific style.
 * @returns {JSX.Element}
 */
// PUBLIC_INTERFACE
function TransactionList({
  transactions = [],
  onEdit,
  onDelete,
  emptyMsg = "No transactions.",
  modernExpenses = false,
}) {
  // Always call hooks at the top-level
  const { currencySymbol = "$" } = usePreferences?.() || {};

  if (!Array.isArray(transactions)) return null;

  // Always modern style (for dashboard/expenses/etc)
  return (
    <ul className={`tx-list-modern universal${modernExpenses ? " expenses" : ""}`}>
      {transactions.length === 0 && (
        <li className="tx-list-empty-msg">{emptyMsg}</li>
      )}
      {transactions.map((tx, idx) => (
        <li
          key={tx.id ?? idx}
          className={`tx-item-modern universal${tx.type === "income"
            ? " income"
            : tx.type === "expense"
            ? " expense"
            : ""}`}
        >
          <div className="tx-row-modern-main">
            <span className="tx-type-dot" aria-label={tx.type === "income" ? "Income" : "Expense"} />
            <span className="tx-main-info">
              <span className="tx-category">{tx.category || (tx.type === "income" ? "Income" : "Expense")}</span>
              {tx.description && (
                <span className="tx-desc">{tx.description}</span>
              )}
            </span>
            <span
              className={`tx-amount-modern universal${tx.type === "income"
                ? " income"
                : tx.type === "expense"
                ? " expense"
                : ""}`}
              data-type={tx.type}
            >
              {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
              {currencySymbol}
              {(tx.amount ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="tx-row-modern-meta">
            <span className="tx-date">{tx.date}</span>
            <div className="tx-row-modern-actions">
              {typeof onEdit === "function" && (
                <button
                  className="tx-action-btn"
                  title="Edit transaction"
                  aria-label="Edit"
                  onClick={() => onEdit(tx)}
                  style={{ display: "inline-flex", alignItems: "center", padding: "3px", marginRight: 4, border: "none", background: "none", cursor: "pointer" }}
                >
                  <span className="visually-hidden">Edit</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--primary,#6C2EBE)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: "inline-block", verticalAlign: "middle" }}
                    aria-hidden="true"
                  >
                    <path d="M15.232 5.232l3.536 3.536M13.768 6.768l3.536 3.536M4 20h4.586a1 1 0 0 0 .707-.293l9.828-9.828a2 2 0 0 0 0-2.828l-3.536-3.536a2 2 0 0 0-2.828 0l-9.828 9.828A1 1 0 0 0 4 20z"/>
                  </svg>
                </button>
              )}
              {typeof onDelete === "function" && (
                <button
                  className="tx-action-btn"
                  title="Delete transaction"
                  aria-label="Delete"
                  onClick={() => onDelete(tx)}
                  style={{ display: "inline-flex", alignItems: "center", padding: "3px", color: "var(--expense,#E74C3C)", border: "none", background: "none", cursor: "pointer" }}
                >
                  <span className="visually-hidden">Delete</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--expense,#E74C3C)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: "inline-block", verticalAlign: "middle" }}
                    aria-hidden="true"
                  >
                    <rect x="3" y="6" width="18" height="13" rx="2" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default TransactionList;
