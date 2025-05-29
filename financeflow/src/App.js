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

/**
 * PUBLIC_INTERFACE
 * CalendarView displays a full Apple-style calendar month grid.
 * Each day shows small colored blocks: green for income, red for expense,
 * supporting multiple transactions for the same day.
 */
function CalendarView() {
  // Read transactions once from localStorage
  const [transactions] = React.useState(
    () => JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS)) || []
  );

  // Calendar logic helpers
  const today = new Date();
  // Use controlled month/year state for navigation if desired in future
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);

  // Build date objects for current month grid (start/end days, etc)
  function getMonthGrid(year, month) {
    // month: 0-indexed (0=Jan)
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const firstDayIdx = firstOfMonth.getDay(); // 0=Sun...6=Sat
    const daysInMonth = lastOfMonth.getDate();

    // Apple/Google calendar grid: always show Sun-Sat (start weekday Sunday)
    // Fill leading days with prev month if firstDayIdx>0.
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthDays = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

    // Calculate grid: returns array of {dateObj, inMonth, dateStr}
    let days = [];
    // Leading prev month
    for (let i = 0; i < firstDayIdx; i++) {
      const d = prevMonthDays - (firstDayIdx - i - 1);
      let dateObj = new Date(prevMonthYear, prevMonth, d);
      days.push({
        dateObj,
        inMonth: false,
        dateStr: dateObj.toISOString().slice(0, 10),
      });
    }
    // Main month
    for (let d = 1; d <= daysInMonth; d++) {
      let dateObj = new Date(year, month, d);
      days.push({
        dateObj,
        inMonth: true,
        dateStr: dateObj.toISOString().slice(0, 10),
      });
    }
    // Trailing next month
    let totalCells = days.length;
    let trailing = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
      let dateObj = new Date(year, month + 1, i);
      days.push({
        dateObj,
        inMonth: false,
        dateStr: dateObj.toISOString().slice(0, 10),
      });
    }
    return days;
  }

  // Group transactions per date for easy lookup; { 'YYYY-MM-DD': [tx, ...], ... }
  const txByDate = React.useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      if (tx.date) {
        if (!map[tx.date]) map[tx.date] = [];
        map[tx.date].push(tx);
      }
    });
    return map;
  }, [transactions]);

  // Prepare grid days for current month
  const gridDays = React.useMemo(
    () => getMonthGrid(currentMonthDate.getFullYear(), currentMonthDate.getMonth()),
    [currentMonthDate]
  );

  // Names of weekdays, Sun-Sat (Apple style uses short e.g. S M T W T F S)
  const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  // ENSURE CSS INTEGRATION: Add .calendar-view, .calendar-table, .calendar-cell, .calendar-daynum, .calendar-block (expense/income) etc.
  // In actual prod, this CSS would be in a separate file, inlined here for demo/speed

  return (
    <section className="placeholder-view calendar-view">
      <h1>Transaction Calendar</h1>
      <div className="container">
        <div style={{ maxWidth: 430, margin: "0 auto", background: "var(--surface,#fff)", borderRadius: 13, boxShadow: "0 2px 16px rgba(60,42,150,0.07)", padding: 23 }}>
          <div style={{ display: "flex", justifyContent: "center", fontWeight: 600, fontSize: "1.10rem", color: "var(--primary,#6C2EBE)", marginBottom: 3 }}>
            {today.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </div>
          <table className="calendar-table" style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {weekdayLabels.map((wd, i) => (
                  <th style={{
                    fontWeight: 500, color: "var(--primary,#6C2EBE)",
                    paddingBottom: 7, fontSize: "0.96rem", background: "none", border: "none"
                  }} key={wd}>{wd}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {
                // chunk gridDays into rows of 7
                Array.from({ length: Math.ceil(gridDays.length / 7) }, (_, w) => (
                  <tr key={w}>
                    {gridDays.slice(w * 7, w * 7 + 7).map((cell, i) => {
                      const txList = txByDate[cell.dateStr] || [];
                      return (
                        <td
                          key={cell.dateStr}
                          className="calendar-cell"
                          style={{
                            padding: "7px 3px 5px 3px",
                            verticalAlign: "top",
                            background: cell.inMonth ? "none" : "var(--secondary,#f4f4f6)",
                            border: "none",
                            borderRadius: cell.inMonth ? (i === 0 || i === 6 ? 7 : 0) : 0,
                            opacity: cell.inMonth ? 1 : 0.5,
                            position: "relative",
                            height: 56
                          }}
                        >
                          <div style={{
                            fontWeight: 500,
                            fontSize: "1.05rem",
                            color: cell.inMonth
                              ? (cell.dateStr === today.toISOString().slice(0, 10)
                                ? "var(--primary,#6C2EBE)" : "var(--text-color)")
                              : "var(--text-secondary)",
                            background: cell.dateStr === today.toISOString().slice(0, 10)
                              ? "rgba(108,46,190,0.09)" : "none",
                            borderRadius: 8,
                            display: "inline-block",
                            padding: cell.dateStr === today.toISOString().slice(0, 10) ? "0 5px" : undefined,
                            minWidth: 22,
                            textAlign: "center",
                          }}>{cell.dateObj.getDate()}</div>
                          {/* Show blocks for tx */}
                          {txList.length > 0 &&
                            <div style={{
                              marginTop: 6,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "2px 2px",
                              justifyContent: "flex-start",
                              minHeight: 18,
                            }}>
                              {txList.slice(0, 7).map((tx, idx) => (
                                <span
                                  key={idx}
                                  className="calendar-block"
                                  title={(tx.type === "income" ? "+ " : "- ") + "$" + Number(tx.amount).toFixed(2) + (tx.type === "expense" ? (" | " + tx.category) : " | Income") + (tx.description ? (" - " + tx.description) : "")}
                                  style={{
                                    display: "inline-block",
                                    width: 13,
                                    height: 13,
                                    borderRadius: 3,
                                    background: tx.type === "income"
                                      ? "var(--income,#22C55E)"
                                      : "var(--expense,#E74C3C)",
                                    marginBottom: 2,
                                  }}
                                />
                              ))}
                              {/* If >7 tx on date, show +N */}
                              {txList.length > 7 && (
                                <span style={{
                                  fontSize: "0.90em",
                                  color: "#888",
                                  marginLeft: 2
                                }}>+{txList.length - 7}</span>
                              )}
                            </div>
                          }
                        </td>
                      )
                    })}
                  </tr>
                ))
              }
            </tbody>
          </table>
          {/* Optional: Legend below table */}
          <div style={{
            marginTop: 18, display: "flex", gap: 17, justifyContent: "center", fontSize: "1em"
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5
            }}>
              <span style={{
                width: 13, height: 13,
                background: "var(--income,#22C55E)", borderRadius: 3, display: "inline-block"
              }} /> Income
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5
            }}>
              <span style={{
                width: 13, height: 13,
                background: "var(--expense,#E74C3C)", borderRadius: 3, display: "inline-block"
              }} /> Expense
            </span>
          </div>
        </div>
        {/* Show empty callout if no transactions at all */}
        {transactions.length === 0 &&
          <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: 33 }}>
            No transactions to show on the calendar yet.
          </div>
        }
      </div>
      {/* Inline calendar styling if not factored yet */}
      <style>
        {`
        .calendar-table {
          user-select: none;
          border-spacing: 0;
        }
        .calendar-cell {
          min-width: 44px;
          max-width: 60px;
          height: 56px;
          position: relative;
        }
        .calendar-block {
          transition: background 0.2s;
        }
        `}
      </style>
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
/**
 * PUBLIC_INTERFACE
 * The SettingsView component displays and allows the user to select a preferred language and currency.
 * It reads and writes preferences from localStorage, ensures persistence, and reflects in the UI.
 */
function SettingsView() {
  // Language and currency options
  const languageOptions = ['English', 'Spanish', 'French', 'German', 'Chinese'];
  const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'CNY'];

  // Keys for localStorage
  const STORAGE_SETTINGS = 'fflow-settings-v1';

  // Controlled form state
  const [language, setLanguage] = React.useState(languageOptions[0]);
  const [currency, setCurrency] = React.useState(currencyOptions[0]);
  const [saved, setSaved] = React.useState(false);

  // On mount, restore saved settings if present
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_SETTINGS);
    if (stored) {
      try {
        const obj = JSON.parse(stored);
        if (obj.language && languageOptions.includes(obj.language)) setLanguage(obj.language);
        if (obj.currency && currencyOptions.includes(obj.currency)) setCurrency(obj.currency);
      } catch {
        // Ignore parse errors - use default
      }
    }
  // eslint-disable-next-line
  }, []);

  // Save handler
  function handleSave(e) {
    e.preventDefault();
    const obj = { language, currency };
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(obj));
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <section className="placeholder-view">
      <h1>Settings</h1>
      <div className="container" style={{maxWidth: 410}}>
        <form onSubmit={handleSave} aria-label="Preferences">
          <div style={{marginBottom: 23}}>
            <label style={{ fontWeight: 500, display: 'block', marginBottom: 5 }}>
              Language
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', marginTop: 7 }}
                aria-label="Language Selector"
              >
                {languageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
          </div>
          <div style={{marginBottom: 27}}>
            <label style={{ fontWeight: 500, display: 'block', marginBottom: 5 }}>
              Currency
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', marginTop: 7 }}
                aria-label="Currency Selector"
              >
                {currencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
          </div>
          <button type="submit" className="btn btn-large" style={{width: 160}}>Save Preferences</button>
          {saved && <span style={{color: 'var(--income,#22C55E)', marginLeft: 14, fontWeight: 500}}>Saved!</span>}
        </form>

        <div style={{ marginTop: 34, padding: '17px 16px', background: 'var(--secondary,#f8f8fa)', borderRadius: 10 }}>
          <h3 style={{margin: '0 0 10px 0', fontSize: '1.09em', color: 'var(--primary,#6C2EBE)'}}>Current Preferences</h3>
          <p style={{margin: 0}}><strong>Language:</strong> <span data-testid="current-language">{language}</span></p>
          <p style={{margin: 0}}><strong>Currency:</strong> <span data-testid="current-currency">{currency}</span></p>
        </div>
      </div>
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