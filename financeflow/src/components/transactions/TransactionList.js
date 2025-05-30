import React from 'react';
import './TransactionList.css';

/**
 * PUBLIC_INTERFACE
 * TransactionList: Displays a list of transactions. Amounts use currencySymbol prop.
 */
function TransactionList({ transactions, onEdit, onDelete, emptyMsg, currencySymbol = '$' }) {
  if (!transactions.length) {
    return <div className="txlist-empty">{emptyMsg}</div>;
  }

  return (
    <div className="transaction-list">
      {transactions.map((tx) => (
        <div className={`tx-row tx-${tx.type}`} key={tx.id}>
          <div className="tx-main">
            <span className="tx-title">
              {tx.type === 'expense'
                ? (tx.category === 'Salary' ? 'Rent/House' : tx.category)
                : (tx.description || 'Income')}
            </span>
            <span className="tx-date">{tx.date}</span>
            <span className="tx-desc">{tx.description}</span>
          </div>
          <div className="tx-amtpart">
            <span className={`tx-amt ${tx.type}`}>
              {tx.type === 'income' ? '+' : '-'}
              {currencySymbol}
              {Number(tx.amount).toFixed(2)}
            </span>
            <button onClick={() => onEdit(tx)} className="tx-edit-btn" aria-label="Edit">
              {/* Simple pencil/edit SVG */}
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M14.8 3.8l1.4-1.3a2 2 0 112.8 2.8l-1.3 1.4-2.9-2.9zM3 17l2.4-.3c.2 0 .4-.1.5-.2L16.7 6.7l-2.9-2.9L3.6 14.1c-.1.1-.2.3-.2.5L3 17z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
              </svg>
            </button>
            <button onClick={() => onDelete(tx.id)} className="tx-delete-btn" aria-label="Delete">
              {/* Simple trash bin SVG */}
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="6" y="8" width="1.3" height="6" rx=".5" fill="currentColor" />
                <rect x="9.3" y="8" width="1.3" height="6" rx=".5" fill="currentColor" />
                <rect x="12.6" y="8" width="1.3" height="6" rx=".5" fill="currentColor" />
                <rect x="5" y="5.5" width="10" height="1.3" rx=".6" fill="currentColor" />
                <rect x="8" y="3" width="4" height="1.3" rx=".6" fill="currentColor" />
                <rect x="4" y="5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.1" fill="none"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TransactionList;
