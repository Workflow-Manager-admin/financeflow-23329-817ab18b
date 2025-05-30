import React, { useState, useEffect, useMemo } from 'react';
import TransactionList from './transactions/TransactionList';
import TransactionFormModal from './transactions/TransactionFormModal';
import FilterBar from './transactions/FilterBar';
import PieChart from './visuals/PieChart';
import LineChart from './visuals/LineChart';
import SavingsRing from './savings/SavingsRing';
import SavingsGoalModal from './savings/SavingsGoalModal';
import './Dashboard.css';
import { usePreferences } from './PreferencesProvider';

const STORAGE_TRANSACTIONS = 'fflow-transactions-v1';
const STORAGE_GOAL = 'fflow-savings-goal-v1';

// PUBLIC_INTERFACE
/**
 * Dashboard component for managing transactions, savings goals,
 * and visualizations.
 * 
 * Layout reverted: No dashboard title/grouping—all content blocks follow original, "stacked" loose container layout.
 */
function Dashboard({ showToast, transactions = [], setTransactions }) {
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({ category: 'All', from: '', to: '' });
  const [showTxModal, setShowTxModal] = useState(false);
  const [editTx, setEditTx] = useState(null);

  // Savings goal is still only device-local
  const [goal, setGoal] = useState(() => {
    return JSON.parse(localStorage.getItem(STORAGE_GOAL)) || null;
  });
  const [showGoalModal, setShowGoalModal] = useState(false);

  // --- Filtering, calculation, local goal ---
  useEffect(() => {
    setFiltered(applyFilters(transactions, filters));
    // eslint-disable-next-line
  }, [filters, transactions]);

  useEffect(() => {
    if (goal && typeof goal === 'object' && Object.keys(goal).length > 0) {
      localStorage.setItem(STORAGE_GOAL, JSON.stringify(goal));
    }
    // eslint-disable-next-line
  }, [goal]);

  // ========== Actions ==============
  function handleSaveTransaction(tx) {
    let arr;
    if (tx.id) {
      arr = transactions.map(t => (t.id === tx.id ? tx : t));
      showToast && showToast('Transaction updated!', 'success');
    } else {
      const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      arr = [{ ...tx, id }, ...transactions];
      showToast && showToast('Transaction added!', 'success');
    }
    setTransactions(arr);
    setShowTxModal(false);
    setEditTx(null);
  }

  function handleDeleteTransaction(id) {
    setTransactions(transactions.filter(t => t.id !== id));
    showToast && showToast('Transaction deleted!', 'success');
  }

  function handleSaveGoal(goalData) {
    setGoal(goalData);
    showToast && showToast('Savings goal set!', 'success');
    setShowGoalModal(false);
  }

  // Milestone notification support for savings
  useEffect(() => {
    if (!goal) return;
    const target = goal.target;
    const sum = transactions.reduce(
      (acc, t) => t.type === 'income'
        ? acc + Number(t.amount)
        : acc - Number(t.amount)
      , 0
    );
    if (target && sum >= target && !goal.achieved) {
      setGoal(g => ({ ...g, achieved: true }));
      showToast && showToast('Congratulations! You have reached your savings goal!', 'success');
    }
    // eslint-disable-next-line
  }, [goal, transactions]);

  function applyFilters(data, filtersArg) {
    const { category = 'All', from = '', to = '' } = filtersArg || {};
    let arr = data;
    if (category && category !== 'All') {
      arr = arr.filter(t =>
        t.type === 'expense' &&
        ((t.category === 'Salary' && category === 'Rent/House') || t.category === category)
      );
    }
    if (from) arr = arr.filter(t => t.date >= from);
    if (to) arr = arr.filter(t => t.date <= to);
    return arr.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Category choices (only from expenses, skip incomes), normalize any "Salary" to "Rent/House" for filter UI
  const categories = useMemo(() => {
    const set = new Set(
      transactions
        .filter(t => t.type === 'expense')
        .map(t =>
          t.category === 'Salary' ? 'Rent/House' : t.category
        )
    );
    return ['All', ...Array.from(set).filter(Boolean)];
  }, [transactions]);

  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  function handleEditTransaction(tx) {
    setEditTx(tx);
    setShowTxModal(true);
  }

  const { currencySymbol } = usePreferences();

  // ========== Render - revert to "classic", loosely stacked layout ================
  return (
    <section className="dashboard">
      <div className="container" style={{
        maxWidth: 950,
        background: "var(--surface, #fff)",
        borderRadius: 13,
        boxShadow: "0 2px 16px rgba(60,42,150,0.07)",
        marginTop: 32,
        marginBottom: 0,
        marginLeft: "auto",
        marginRight: "auto",
        padding: "0 0 44px 0"
      }}>
        {/* Old Layout: NO dashboard heading/title at top */}
        <div className="dashboard-layout" style={{ paddingTop: 4, gap: 34 }}>
          {/* Visualizations */}
          <div className="dashboard-visuals-grid" style={{ marginTop: 0, marginBottom: 0 }}>
            <PieChart transactions={transactions} currencySymbol={currencySymbol} />
            <LineChart transactions={transactions} currencySymbol={currencySymbol} />
          </div>
          {/* Savings ring */}
          <div className="dashboard-upper">
            <SavingsRing
              goal={goal}
              stats={stats}
              onSetGoal={() => setShowGoalModal(true)}
              currencySymbol={currencySymbol}
            />
          </div>
          {/* Transactions list */}
          <div className="dashboard-txlist-outer">
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              categories={categories}
            />
            <TransactionList
              transactions={filtered}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              emptyMsg="No transactions found for selected filters."
              currencySymbol={currencySymbol}
            />
          </div>
        </div>
      </div>
      <button
        className="dashboard-add-btn"
        aria-label="Add transaction"
        title="Add new transaction"
        type="button"
        onClick={() => {
          setShowTxModal(true);
          setEditTx(null);
        }}
      >
        <span className="dashboard-add-btn-icon">＋</span>
        <span className="dashboard-add-btn-label">Add Transaction</span>
      </button>
      {showTxModal && (
        <TransactionFormModal
          onSave={handleSaveTransaction}
          onClose={() => {
            setShowTxModal(false);
            setEditTx(null);
          }}
          initial={editTx}
          currencySymbol={currencySymbol}
        />
      )}
      {showGoalModal && (
        <SavingsGoalModal
          onSave={handleSaveGoal}
          onClose={() => setShowGoalModal(false)}
          initial={goal}
        />
      )}
    </section>
  );
}

export default Dashboard;
