import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import ThemeProvider from './components/ThemeProvider';
import Sidebar from './components/Sidebar';
import OnboardingModal from './components/OnboardingModal';
import Dashboard from './components/Dashboard';
import ToastNotification from './components/ToastNotification';

// Placeholder views
import TransactionList from './components/transactions/TransactionList';
import FilterBar from './components/transactions/FilterBar';
// Expense and Calendar state: load from localStorage like Dashboard does
const STORAGE_TRANSACTIONS = 'fflow-transactions-v1';

// PUBLIC_INTERFACE
function ExpensesView() {
  const [transactions, setTransactions] = React.useState(() => {
    return JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS)) || [];
  });
  // Only expenses, sorted newest first
  const expenseTx = React.useMemo(
    () => transactions.filter(t => t.type === 'expense').sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );
  // Filtering state (optional: reuse Dashboard logic)
  const [filters, setFilters] = React.useState({ category: 'All', from: '', to: '' });
  const categories = React.useMemo(() => {
    const set = new Set(expenseTx.map(t => t.category));
    return ['All', ...Array.from(set).filter(Boolean)];
  }, [expenseTx]);
  function applyFilters(data, filtersArg) {
    const { category = 'All', from = '', to = '' } = filtersArg || {};
    let arr = data;
    if (category && category !== 'All') {
      arr = arr.filter(t => t.category === category);
    }
    if (from) arr = arr.filter(t => t.date >= from);
    if (to) arr = arr.filter(t => t.date <= to);
    return arr;
  }
  const filtered = React.useMemo(() => applyFilters(expenseTx, filters), [expenseTx, filters]);
  return (
    <section className="placeholder-view">
      <h1>Expenses</h1>
      <div className="container">
        <FilterBar filters={filters} setFilters={setFilters} categories={categories} />
        <TransactionList
          transactions={filtered}
          onEdit={() => {}} // No editing in this tab; dashboard only
          onDelete={() => {}} // No deleting; dashboard only
          emptyMsg="No expenses found."
        />
        {filtered.length === 0 && <p style={{color: "var(--text-secondary)"}}>No expenses for current filters.</p>}
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
function CalendarView() {
  // Read all transactions
  const [transactions] = React.useState(() => JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS)) || []);
  // Group by date
  const grouped = React.useMemo(() => {
    let byDate = {};
    transactions.forEach(tx => {
      if (!tx.date) return;
      if (!byDate[tx.date]) byDate[tx.date] = [];
      byDate[tx.date].push(tx);
    });
    // Sort dates descending
    const allDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
    return allDates.map(date => ({ date, txs: byDate[date] }));
  }, [transactions]);
  return (
    <section className="placeholder-view">
      <h1>Transaction Calendar</h1>
      <div className="container">
        {grouped.length === 0 ? (
          <p>No transactions to show on the calendar yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {grouped.map(day => (
              <li key={day.date} style={{marginBottom: 14, borderBottom: "1px solid var(--secondary,#ececec)"}}>
                <div style={{ fontWeight: 600, color: "var(--primary,#6C2EBE)" }}>{day.date}</div>
                <ul style={{ listStyle: "disc", marginLeft: 14, color: "var(--text-secondary)" }}>
                  {day.txs.map((tx, idx) => (
                    <li key={idx}>
                      {tx.type === "expense" ? (
                        <span style={{color:"var(--expense,#E74C3C)"}}>– ${Number(tx.amount).toFixed(2)} | {tx.category}</span>
                      ) : (
                        <span style={{color:"var(--income,#22C55E)"}}>+ ${Number(tx.amount).toFixed(2)} | Income</span>
                      )}
                      <span style={{marginLeft:8, fontStyle:"italic"}}>{tx.description}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
function ProfileView() {
  return (
    <section className="placeholder-view"><h1>Profile</h1>
      <div className="container"><p>User profile management coming soon.</p></div>
    </section>
  );
}
function SettingsView() {
  return (
    <section className="placeholder-view"><h1>Settings</h1>
      <div className="container"><p>Settings and app preferences go here.</p></div>
    </section>
  );
}

// PUBLIC_INTERFACE
function App() {
  // Onboarding flag
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Toast notification: { message, type } or null
  const [toast, setToast] = useState(null);

  // Simple in-app router (hash-based for SPA)
  const initialRoute = window.location.hash.replace('#', '') || '/';
  const [route, setRoute] = useState(initialRoute);

  useEffect(() => {
    // Show onboarding if first visit
    if (!localStorage.getItem('fflow-onboarded')) {
      setShowOnboarding(true);
    }
    // Handle hash route change
    const onHashChange = () => {
      setRoute(window.location.hash.replace('#', '') || '/');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => { window.removeEventListener('hashchange', onHashChange); };
  }, []);

  const handleOnboardingDismiss = () => {
    localStorage.setItem('fflow-onboarded', '1');
    setShowOnboarding(false);
  };

  // Nav handler to update route
  const handleNavigate = (to) => {
    if (to !== route) {
      window.location.hash = to;
      setRoute(to);
    }
  };

  // Toast utility for child components
  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    // Auto dismiss
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Collapse sidebar on mobile by default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 650
  );
  useEffect(() => {
    // Responsive collapse/expand on window resize
    const handler = () => {
      if (window.innerWidth < 650 && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 650 && sidebarCollapsed) {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
    // eslint-disable-next-line
  }, [sidebarCollapsed]);

  // Determine view based on "route"
  let View;
  switch (route) {
    case '/':
      View = <Dashboard showToast={notify} />;
      break;
    case '/expenses':
      View = <ExpensesView />;
      break;
    case '/calendar':
      View = <CalendarView />;
      break;
    case '/profile':
      View = <ProfileView />;
      break;
    case '/settings':
      View = <SettingsView />;
      break;
    default:
      View = <section className="placeholder-view"><div className="container"><h1>Not Found</h1></div></section>;
  }

  return (
    <ThemeProvider>
      <div className="app" tabIndex="-1">
        <Sidebar
          currentRoute={route}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggle={setSidebarCollapsed}
        />
        <main className="main-content" tabIndex={-1} aria-live="polite">
          {View}
        </main>
        {showOnboarding && (
          <OnboardingModal onClose={handleOnboardingDismiss} />
        )}
        {toast && (
          <ToastNotification message={toast.message} type={toast.type} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;