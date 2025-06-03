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
  if (!Array.isArray(transactions)) return null;
  const { currencySymbol = "$" } = usePreferences?.() || {};

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
                >
                  <span className="visually-hidden">Edit</span>✏️
                </button>
              )}
              {typeof onDelete === "function" && (
                <button
                  className="tx-action-btn"
                  title="Delete transaction"
                  aria-label="Delete"
                  onClick={() => onDelete(tx)}
                >
                  <span className="visually-hidden">Delete</span>🗑️
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
