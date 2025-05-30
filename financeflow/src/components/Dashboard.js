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
 * Root cause analysis (developer note): If dashboard data is lost only between
 * tab navigations, not on browser refresh, data should always reload from localStorage.
 * If you see data loss, it likely means:
 *  - Storage keys are cleared or overwritten elsewhere (not expected in this codebase).
 *  - Your browser/extensions clear localStorage or operate in private mode.
 *  - Storage corruption/quota.
 * For cross-device sync, add a backend/Firebase adapter to this state model.
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
  // Enhanced: rehydrate from storage on first render AND on route changes (hashchange) or storage events (sync between tabs/windows)
  useEffect(() => {
    function rehydrateFromStorage() {
      const lsRaw = localStorage.getItem(STORAGE_TRANSACTIONS);
      const storedTx = JSON.parse(lsRaw) || [];
      setTransactions(storedTx);

      const storedGoal = JSON.parse(localStorage.getItem(STORAGE_GOAL)) || null;
      setGoal(storedGoal);

      if (lsRaw && storedTx.length === 0) {
        // eslint-disable-next-line
        console.warn(
          "[FinanceFlow] Dashboard: localStorage['fflow-transactions-v1'] previously set but empty after parse. " +
          "If you experience data loss, check for clearing/corruption/multiple tabs/extensions."
        );
      }
    }

    // Initial hydration
    rehydrateFromStorage();

    // Listen for navigation changes (in-app route/hashes)
    function onHashChange() {
      if (window.location.hash.replace('#', '') === '' || window.location.hash.replace('#', '') === '/') {
        // Navigated to dashboard, always refresh from storage
        rehydrateFromStorage();
      }
    }

    // Listen for changes in other tabs
    function onStorage(e) {
      if (e.key === STORAGE_TRANSACTIONS || e.key === STORAGE_GOAL) {
        rehydrateFromStorage();
      }
    }

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('storage', onStorage);
    };
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
    // Only filter by category for expenses; skip filter for incomes
    if (category && category !== 'All') {
      arr = arr.filter(t =>
        t.type === 'expense' &&
        // Match category, mapping legacy Salary to Rent/House
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

  // Get currencySymbol from preferences
  const { currencySymbol } = usePreferences();

  // ========== Render ================
  return (
    <section className="dashboard">
      {/* Title: visually grouped within dashboard's main grid content */}
      <div
        className="container"
        style={{
          maxWidth: 950,
          background: "var(--surface, #fff)",
          borderRadius: 13,
          boxShadow: "0 2px 16px rgba(60,42,150,0.07)",
          marginTop: 22,
          marginBottom: 0,
          marginLeft: "auto",
          marginRight: "auto",
          padding: "0 0 32px 0"
        }}
      >
        {/* Title closely grouped with dashboard content */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 0,
          marginBottom: 0
        }}>
          <h1
            style={{
              margin: 0,
              fontSize: "2.1rem",
              color: "var(--primary,#6C2EBE)",
              fontWeight: 700,
              letterSpacing: "0.01em",
              textAlign: "left",
              flex: '1 1 auto'
            }}
          >
            Dashboard
          </h1>
        </div>
        <div className="dashboard-layout" style={{ paddingTop: 6 }}>
          {/* Visualizations */}
          <div className="dashboard-visuals-grid" style={{ marginBottom: 0, marginTop: '6px' }}>
            <PieChart transactions={transactions} currencySymbol={currencySymbol} />
            <LineChart transactions={transactions} currencySymbol={currencySymbol} />
          </div>
          {/* Savings ring */}
          <div className="dashboard-upper" style={{ marginTop: '20px', marginBottom: 0 }}>
            <SavingsRing
              goal={goal}
              stats={stats}
              onSetGoal={() => setShowGoalModal(true)}
              currencySymbol={currencySymbol}
            />
          </div>
          {/* Transactions list */}
          <div className="dashboard-txlist-outer" style={{ marginTop: '24px' }}>
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
