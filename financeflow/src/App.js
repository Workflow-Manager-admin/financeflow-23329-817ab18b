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
import BudgetPlanner from './components/BudgetPlanner';
import TransactionFormModal from './components/transactions/TransactionFormModal'; // Import modal
import PieChart from './components/visuals/PieChart';
import './components/BudgetPlanner.css';
// Modern Expenses tab redesign style
import './components/expenses/ExpensesModern.css';
// Import SavingsGoalModal
import SavingsGoalModal from './components/savings/SavingsGoalModal';

const STORAGE_TRANSACTIONS = 'fflow-transactions-v1';
const PROFILE_STORAGE_KEY = 'fflow-profile-v1';

function ExpensesView({
  allTransactions,
  setTransactions,
  onEditTransaction,
  showToast,
}) {
  // Only consider expense type transactions
  const expenseTx = React.useMemo(
    () =>
      allTransactions
        .filter((t) => t.type === "expense")
        .map((tx) =>
          tx.category === "Salary" ? { ...tx, category: "Rent/House" } : tx
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allTransactions]
  );
  const [filters, setFilters] = React.useState({ category: "All", from: "", to: "" });
  // Compute categories for filtering
  const categories = React.useMemo(() => {
    const set = new Set(expenseTx.map(t => t.category === "Salary" ? "Rent/House" : t.category));
    return ["All", ...Array.from(set).filter(Boolean)];
  }, [expenseTx]);
  function applyFilters(data, filtersArg) {
    const { category = "All", from = "", to = "" } = filtersArg || {};
    let arr = data;
    if (category && category !== "All") {
      arr = arr.filter((t) => t.category === category);
    }
    if (from) arr = arr.filter((t) => t.date >= from);
    if (to) arr = arr.filter((t) => t.date <= to);
    return arr;
  }
  const filtered = React.useMemo(() => applyFilters(expenseTx, filters), [expenseTx, filters]);
  const { currencySymbol } = usePreferences(); // always live

  // Modern, visually appealing layout for Expenses tab
  return (
    <section className="expenses-section-modern">
      <div className="expenses-card-modern">
        <div className="expenses-header-row-modern">
          <h1 className="expenses-title-modern">Expenses</h1>
          {/* "+" Add button removed as per design requirements */}
        </div>
        {/* Expenses by category ring chart (PieChart) removed as per design requirements */}
        <div className="expenses-filters-bar modern">
          <FilterBar filters={filters} setFilters={setFilters} categories={categories} />
        </div>
        <div className="expenses-list-panel-modern">
          <TransactionList
            transactions={filtered}
            onEdit={onEditTransaction}
            onDelete={
              (tx) => {
                if (window.confirm("Delete this transaction?")) {
                  setTransactions(prev => prev.filter(t => t.id !== tx.id));
                  showToast && showToast("Transaction deleted!", "success");
                }
              }
            }
            emptyMsg="No expenses found."
            modernExpenses
          />
          {filtered.length === 0 && (
            <p className="no-expenses-msg">No expenses for current filters.</p>
          )}
        </div>
        <p className="expenses-amount-caption">
          Amounts shown in&nbsp;
          <span className="currency-inline">{currencySymbol}</span>
        </p>
      </div>
    </section>
  );
}

function CalendarView({ transactions: propTransactions }) {
  // State for visible month/year navigation
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = React.useState(today.getMonth());
  const [visibleYear, setVisibleYear] = React.useState(today.getFullYear());

  // Transactions come either as prop or from localStorage for resilience
  const transactions = React.useMemo(
    () =>
      propTransactions ??
      JSON.parse(localStorage.getItem("fflow-transactions-v1")) ??
      [],
    [propTransactions]
  );

  // Month navigation
  function goToPrevMonth() {
    setVisibleMonth((prev) => {
      if (prev === 0) {
        setVisibleYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }
  function goToNextMonth() {
    setVisibleMonth((prev) => {
      if (prev === 11) {
        setVisibleYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }
  function handleYearChange(e) {
    setVisibleYear(Number(e.target.value));
  }
  function handleMonthChange(e) {
    setVisibleMonth(Number(e.target.value));
  }

  // Years available in dropdown (limit for UI)
  const yearsAvailable = React.useMemo(() => {
    // Find min/max year in data for better UX
    let years = [today.getFullYear()];
    if (transactions && transactions.length > 0) {
      const txYears = transactions.map((t) =>
        t.date ? new Date(t.date).getFullYear() : today.getFullYear()
      );
      const minY = Math.min(...txYears, today.getFullYear() - 2);
      const maxY = Math.max(...txYears, today.getFullYear() + 1);
      years = [];
      for (let y = minY - 1; y <= maxY + 1; y++) years.push(y);
    }
    return years;
  }, [transactions, today]);

  function getMonthGrid(year, month) {
    // Fix date off-by-one bug: always use local-time dates (no UTC).
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
        dateStr: formatDateLocalYMD(dateObj),
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      let dateObj = new Date(year, month, d);
      days.push({
        dateObj,
        inMonth: true,
        dateStr: formatDateLocalYMD(dateObj),
      });
    }
    let totalCells = days.length;
    let trailing = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
      let dateObj = new Date(year, month + 1, i);
      days.push({
        dateObj,
        inMonth: false,
        dateStr: formatDateLocalYMD(dateObj),
      });
    }
    return days;
  }

  // Utility for bug-free local YMD formatting
  function formatDateLocalYMD(dateObj) {
    // Returns date as 'YYYY-MM-DD' in local time, not UTC
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
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
    () => getMonthGrid(visibleYear, visibleMonth),
    [visibleYear, visibleMonth]
  );

  const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  // Track today as YMD for coloring
  const todayYMD = formatDateLocalYMD(today);

  return (
    <section className="placeholder-view calendar-view">
      <div className="container" style={{ maxWidth: 480 }}>
        <div style={{ padding: "34px 17px 0 17px", display: "flex", alignItems: "flex-end", gap: 0 }}>
          <h1 style={{
            margin: 0,
            fontSize: "2rem",
            color: "var(--primary)",
            fontWeight: 700,
            letterSpacing: "0.01em",
            textAlign: "left",
            flex: "1 1 auto"
          }}>Transaction Calendar</h1>
        </div>
        <div style={{ maxWidth: 430, margin: "0 auto", background: "var(--surface)", borderRadius: 13, boxShadow: "0 2px 16px rgba(60,42,150,0.07)", padding: 23 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 600, fontSize: "1.10rem", color: "var(--primary)", marginBottom: 8, gap: 16
          }}>
            {/* Prev month */}
            <button
              aria-label="Previous Month"
              className="btn btn-calendar-nav"
              style={{
                borderRadius: "50%",
                width: 33,
                height: 33,
                border: "none",
                background: "transparent",
                cursor: "pointer"
              }}
              onClick={goToPrevMonth}
              tabIndex={0}
            >
              {"‹"}
            </button>
            {/* Month dropdown */}
            <select
              value={visibleMonth}
              onChange={handleMonthChange}
              style={{
                fontSize: "1em",
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid var(--border-color)",
                background: "var(--background)",
                fontWeight: 600,
                minWidth: 96,
                color: "var(--primary)"
              }}
              aria-label="Month"
            >
              {monthNames.map((name, idx) => (
                <option value={idx} key={idx}>{name}</option>
              ))}
            </select>
            {/* Year dropdown */}
            <select
              value={visibleYear}
              onChange={handleYearChange}
              style={{
                fontSize: "1em",
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid var(--border-color)",
                background: "var(--background)",
                fontWeight: 600,
                minWidth: 75,
                color: "var(--primary)"
              }}
              aria-label="Year"
            >
              {yearsAvailable.map(y => (
                <option value={y} key={y}>{y}</option>
              ))}
            </select>
            {/* Next month */}
            <button
              aria-label="Next Month"
              className="btn btn-calendar-nav"
              style={{
                borderRadius: "50%",
                width: 33,
                height: 33,
                border: "none",
                background: "transparent",
                cursor: "pointer"
              }}
              onClick={goToNextMonth}
              tabIndex={0}
            >
              {"›"}
            </button>
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
                      // Mark cell as today visually
                      const isToday = cell.dateStr === todayYMD;
                      return (
                        <td
                          key={cell.dateStr}
                          className="calendar-cell"
                          style={{
                            padding: "7px 3px 5px 3px",
                            verticalAlign: "top",
                            background: cell.inMonth ? "none" : "var(--secondary)",
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
                              ? (isToday
                                ? "var(--primary)" : "var(--text-color)")
                              : "var(--text-secondary)",
                            background: isToday
                              ? "rgba(108,46,190,0.09)" : "none",
                            borderRadius: 8,
                            display: "inline-block",
                            padding: isToday ? "0 5px" : undefined,
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
                                  title={
                                    (tx.type === "income" ? "+ " : "- ") +
                                    "$" + Number(tx.amount).toFixed(2) +
                                    (tx.type === "expense" ? (" | " + tx.category) : " | Income") +
                                    (tx.description ? (" - " + tx.description) : "")
                                  }
                                  style={{
                                    display: "inline-block",
                                    width: 13,
                                    height: 13,
                                    borderRadius: 3,
                                    background: tx.type === "income"
                                      ? "var(--income)"
                                      : "var(--expense)",
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
                background: "var(--income)", borderRadius: 3, display: "inline-block"
              }} /> Income
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5
            }}>
              <span style={{
                width: 13, height: 13,
                background: "var(--expense)", borderRadius: 3, display: "inline-block"
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
        .btn-calendar-nav:active,
        .btn-calendar-nav:focus {
          background: rgba(108,46,190,0.07);
        }
        `}
      </style>
    </section>
  );
}

// PUBLIC_INTERFACE
function ProfileView() {
  const [profile, setProfile] = React.useState({ name: '', email: '', mobile: '', countryCode: "+1", currency: '' });
  const [editMode, setEditMode] = React.useState(false);
  const [error, setError] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  const COUNTRY_OPTIONS = [
    { code: "+1", flag: "🇺🇸", label: "USA" },
    { code: "+91", flag: "🇮🇳", label: "India" },
    { code: "+44", flag: "🇬🇧", label: "UK" },
    { code: "+61", flag: "🇦🇺", label: "Australia" },
    { code: "+81", flag: "🇯🇵", label: "Japan" },
    { code: "+86", flag: "🇨🇳", label: "China" },
    { code: "+49", flag: "🇩🇪", label: "Germany" },
    { code: "+33", flag: "🇫🇷", label: "France" },
    { code: "+971", flag: "🇦🇪", label: "UAE" },
    { code: "+234", flag: "🇳🇬", label: "Nigeria" },
    { code: "+7", flag: "🇷🇺", label: "Russia" },
  ];
  const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'CNY'];

  const isFirstRender = React.useRef(true);

  // Access context currency setter for instant sync
  const { setCurrency } = usePreferences() || {};

  // Initialize: load profile
  React.useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      try {
        const obj = JSON.parse(savedProfile);
        setProfile({
          name: obj.name || "",
          email: obj.email || "",
          mobile: obj.mobile || "",
          countryCode: obj.countryCode || "+1",
          currency: obj.currency || "",
        });
      } catch {
        setProfile({ name: '', email: '', mobile: '', countryCode: "+1", currency: '' });
      }
    }
    isFirstRender.current = false;
  }, []);

  // Enforce edit mode for true first-time users
  React.useEffect(() => {
    if (isFirstRender.current) return;
    if (!profile.name) {
      setEditMode(true);
    }
    // else do not auto-switch to edit mode
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'mobile') {
      setProfile(p => ({ ...p, mobile: value.replace(/[^0-9]/g, '').slice(0, 10) }));
    } else {
      setProfile(p => ({ ...p, [name]: value }));
    }
  }

  function handleCountryCodeChange(newVal) {
    setProfile(p => ({ ...p, countryCode: newVal }));
  }

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
    if (profile.mobile || profile.countryCode) {
      if (!profile.mobile || !/^[0-9]{10}$/.test(profile.mobile.trim())) {
        setError("Mobile number must be exactly 10 digits.");
        return;
      }
      if (!profile.countryCode || profile.countryCode === "") {
        setError("Please select your country code.");
        return;
      }
    }
    setError('');
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        ...profile,
        mobile: profile.mobile,
        countryCode: profile.countryCode || "+1"
      })
    );
    // Update global context for currency
    if (profile.currency && typeof setCurrency === "function") {
      setCurrency(profile.currency);
    }
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1300);
  }

  function handleEdit() {
    setEditMode(true);
  }

  function handleCancel() {
    setEditMode(false);
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      try {
        const obj = JSON.parse(savedProfile);
        setProfile({
          name: obj.name || "",
          email: obj.email || "",
          mobile: obj.mobile || "",
          countryCode: obj.countryCode || "+1",
          currency: obj.currency || ""
        });
      } catch { }
    }
    setError('');
  }

  function renderProfileCard() {
    return (
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
        <h2 style={{ margin: "0 0 13px 0", fontSize: "1.21em", color: "var(--primary,#6C2EBE)", fontWeight: 600 }}>
          Profile
        </h2>
        <p style={{ margin: "7px 0 0", fontSize: "1.05em", color: "var(--text-secondary)" }}>
          <strong>Name:</strong> {profile.name}
        </p>
        {profile.email && <p style={{ margin: "7px 0 0" }}><strong>Email:</strong> {profile.email}</p>}
        {profile.mobile && <p style={{ margin: "7px 0 0" }}>
          <strong>Mobile:</strong>{" "}
          <span>
            {(profile.countryCode || "+1") + " " + profile.mobile}
          </span>
        </p>}
        {profile.currency && <p style={{ margin: "7px 0 0" }}><strong>Currency:</strong> {profile.currency}</p>}
        <button
          type="button"
          className="btn btn-large"
          style={{ marginTop: 19 }}
          onClick={handleEdit}
          aria-label="Edit Profile"
        >
          Edit
        </button>
        {saved && (
          <span style={{ color: 'var(--income,#22C55E)', marginLeft: 18, fontWeight: 500 }}>
            Saved!
          </span>
        )}
      </div>
    );
  }

  function renderProfileEditForm() {
    return (
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
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 5 }}>
              <select
                value={profile.countryCode || "+1"}
                onChange={e => handleCountryCodeChange(e.target.value)}
                aria-label="Country code"
                style={{
                  fontWeight: 500,
                  padding: "7px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--secondary, #ececec)",
                  fontSize: "1em",
                  background: "var(--secondary, #F5F6FA)",
                  minWidth: 70,
                }}
                required={!!profile.mobile}
              >
                {COUNTRY_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>
                    {opt.flag} {opt.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="mobile"
                value={profile.mobile}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile"
                style={{ flex: 1, padding: "9px 10px" }}
                aria-label="Mobile number"
                maxLength={10}
                pattern="[0-9]{10}"
                inputMode="numeric"
                autoComplete="tel"
              />
            </div>
            <div style={{ fontSize: "0.9em", color: "var(--text-secondary)", marginTop: 2 }}>
              <span>
                Must be 10 digits (numbers only). Choose your country code. Mobile number is optional, but if entered, both fields are required and validated.
              </span>
            </div>
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
        <div style={{ display: "flex", gap: 13 }}>
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
        <div style={{ marginTop: 17, color: 'var(--text-secondary)', fontSize: "0.99em" }}>
          {profile.name
            ? "Update your profile information anytime. Your profile is stored securely in your browser only."
            : "Enter your name to complete setup. Email, mobile, and preferred currency are optional. If you add a mobile, you must enter a valid country code and a 10-digit number."}
        </div>
      </form>
    );
  }

  return (
    <section className="placeholder-view">
      <div
        className="container"
        style={{
          maxWidth: 420,
          background: "var(--surface,#fff)",
          borderRadius: 13,
          boxShadow: "0 2px 16px rgba(60,42,150,0.07)",
          marginTop: 26,
          marginBottom: 0,
          padding: "0 0 32px 0"
        }}
      >
        {/* ORIGINAL Profile heading, no right-move/shift */}
        <h1
          style={{
            marginTop: 20,
            marginBottom: 20,
            fontSize: "2rem",
            color: "var(--primary,#6C2EBE)",
            fontWeight: 700,
            letterSpacing: "0.01em",
            textAlign: "left",
            lineHeight: 1.13
          }}
        >
          Profile
        </h1>
        <div>
          {editMode ? renderProfileEditForm() : renderProfileCard()}
        </div>
      </div>
    </section>
  );
}

function SettingsView() {
  const {
    currency,
    setCurrency,
    currencyOptions,
  } = usePreferences();

  // For toggles/persistent settings, use local state and localStorage.
  const STORAGE_SETTINGS = 'fflow-settings-tab-v1';

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(() => {
    try {
      const val = JSON.parse(localStorage.getItem(STORAGE_SETTINGS));
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

  React.useEffect(() => {
    // Never destructively overwrite settings; always merge with previous if found.
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
  }

  function handleDataReset() {
    // WARNING: This is the ONLY place all persistent localStorage keys are destructively deleted.
    // Data is cleared ONLY on explicit user action. Never clear data on navigation or routine component unmount.
    localStorage.removeItem('fflow-profile-v1');
    localStorage.removeItem('fflow-transactions-v1');
    localStorage.removeItem('fflow-savings-goal-v1');
    localStorage.removeItem('fflow-settings-v1');
    localStorage.removeItem(STORAGE_SETTINGS);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 1700);
    window.location.reload();
  }

  return (
    <section className="placeholder-view">
      <div
        className="container"
        style={{
          maxWidth: 410,
          background: "var(--surface,#fff)",
          borderRadius: 13,
          boxShadow: "0 2px 16px rgba(60,42,150,0.07)",
          marginTop: 26,
          marginBottom: 0,
          padding: "0 0 32px 0"
        }}
      >
        {/* ORIGINAL Settings heading, flush/left, classic spacing */}
        <h1
          style={{
            marginTop: 20,
            marginBottom: 20,
            fontSize: "2rem",
            color: "var(--primary,#6C2EBE)",
            fontWeight: 700,
            letterSpacing: "0.01em",
            textAlign: "left",
            lineHeight: 1.13
          }}
        >
          Settings
        </h1>
        <div>
          {/* Form with currency selector at top, then toggles */}
          <form onSubmit={handleSave} aria-label="Preferences">
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Preferred Currency
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  style={{ width: '100%', padding: '9px 10px', marginTop: 7 }}
                  aria-label="Currency Selector"
                >
                  {currencyOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 9 }}>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={e => setNotificationsEnabled(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                  aria-checked={notificationsEnabled}
                />
                Enable Notifications
              </label>
              <div style={{ color: 'var(--text-secondary,#8A889A)', fontSize: "0.98em", marginLeft: 2 }}>
                Receive in-app milestone notifications (savings goal, etc).
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 9 }}>
                <input
                  type="checkbox"
                  checked={syncEnabled}
                  onChange={e => setSyncEnabled(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                  aria-checked={syncEnabled}
                />
                Enable Data Sync
              </label>
              <div style={{ color: 'var(--text-secondary,#8A889A)', fontSize: "0.98em", marginLeft: 2 }}>
                (Demo only) Sync data to cloud when connected (requires upgrade).
              </div>
            </div>
            <button type="submit" className="btn btn-large" style={{ width: 160, marginTop: 8 }}>
              Save Preferences
            </button>
            {saved && (<span style={{ color: 'var(--income,#22C55E)', marginLeft: 14, fontWeight: 500 }}>Saved!</span>)}
          </form>
          <div
            style={{
              marginTop: 32,
              padding: '13px 13px 13px 17px',
              background: 'var(--background,#fff)',
              borderRadius: 10,
              boxShadow: "0 2px 11px rgba(60,42,150,0.06)"
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.10em', color: 'var(--primary,#6C2EBE)' }}>Danger Zone</h3>
            <button
              onClick={() => setResetConfirm(v => !v)}
              className="btn btn-cancel"
              style={{ marginTop: 0 }}
              aria-label="Clear & Reset Data"
            >
              Reset All Data
            </button>
            {resetConfirm && !resetDone && (
              <div style={{ marginTop: 8, color: 'var(--expense,#E74C3C)', fontWeight: 500, fontSize: "1.05em" }}>
                This removes <b>all</b> data (profile, transactions, goals, preferences). Are you sure?
                <button
                  className="btn btn-large"
                  style={{ marginLeft: 13, background: '#E74C3C', color: '#fff' }}
                  onClick={handleDataReset}
                >
                  Confirm Reset
                </button>
                <button
                  className="btn"
                  style={{ marginLeft: 8 }}
                  onClick={() => setResetConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            )}
            {resetDone && (
              <div style={{ marginTop: 8, color: 'var(--income,#22C55E)', fontWeight: 500 }}>
                All data has been cleared! Reloading...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  // Onboarding flag
  const [showOnboarding, setShowOnboarding] = useState(false); // Track modal visibility

  // App State Management (localStorage only)
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fflow-profile-v1')) || {};
    } catch { return {}; }
  });
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fflow-settings-v1')) || {};
    } catch { return {}; }
  });
  const [transactions, setTransactions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fflow-transactions-v1')) || [];
    } catch { return []; }
  });
  const [goal, setGoal] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fflow-savings-goal-v1')) || null;
    } catch { return null; }
  });
  const [budgets, setBudgets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fflow-budgets-v1')) || {};
    } catch { return {}; }
  });

  // Toast notification: { message, type } or null
  const [toast, setToast] = useState(null);

  // Notification preference (get from PreferencesProvider if present)
  const { notificationsEnabled = true } = usePreferences() || {};

  // Router
  const initialRoute = window.location.hash.replace('#', '') || '/';
  const [route, setRoute] = useState(initialRoute);

  // Track sidebar for responsive nav
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 650
  );

  // Initialization
  useEffect(() => {
    // Show onboarding modal if first visit (i.e., 'fflow-onboarded' absent)
    if (!localStorage.getItem('fflow-onboarded')) {
      setShowOnboarding(true);
    }
    // Setup route hash change listener
    const onHashChange = () => {
      setRoute(window.location.hash.replace('#', '') || '/');
    };
    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  // Responsive sidebar
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

  // Sync profile/settings/transactions/goal/budgets with localStorage on change
  useEffect(() => {
    localStorage.setItem('fflow-profile-v1', JSON.stringify(profile));
  }, [profile]);
  useEffect(() => {
    localStorage.setItem('fflow-settings-v1', JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem('fflow-transactions-v1', JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    localStorage.setItem('fflow-savings-goal-v1', JSON.stringify(goal));
  }, [goal]);
  useEffect(() => {
    localStorage.setItem('fflow-budgets-v1', JSON.stringify(budgets));
  }, [budgets]);

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

  // Child Router
  // Add Transaction Modal state control
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editTx, setEditTx] = useState(null); // For edit modal

  // Savings Goal Modal state control
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Open modal for new goal or edit
  const handleOpenGoalModal = () => setShowGoalModal(true);

  // Close modal
  const handleCloseGoalModal = () => setShowGoalModal(false);

  // Save goal from modal (validate/close/set/toast)
  const handleSaveGoal = (goalObj) => {
    setGoal(goalObj);
    setShowGoalModal(false);
    notify(goal ? "Goal updated!" : "Goal set successfully!", "success");
  };

  // Method to open modal (can be passed to Dashboard for FAB or Add button)
  const handleOpenTransactionModal = () => {
    setEditTx(null);
    setShowTransactionModal(true);
  };

  // Opens modal for editing specific transaction
  const handleEditTransaction = (tx) => {
    setEditTx(tx);
    setShowTransactionModal(true);
  };

  // After transaction is added or modal closed
  const handleCloseTransactionModal = () => {
    setEditTx(null);
    setShowTransactionModal(false);
  };

  // Handles saving both add and edit
  const handleSaveTransaction = (tx) => {
    // Always require a transaction to have a unique id
    if (!tx.id) {
      // Assign random id for safety (shouldn't happen for edits, but handles legacy/new)
      tx.id = 'tx_' + Math.random().toString(36).substr(2, 9);
    }
    if (editTx) {
      setTransactions(prev =>
        prev.map(t => (t.id === tx.id ? { ...t, ...tx } : t))
      );
      setShowTransactionModal(false);
      setEditTx(null);
      notify('Transaction updated!', 'success');
    } else {
      setTransactions(prev => [...prev, tx]);
      setShowTransactionModal(false);
      setEditTx(null);
      notify('Transaction added successfully!', 'success');
    }
  };

  // Make edit handler globally detectable for legacy calls (from Dashboard inline)
  React.useEffect(() => {
    window.openTransactionEditModal = handleEditTransaction;
    return () => { window.openTransactionEditModal = null; };
  });

  let ViewRaw;
  switch (route) {
    case '/':
      ViewRaw = <Dashboard
        showToast={notify}
        transactions={transactions}
        setTransactions={setTransactions}
        goal={goal}
        setGoal={setGoal} // still used for programmatic updates, but modal controls flow
        onAddTransaction={handleOpenTransactionModal} // Pass modal open handler
        // Pass edit and delete action handlers via global edit fn
        savingsRingProps={{ onSetGoal: handleOpenGoalModal }}
      />;
      break;
    case '/expenses':
      ViewRaw = <ExpensesView
        allTransactions={transactions}
        setTransactions={setTransactions}
        onEditTransaction={handleEditTransaction}
        showToast={notify}
      />;
      break;
    case '/budget':
      ViewRaw = <BudgetPlanner transactions={transactions} showToast={notify} />;
      break;
    case '/calendar':
      ViewRaw = <CalendarView transactions={transactions} />;
      break;
    case '/profile':
      ViewRaw = <ProfileView />;
      break;
    case '/settings':
      ViewRaw = <SettingsView />;
      break;
    default:
      ViewRaw = <section className="placeholder-view"><div className="container"><h1>Not Found</h1></div></section>;
  }

  // Onboarding dismiss
  const handleOnboardingDismiss = () => {
    localStorage.setItem('fflow-onboarded', '1');
    setShowOnboarding(false);
  };

  // Nav
  const handleNavigate = (to) => {
    if (to !== route) {
      window.location.hash = to;
      setRoute(to);
    }
  };

  return (
    <PreferencesProvider>
      <ThemeProvider>
        <div className="app" tabIndex="-1">
          <Sidebar
            currentRoute={route}
            onNavigate={handleNavigate}
          />
          <main className="main-content" tabIndex={-1} aria-live="polite">
            {ViewRaw}
          </main>
          {showTransactionModal && (
            <TransactionFormModal
              // Supports add and edit
              onSave={handleSaveTransaction}
              onClose={handleCloseTransactionModal}
              isOpen={showTransactionModal}
              initial={editTx}
            />
          )}
          {/* Savings Goal Modal */}
          {showGoalModal && (
            <SavingsGoalModal
              onSave={handleSaveGoal}
              onClose={handleCloseGoalModal}
              initial={goal}
            />
          )}
          {/* Render onboarding modal for new users; allow closing to unblock app */}
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
