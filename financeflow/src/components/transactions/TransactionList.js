import React from 'react';
import './TransactionList.css';

// PUBLIC_INTERFACE
function TransactionList({ transactions, onEdit, onDelete, emptyMsg }) {
  if (!transactions.length) {
    return <div className="txlist-empty">{emptyMsg}</div>;
  }

  return (
    <div className="transaction-list">
      {transactions.map((tx) => (
        <div className={`tx-row tx-${tx.type}`} key={tx.id}>
          <div className="tx-main">
            <span className="tx-title">{tx.category}</span>
            <span className="tx-date">{tx.date}</span>
            <span className="tx-desc">{tx.description}</span>
          </div>
          <div className="tx-amtpart">
            <span className={`tx-amt ${tx.type}`}>{tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}</span>
            <button onClick={() => onEdit(tx)} className="tx-edit-btn" aria-label="Edit"><span role="img" aria-label="edit">✏️</span></button>
            <button onClick={() => onDelete(tx.id)} className="tx-delete-btn" aria-label="Delete"><span role="img" aria-label="delete">🗑️</span></button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TransactionList;
