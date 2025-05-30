import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import ThemeProvider from './components/ThemeProvider';
import Sidebar from './components/Sidebar';
import OnboardingModal from './components/OnboardingModal';
import Dashboard from './components/Dashboard';
import ToastNotification from './components/ToastNotification';
import PreferencesProvider, { usePreferences } from './components/PreferencesProvider';

// Placeholder views
import TransactionList from './components/transactions/TransactionList';
import FilterBar from './components/transactions/FilterBar';

const STORAGE_TRANSACTIONS = 'fflow-transactions-v1';

/* Removed duplicate: import { usePreferences } from './components/PreferencesProvider'; */

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
  const { currency, currencySymbol } = usePreferences() || { currency: 'USD', currencySymbol: '$' };

  return (
    <section className="placeholder-view">
      <h1>Expenses</h1>
      <div className="container">
        <FilterBar filters={filters} setFilters={setFilters} categories={categories} />
        <TransactionList
          transactions={filtered}
          onEdit={() => {}}
          onDelete={() => {}}
          emptyMsg={`No expenses found.`}
          currencySymbol={currencySymbol}
        />
        {filtered.length === 0 &&
          <p style={{color: "var(--text-secondary)"}}>
            No expenses for current filters.
          </p>
        }
        {/* Currency displayed under list summary */}
        <p style={{ color: "var(--text-secondary)", marginTop: 15, fontSize: "1.05em" }}>
          Amounts shown in <span style={{fontWeight:600}}>{currencySymbol}</span>
        </p>
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
function CalendarView() {
  const [transactions] = React.useState(
    () => JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS)) || []
  );

  const today = new Date();
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);

  function getMonthGrid(year, month) {
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const firstDayIdx = firstOfMonth.getDay();
    const daysInMonth = lastOfMonth.getDate();

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthDays = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

    let days = [];
    for (let i = 0; i < firstDayIdx; i++) {
      const d = prevMonthDays - (firstDayIdx - i - 1);
      let dateObj = new Date(prevMonthYear, prevMonth, d);
      days.push({
        dateObj,
        inMonth: false,
        dateStr: dateObj.toISOString().slice(0, 10),
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      let dateObj = new Date(year, month, d);
      days.push({
        dateObj,
        inMonth: true,
        dateStr: dateObj.toISOString().slice(0, 10),
      });
    }
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

  const gridDays = React.useMemo(
    () => getMonthGrid(currentMonthDate.getFullYear(), currentMonthDate.getMonth()),
    [currentMonthDate]
  );

  const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

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
        {transactions.length === 0 &&
          <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: 33 }}>
            No transactions to show on the calendar yet.
          </div>
        }
      </div>
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

const PROFILE_STORAGE_KEY = 'fflow-profile-v1';

/*
  PUBLIC_INTERFACE
  Refactored ProfileView to display user info in a non-editable mode by default.
  'Edit' button enables editing, and after saving, reverts to display-only mode.
*/
function ProfileView() {
  // State for profile fields and edit mode
  const [profile, setProfile] = React.useState({ name: '', email: '', currency: '', language: '' });
  // By default, show non-edit (display) mode after mount or after a Save,
  // except for first-time setup (no name), in which case force edit.
  const [editMode, setEditMode] = React.useState(false);
  const [error, setError] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  // Options for data entry (should match what's in Settings for consistency)
  const languageOptions = ['English', 'Spanish', 'French', 'German', 'Chinese'];
  const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'CNY'];

  // Load profile from localStorage on mount
  React.useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      try {
        const obj = JSON.parse(savedProfile);
        setProfile({
          name: obj.name || "",
          email: obj.email || "",
          currency: obj.currency || "",
          language: obj.language || ""
        });
      } catch {
        // On error, fallback to blank
        setProfile({ name: '', email: '', currency: '', language: '' });
      }
    }
  }, []);

  // PUBLIC_INTERFACE
  function handleChange(e) {
    const { name, value } = e.target;
    setProfile(p => ({ ...p, [name]: value }));
  }

  // PUBLIC_INTERFACE
  function handleSave(e) {
    e.preventDefault && e.preventDefault();
    if (!profile.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (profile.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) {
      setError("Invalid email address.");
      return;
    }
    setError('');
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  }

  // PUBLIC_INTERFACE
  function handleEdit() {
    setEditMode(true);
  }

  // PUBLIC_INTERFACE
  function handleCancel() {
    setEditMode(false);
    // Reload from localStorage to revert any unsaved changes
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      try {
        const obj = JSON.parse(savedProfile);
        setProfile({
          name: obj.name || "",
          email: obj.email || "",
          currency: obj.currency || "",
          language: obj.language || ""
        });
      } catch {}
    }
    setError('');
  }

  // Only allow edit mode if user clicked Edit, or if they do not have a name yet (first-time)
  React.useEffect(() => {
    // If no profile data (first time), force edit mode for initial setup
    if (!profile.name) setEditMode(true);
    else setEditMode(false); // When profile data loaded and has name, default to display mode
    // eslint-disable-next-line
  }, []);

  // UI: Display (non-edit) mode
  function renderProfileCard() {
    return (
      <div className="container" style={{ maxWidth: 420 }}>
        <div
          style={{
            background: "var(--surface,#fff)",
            borderRadius: 13,
            boxShadow: "0 2px 16px rgba(60,42,150,0.07)",
            padding: 28,
            marginTop: 25,
            marginBottom: 25
          }}
          tabIndex={0}
          aria-label="Profile"
        >
          <h2 style={{margin: "0 0 13px 0", fontSize: "1.21em", color: "var(--primary,#6C2EBE)", fontWeight: 600}}>
            Profile
          </h2>
          <p style={{margin: "7px 0 0", fontSize: "1.05em", color: "var(--text-secondary)"}}>
            <strong>Name:</strong> {profile.name}
          </p>
          {profile.email && <p style={{margin: "7px 0 0"}}><strong>Email:</strong> {profile.email}</p>}
          {profile.currency && <p style={{margin: "7px 0 0"}}><strong>Currency:</strong> {profile.currency}</p>}
          {profile.language && <p style={{margin: "7px 0 0"}}><strong>Language:</strong> {profile.language}</p>}
          <button
            type="button"
            className="btn btn-large"
            style={{marginTop: 19}}
            onClick={handleEdit}
            aria-label="Edit Profile"
          >
            Edit
          </button>
          {saved && (
            <span style={{color:'var(--income,#22C55E)',marginLeft:18,fontWeight:500}}>
              Saved!
            </span>
          )}
        </div>
      </div>
    );
  }

  // UI: Edit mode
  function renderProfileEditForm() {
    return (
      <div className="container" style={{ maxWidth: 420 }}>
        <form
          onSubmit={handleSave}
          style={{
            background: "var(--surface,#fff)",
            borderRadius: 13,
            boxShadow: "0 2px 16px rgba(60,42,150,0.07)",
            padding: 28,
            marginTop: 25,
            marginBottom: 25
          }}
          aria-label="Profile Edit"
        >
          <h2 style={{
            margin: "0 0 13px 0",
            fontSize: "1.21em",
            color: "var(--primary,#6C2EBE)",
            fontWeight: 600
          }}>
            {profile.name ? "Edit Profile" : "Set Up Your Profile"}
          </h2>
          <div style={{ marginBottom: 17 }}>
            <label style={{ fontWeight: 500, display: "block", marginBottom: 7 }}>
              Name<span style={{ color: "#E74C3C" }}>*</span>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
                style={{ width: "100%", padding: "9px 10px", marginTop: 5 }}
                autoFocus
                aria-required="true"
                aria-label="Name"
              />
            </label>
          </div>
          <div style={{ marginBottom: 17 }}>
            <label style={{ fontWeight: 500, display: "block", marginBottom: 7 }}>
              Email (optional)
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="Enter your email"
                style={{ width: "100%", padding: "9px 10px", marginTop: 5 }}
                aria-label="Email address"
              />
            </label>
          </div>
          <div style={{ marginBottom: 17 }}>
            <label style={{ fontWeight: 500, display: "block", marginBottom: 7 }}>
              Preferred Language (optional)
              <select
                name="language"
                value={profile.language}
                onChange={handleChange}
                style={{ width: "100%", padding: "9px 10px", marginTop: 5 }}
                aria-label="Language"
              >
                <option value="">Select Language</option>
                {languageOptions.map(opt => (
                  <option value={opt} key={opt}>{opt}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ marginBottom: 19 }}>
            <label style={{ fontWeight: 500, display: "block", marginBottom: 7 }}>
              Preferred Currency (optional)
              <select
                name="currency"
                value={profile.currency}
                onChange={handleChange}
                style={{ width: "100%", padding: "9px 10px", marginTop: 5 }}
                aria-label="Currency"
              >
                <option value="">Select Currency</option>
                {currencyOptions.map(opt => (
                  <option value={opt} key={opt}>{opt}</option>
                ))}
              </select>
            </label>
          </div>
          {error && <div style={{ color: "var(--expense,#E74C3C)", marginBottom: 10 }}>{error}</div>}
          <div style={{display:"flex", gap: 13}}>
            <button type="submit" className="btn btn-large" style={{ minWidth: 120 }}>
              Save
            </button>
            {profile.name && (
              <button
                type="button"
                className="btn btn-cancel"
                style={{ minWidth: 100 }}
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </div>
          <div style={{marginTop: 17, color:'var(--text-secondary)', fontSize: "0.99em"}}>
            {profile.name
              ? "Update your profile information anytime. Your profile is stored securely in your browser only."
              : "Enter your name to complete setup. You can add email, language, and currency preferences for a personalized experience (all optional)."}
          </div>
        </form>
      </div>
    );
  }

  // Render: display mode unless in edit mode
  // Only allow edit if clicked, or during initial setup (no name)!
  return (
    <section className="placeholder-view">
      <h1>Profile</h1>
      {editMode ? renderProfileEditForm() : renderProfileCard()}
    </section>
  );
}

/* Duplicate import removed */

// PUBLIC_INTERFACE
function SettingsView() {
  const {
    language,
    currency,
    setLanguage,
    setCurrency,
    languageOptions,
    currencyOptions,
  } = usePreferences();

  const [saved, setSaved] = React.useState(false);

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    // localStorage is updated in PreferencesProvider; don't handle here
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
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 650
  );
  useEffect(() => {
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

  // Wrap all in PreferencesProvider to propagate currency/lang preference updates
  return (
    <PreferencesProvider>
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
    </PreferencesProvider>
  );
}

export default App;
