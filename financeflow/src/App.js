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

function ExpensesView() {
  const [transactions, setTransactions] = React.useState(() => {
    return JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS)) || [];
  });
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
        <p style={{ color: "var(--text-secondary)", marginTop: 15, fontSize: "1.05em" }}>
          Amounts shown in <span style={{fontWeight:600}}>{currencySymbol}</span>
        </p>
      </div>
    </section>
  );
}

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
  ProfileView:
  - Removes language preference.
  - Adds a validated (format-checked) mobile number field.
  - Profile information is always displayed in non-edit mode by default
    (including after saving, refresh, or navigation).
  - Edit mode is only entered if (a) the user clicks 'Edit', or (b) for first-time setup (no name present).
*/
function ProfileView() {
  // Profile state and edit mode.
  const [profile, setProfile] = React.useState({ name: '', email: '', mobile: '', currency: '' });
  // editMode is true ONLY if: (a) first-time setup (no name) (b) user clicks edit.
  const [editMode, setEditMode] = React.useState(false);
  const [error, setError] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'CNY'];

  // Remember if we already saw an initial profile (for first run flow).
  const isFirstRender = React.useRef(true);

  // -- Initialization: load profile (and decide on edit/display mode)
  React.useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      try {
        const obj = JSON.parse(savedProfile);
        setProfile({
          name: obj.name || "",
          email: obj.email || "",
          mobile: obj.mobile || "",
          currency: obj.currency || ""
        });
        // No language field, remove any previous language reference.
      } catch {
        setProfile({ name: '', email: '', mobile: '', currency: '' });
      }
    }
    // After (re)load, only switch to edit mode if name is missing (first-time), else always non-edit
    isFirstRender.current = false;
  }, []);

  // When profile changes (after mount), enforce display mode unless new profile is missing name
  React.useEffect(() => {
    // If first mount and profile has no name, go to edit mode (forced for first setup)
    if (isFirstRender.current) return; // skip during profile fetch
    if (!profile.name) setEditMode(true);
    else setEditMode(false);
  }, [profile.name]); // react to name changes only

  // Handler: field change
  // PUBLIC_INTERFACE
  function handleChange(e) {
    const { name, value } = e.target;
    setProfile(p => ({ ...p, [name]: value }));
  }

  // Handler: Save (with validation, including mobile)
  // PUBLIC_INTERFACE
  function handleSave(e) {
    e.preventDefault && e.preventDefault();
    if (!profile.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      setError("Invalid email address.");
      return;
    }
    if (profile.mobile && !/^(\\+?\\d[\\d\\-\\s()]{5,17})$/.test(profile.mobile.trim())) {
      setError("Enter a valid mobile number. It should be at least 6 digits and can include +, -, spaces or parentheses.");
      return;
    }
    setError('');
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1300);
  }

  // Handler: Enter edit mode manually
  // PUBLIC_INTERFACE
  function handleEdit() {
    setEditMode(true);
  }

  // Handler: Cancel edits, revert to last-saved profile, always stays non-edit after cancel
  // PUBLIC_INTERFACE
  function handleCancel() {
    setEditMode(false);
    // Reload from localStorage to revert any unsaved edits
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      try {
        const obj = JSON.parse(savedProfile);
        setProfile({
          name: obj.name || "",
          email: obj.email || "",
          mobile: obj.mobile || "",
          currency: obj.currency || ""
        });
      } catch {}
    }
    setError('');
  }

  // Display (non-edit) mode
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
          {profile.mobile && <p style={{margin: "7px 0 0"}}><strong>Mobile:</strong> {profile.mobile}</p>}
          {profile.currency && <p style={{margin: "7px 0 0"}}><strong>Currency:</strong> {profile.currency}</p>}
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

  // Edit mode
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
              Mobile (optional)
              <input
                type="text"
                name="mobile"
                value={profile.mobile}
                onChange={handleChange}
                placeholder="Enter your mobile number"
                style={{ width: "100%", padding: "9px 10px", marginTop: 5 }}
                aria-label="Mobile number"
                pattern="(\\+?\\d[\\d\\-\\s()]{5,17})"
                maxLength={18}
              />
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
              : "Enter your name to complete setup. You can add email, mobile, and currency preferences for a personalized experience (all optional)."}
          </div>
        </form>
      </div>
    );
  }

  return (
    <section className="placeholder-view">
      <h1>Profile</h1>
      {editMode ? renderProfileEditForm() : renderProfileCard()}
    </section>
  );
}

function SettingsView() {
  // Remove language selector; only keep and move Currency selector to top
  const {
    currency,
    setCurrency,
    currencyOptions,
  } = usePreferences();

  // For toggles/persistent settings, use local state and localStorage.
  // Notifications and sync are just toggles for demo. Data reset is an action.
  const STORAGE_SETTINGS = 'fflow-settings-tab-v1';

  // Load toggles from localStorage, default to on
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(() => {
    try {
      const val = JSON.parse(localStorage.getItem(STORAGE_SETTINGS));
      // Accept robust interpretation, in case settings object is malformed
      if (val && typeof val.notificationsEnabled === "boolean") return val.notificationsEnabled;
      return true;
    } catch {
      return true;
    }
  });
  const [syncEnabled, setSyncEnabled] = React.useState(() => {
    try {
      const val = JSON.parse(localStorage.getItem(STORAGE_SETTINGS));
      return !!val?.syncEnabled;
    } catch {
      return false;
    }
  });
  const [saved, setSaved] = React.useState(false);
  const [resetConfirm, setResetConfirm] = React.useState(false);
  const [resetDone, setResetDone] = React.useState(false);

  // Persist toggles when changed
  React.useEffect(() => {
    // PATCH: Never clear unrelated keys, only save settings here
    const prev = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_SETTINGS)) || {}; } catch { return {}; } })();
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify({
      ...prev,
      notificationsEnabled,
      syncEnabled,
    }));
  }, [notificationsEnabled, syncEnabled]);

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    // Currency goes through PreferencesProvider; toggles update localStorage here
  }

  function handleDataReset() {
    // Only clear all data if the user confirms reset - this is the single place we clear dashboard keys.
    localStorage.removeItem('fflow-profile-v1');
    localStorage.removeItem('fflow-transactions-v1');
    localStorage.removeItem('fflow-savings-goal-v1');
    localStorage.removeItem('fflow-settings-v1');
    localStorage.removeItem(STORAGE_SETTINGS);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 1700);
    // Optionally reload to force app to re-initialize
    window.location.reload();
  }

  return (
    <section className="placeholder-view">
      <div style={{display: 'flex', alignItems: 'center', gap: 11, marginBottom: 8}}>
        {/* Minimalistic modern SVG gear icon, matching Sidebar visual style */}
        <svg
          width="29"
          height="29"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--primary,#6C2EBE)"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ verticalAlign: "middle" }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3.5" />
          <path d="M19.4 15a2 2 0 0 0 .4 2.1l.02.02a1 1 0 0 1-1.41 1.41l-.02-.02a2 2 0 0 0-2.1-.41c-.6.29-1.25.47-1.88.52-.13.01-.27.01-.41.01-.14 0-.28 0-.41-.01a7.2 7.2 0 0 1-1.88-.52 2 2 0 0 0-2.1.41l-.02.02a1 1 0 0 1-1.41-1.41l.02-.02a2 2 0 0 0 .41-2.1c-.29-.6-.47-1.25-.52-1.88a2.3 2.3 0 0 1-.01-.41c0-.14 0-.28.01-.41.05-.63.23-1.28.52-1.88a2 2 0 0 0-.41-2.1l-.02-.02A1 1 0 0 1 6.03 5.45l.02.02a2 2 0 0 0 2.1.41c.6-.29 1.25-.47 1.88-.52.13-.01.27-.01.41-.01.14 0 .28 0 .41.01.63.05 1.28.23 1.88.52a2 2 0 0 0 2.1-.41l.02-.02a1 1 0 1 1 1.41 1.41l-.02.02a2 2 0 0 0-.41 2.1c.29.6.47 1.25.52 1.88.01.13.01.27.01.41 0 .14 0 .28-.01.41-.05.63-.23 1.28-.52 1.88z" />
        </svg>
        <h1 style={{margin: 0, fontSize: '1.34em', color: "var(--primary,#6C2EBE)", letterSpacing: 0.1}}>Settings</h1>
      </div>
      <div className="container" style={{maxWidth: 410}}>
        {/* Form with currency selector at top, then toggles */}
        <form onSubmit={handleSave} aria-label="Preferences">
          <div style={{marginBottom: 20}}>
            <label style={{ fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Preferred Currency
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
          <div style={{marginBottom: 18}}>
            <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 9 }}>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={e => setNotificationsEnabled(e.target.checked)}
                style={{width: 18, height: 18}}
                aria-checked={notificationsEnabled}
              />
              Enable Notifications
            </label>
            <div style={{color: 'var(--text-secondary,#8A889A)', fontSize: "0.98em", marginLeft: 2}}>
              Receive in-app milestone notifications (savings goal, etc).
            </div>
          </div>
          <div style={{marginBottom: 18}}>
            <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 9 }}>
              <input
                type="checkbox"
                checked={syncEnabled}
                onChange={e => setSyncEnabled(e.target.checked)}
                style={{width: 18, height: 18}}
                aria-checked={syncEnabled}
              />
              Enable Data Sync
            </label>
            <div style={{color: 'var(--text-secondary,#8A889A)', fontSize: "0.98em", marginLeft: 2}}>
              (Demo only) Sync data to cloud when connected (requires upgrade).
            </div>
          </div>
          <button type="submit" className="btn btn-large" style={{width: 160, marginTop: 8}}>Save Preferences</button>
          {saved && <span style={{color: 'var(--income,#22C55E)', marginLeft: 14, fontWeight: 500}}>Saved!</span>}
        </form>
        <div style={{marginTop: 32, padding: '13px 13px 13px 17px', background: 'var(--surface,#fff)', borderRadius: 10, boxShadow: "0 2px 11px rgba(60,42,150,0.06)"}}>
          <h3 style={{margin: '0 0 8px 0', fontSize: '1.10em', color: 'var(--primary,#6C2EBE)'}}>Danger Zone</h3>
          <button
            onClick={() => setResetConfirm(v => !v)}
            className="btn btn-cancel"
            style={{marginTop: 0}}
            aria-label="Clear & Reset Data"
          >Reset All Data</button>
          {resetConfirm && !resetDone && (
            <div style={{marginTop: 8, color: 'var(--expense,#E74C3C)', fontWeight: 500, fontSize: "1.05em"}}>
              This removes <b>all</b> data (profile, transactions, goals, preferences). Are you sure?
              <button
                className="btn btn-large"
                style={{marginLeft: 13, background:'#E74C3C', color:'#fff'}}
                onClick={handleDataReset}
              >Confirm Reset</button>
              <button
                className="btn"
                style={{marginLeft: 8}}
                onClick={() => setResetConfirm(false)}
              >Cancel</button>
            </div>
          )}
          {resetDone && (
            <div style={{marginTop: 8, color: 'var(--income,#22C55E)', fontWeight: 500}}>
              All data has been cleared! Reloading...
            </div>
          )}
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

  // Notification preference: get from PreferencesProvider context
  const {
    notificationsEnabled = true,
  } = usePreferences?.() || {};

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

  // Toast utility for child components, honors notificationsEnabled
  const notify = useCallback(
    (message, type = 'success') => {
      if (notificationsEnabled) {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
      }
    },
    [notificationsEnabled]
  );

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
