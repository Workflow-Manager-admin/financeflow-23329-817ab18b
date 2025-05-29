import React, { useState, useEffect, useMemo } from 'react';
import TransactionList from './transactions/TransactionList';
import TransactionFormModal from './transactions/TransactionFormModal';
import FilterBar from './transactions/FilterBar';
import PieChart from './visuals/PieChart';
import LineChart from './visuals/LineChart';
import SavingsRing from './savings/SavingsRing';
import SavingsGoalModal from './savings/SavingsGoalModal';
import './Dashboard.css';

const STORAGE_TRANSACTIONS = 'fflow-transactions-v1';
const STORAGE_GOAL = 'fflow-savings-goal-v1';

// PUBLIC_INTERFACE
/**
 * Dashboard component for managing transactions, savings goals,
 * and visualizations.
 */
function Dashboard({ showToast }) {
  // ============ Data State ===============
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({ category: 'All', from: '', to: '' });
  const [showTxModal, setShowTxModal] = useState(false);
  const [editTx, setEditTx] = useState(null);

  const [goal, setGoal] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // ========== Storage Sync & Boot =========
  useEffect(() => {
    // Init from storage
    const storedTx = JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS)) || [];
    setTransactions(storedTx);

    const storedGoal = JSON.parse(localStorage.getItem(STORAGE_GOAL)) || null;
    setGoal(storedGoal);
  }, []);

  // Save transactions to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(transactions));
    setFiltered(applyFilters(transactions, filters));
    // eslint-disable-next-line
  }, [transactions]);

  // Apply filters when filters or transactions change
  useEffect(() => {
    setFiltered(applyFilters(transactions, filters));
    // eslint-disable-next-line
  }, [filters, transactions]);

  // Save goal to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_GOAL, JSON.stringify(goal));
    // eslint-disable-next-line
  }, [goal]);

  // ========== Actions ==============
  // Add or Edit transaction
  function handleSaveTransaction(tx) {
    setTransactions(prev => {
      let arr;
      if (tx.id) {
        arr = prev.map(t => (t.id === tx.id ? tx : t));
        showToast('Transaction updated!', 'success');
      } else {
        const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
        arr = [{ ...tx, id }, ...prev];
        showToast('Transaction added!', 'success');
      }
      return arr;
    });
    setShowTxModal(false);
    setEditTx(null);
  }

  function handleDeleteTransaction(id) {
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast('Transaction deleted!', 'success');
  }

  function handleSaveGoal(goalData) {
    setGoal(goalData);
    showToast('Savings goal set!', 'success');
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
      showToast('Congratulations! You have reached your savings goal!', 'success');
    }
    // eslint-disable-next-line
  }, [goal, transactions]);

  // Filtering logic
  function applyFilters(data, filtersArg) {
    const { category = 'All', from = '', to = '' } = filtersArg || {};
    let arr = data;
    if (category && category !== 'All') {
      arr = arr.filter(t => t.category === category);
    }
    if (from) arr = arr.filter(t => t.date >= from);
    if (to) arr = arr.filter(t => t.date <= to);
    return arr.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Category choices
  const categories = useMemo(() => {
    const set = new Set(transactions.map(t => t.category));
    return ['All', ...Array.from(set)];
  }, [transactions]);

  // Amount stats
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

  // Handler for editing a transaction
  function handleEditTransaction(tx) {
    setEditTx(tx);
    setShowTxModal(true);
  }

  // ========== Render ================
  return (
    <section className="dashboard">
      <div className="container dashboard-layout">
        <div className="dashboard-upper">
          <SavingsRing
            goal={goal}
            stats={stats}
            onSetGoal={() => setShowGoalModal(true)}
          />
        </div>
        <div className="dashboard-visuals-grid">
          <PieChart transactions={transactions} />
          <LineChart transactions={transactions} />
        </div>
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
          />
        </div>
        {/* Modern single Add Transaction FAB */}
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
