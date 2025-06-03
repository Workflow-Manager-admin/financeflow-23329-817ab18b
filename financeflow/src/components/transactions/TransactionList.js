import React from 'react';
import './TransactionList.css';
import { usePreferences } from '../PreferencesProvider';

function formatDateFriendly(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

/**
 * PUBLIC_INTERFACE
 * TransactionList will always use currencySymbol from Preferences context instead of a prop, to guarantee live updates on global currency changes.
 */
function TransactionList({
  transactions,
  onEdit,
  onDelete,
  emptyMsg,
  modernExpenses,
}) {
  const { currencySymbol } = usePreferences();

  if (!transactions || transactions.length === 0) {
    return (
      <div className={`transaction-list-empty${modernExpenses ? ' modern-expenses-list-empty' : ''}`}>
        {emptyMsg || "No transactions found."}
      </div>
    );
  }

  // Polished entry visuals if modernExpenses: highlight category, bold amount, tight hierarchy
  return (
    <ul className={`transaction-list${modernExpenses ? ' modern-expenses-list' : ''}`}>
      {transactions.map((tx, idx) => (
        <li
          key={idx}
          className={`transaction-list-item${tx.type === 'income'
            ? ' tx-income'
            : ' tx-expense'
          }${modernExpenses ? ' modern-expenses-item' : ''}`}
        >
          <div className={`tx-amount-row${modernExpenses ? ' modern-amount-row' : ''}`}>
            <span
              className={`tx-amount${tx.type === 'income'
                ? ' tx-income'
                : ' tx-expense'
              }${modernExpenses ? ' modern-amount' : ''}`}
            >
              {tx.type === 'expense' ? '-' : '+'}
              {currencySymbol}
              {Number(tx.amount).toLocaleString(undefined, {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className={modernExpenses ? "tx-date modern-date" : "tx-date"}>
              {modernExpenses
                ? formatDateFriendly(tx.date)
                : tx.date}
            </span>
          </div>
          <div className={`tx-category-row${modernExpenses ? ' modern-category-row' : ''}`}>
            <span className={modernExpenses ? "tx-category modern-category" : "tx-category"}>
              {tx.category}
            </span>
            {tx.description && (
              <span className={modernExpenses ? "tx-description modern-description" : "tx-description"}>
                {tx.description}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default TransactionList;
