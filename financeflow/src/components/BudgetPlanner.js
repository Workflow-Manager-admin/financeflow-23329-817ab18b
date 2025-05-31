import React, { useState, useEffect, useRef } from "react";
import { usePreferences } from "./PreferencesProvider";

/**
 * BudgetPlanner — allows budgeting per category, navigation of months/years,
 * and persistence of each month's budgets/expenses in localStorage.
 * Data model: { [periodKey]: { budgets: { cat: amt, ... } } }
 * periodKey = "YYYY-MM" (e.g. "2024-06")
 */
const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Utilities",
  "Subscriptions",
  "Rent/House",
  "Gift",
  "Healthcare",
  "Other",
];
const STORAGE_BUDGETS_KEY = "fflow-budgets-v1";

// Utilities
function getMonthOptions(fromYear = 2022) {
  return [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
}
function getYearOptions(firstYear, lastYear) {
  const arr = [];
  for (let y = lastYear; y >= firstYear; y--) arr.push(y);
  return arr;
}
function getCurrentPeriod() {
  const now = new Date();
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, "0"),
  };
}
function toPeriodKey(year, month) {
  return `${year}-${month}`;
}
function parsePeriodKey(period) {
  const [year, month] = period.split("-");
  return { year, month };
}

function getAllPeriodKeysFromBudgetData(obj) {
  return Object.keys(obj || {})
    .filter((k) => /^\d{4}-\d{2}$/.test(k))
    .sort()
    .reverse();
}
// From all transactions, extract all unique (year, month) with at least one transaction
function getAllUsedPeriods(transactions) {
  const keys = new Set();
  transactions.forEach((tx) => {
    if (tx && tx.date && /^\d{4}-\d{2}-\d{2}/.test(tx.date)) {
      keys.add(tx.date.slice(0, 7));
    }
  });
  return Array.from(keys).sort().reverse();
}

// PUBLIC_INTERFACE
function BudgetPlanner({ transactions = [] }) {
  const { currencySymbol = "$" } = usePreferences() || {};

  // All budget data: { [periodKey]: { budgets: { cat: amt } } }
  const [budgetData, setBudgetData] = useState(() => {
    try {
      const ls = localStorage.getItem(STORAGE_BUDGETS_KEY);
      if (!ls) return {};
      const dat = JSON.parse(ls);
      // Support legacy: migrate {cat: amt, ...} -> {curPeriodKey: {budgets: {cat: amt}}}
      if (dat && !Object.values(dat)[0]?.budgets) {
        const { year, month } = getCurrentPeriod();
        return {
          [toPeriodKey(year, month)]: { budgets: dat },
        };
      }
      return dat;
    } catch {
      return {};
    }
  });

  // Period/state logic
  const usedPeriodsFromBudgets = getAllPeriodKeysFromBudgetData(budgetData);
  const usedPeriodsFromTx = getAllUsedPeriods(transactions);
  const allPeriodsUsed = Array.from(
    new Set([...usedPeriodsFromBudgets, ...usedPeriodsFromTx])
  )
    .sort()
    .reverse();

  const now = getCurrentPeriod();
  const defaultPeriod =
    allPeriodsUsed.length > 0
      ? parsePeriodKey(allPeriodsUsed[0])
      : now;

  const [year, setYear] = useState(defaultPeriod.year);
  const [month, setMonth] = useState(defaultPeriod.month);

  // For month/year dropdown: allow quick navigation to previously used, but full range as well
  const minYear =
    Math.min(
      ...allPeriodsUsed.map((k) => Number(k.slice(0, 4))),
      Number(now.year)
    ) || Number(now.year);
  const maxYear = Math.max(
    ...allPeriodsUsed.map((k) => Number(k.slice(0, 4))),
    Number(now.year)
  );
  const yearOpts = getYearOptions(minYear, maxYear);

  // Period Key for current selection
  const periodKey = toPeriodKey(year, month);

  // Ensure budgetData[periodKey] exists (if not, initialize)
  useEffect(() => {
    setBudgetData((prev) => {
      if (prev[periodKey]?.budgets) return prev;
      // Shallow copy, possibly initialize with zeros
      return {
        ...prev,
        [periodKey]: { budgets: { ...EXPENSE_CATEGORIES.reduce((acc, c) => ((acc[c] = 0), acc), {}) } },
      };
    });
    // eslint-disable-next-line
  }, [periodKey]);

  // Save entire structure on change to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_BUDGETS_KEY, JSON.stringify(budgetData));
  }, [budgetData]);

  // For editing
  const [editingRow, setEditingRow] = useState(null);
  const [rowDraft, setRowDraft] = useState({});
  const [error, setError] = useState("");

  // Ensure rowDraft in sync with current value
  useEffect(() => {
    if (editingRow) {
      setRowDraft({
        value: Number(
          budgetData?.[periodKey]?.budgets?.[editingRow] || 0
        ),
      });
      setError("");
    }
    // eslint-disable-next-line
  }, [editingRow, year, month]);

  // For this period, compute actual expenses per category
  const actualExpenses = {};
  transactions
    .filter(
      (tx) =>
        tx.type === "expense" &&
        tx.date &&
        tx.date.slice(0, 7) === periodKey
    )
    .forEach((tx) => {
      const cat = tx.category === "Salary" ? "Rent/House" : tx.category;
      actualExpenses[cat] = (actualExpenses[cat] || 0) + Number(tx.amount || 0);
    });

  // Income for this period:
  const monthIncome = transactions
    .filter(
      (tx) =>
        tx.type === "income" &&
        tx.date &&
        tx.date.slice(0, 7) === periodKey
    )
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalBudget = EXPENSE_CATEGORIES.reduce(
    (sum, cat) =>
      sum + Number(budgetData?.[periodKey]?.budgets?.[cat] || 0),
    0
  );

  // Handle navigation
  const handlePrevPeriod = () => {
    // Move to previous period in allPeriodsUsed, or to prior month
    const idx = allPeriodsUsed.indexOf(periodKey);
    if (idx >= 0 && idx < allPeriodsUsed.length - 1) {
      const prev = parsePeriodKey(allPeriodsUsed[idx + 1]);
      setYear(prev.year);
      setMonth(prev.month);
    } else {
      // fallback: previous month calculation
      let d = new Date(Number(year), Number(month) - 1, 1);
      d.setMonth(d.getMonth() - 1);
      setYear(String(d.getFullYear()));
      setMonth(String(d.getMonth() + 1).padStart(2, "0"));
    }
  };
  const handleNextPeriod = () => {
    const idx = allPeriodsUsed.indexOf(periodKey);
    if (idx > 0) {
      const next = parsePeriodKey(allPeriodsUsed[idx - 1]);
      setYear(next.year);
      setMonth(next.month);
    } else {
      // fallback: next month
      let d = new Date(Number(year), Number(month) - 1, 1);
      d.setMonth(d.getMonth() + 1);
      setYear(String(d.getFullYear()));
      setMonth(String(d.getMonth() + 1).padStart(2, "0"));
    }
  };

  // Save budget amount
  function handleSaveBudget(cat, rawValue) {
    let v = parseFloat(String(rawValue).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(v) || v < 0) v = 0;

    const newBudgets = {
      ...budgetData?.[periodKey]?.budgets,
      [cat]: v,
    };

    // Enforce total budget <= income for period on increase
    const otherSum = EXPENSE_CATEGORIES.reduce(
      (sum, c) => (c === cat ? sum : sum + Number(newBudgets[c] || 0)),
      0
    );
    const proposedSum = otherSum + v;

    if (
      monthIncome > 0 &&
      proposedSum > monthIncome &&
      v > Number(budgetData?.[periodKey]?.budgets?.[cat] || 0)
    ) {
      setError(
        "Cannot set this budget: total for all categories would exceed your income for this period."
      );
      return false;
    }

    setBudgetData((prev) => ({
      ...prev,
      [periodKey]: {
        budgets: {
          ...prev?.[periodKey]?.budgets,
          [cat]: v,
        },
      },
    }));
    setEditingRow(null);
    setRowDraft({});
    setError("");
    return true;
  }

  // Make sure variance label works for each cat
  function renderTableBody() {
    return EXPENSE_CATEGORIES.map((cat) => {
      const budgetVal = Number(budgetData?.[periodKey]?.budgets?.[cat] || 0);
      const isEditing = editingRow === cat;
      const actual = Number(actualExpenses[cat] || 0);
      const variance = budgetVal - actual;
      return (
        <tr key={cat} style={{ background: "none" }}>
          <td
            className="budgetplanner-category-cell"
            style={{ background: "var(--surface,#fff)" }}
          >
            {cat}
          </td>
          <td
            className="budgetplanner-budget-cell"
            style={{ background: "var(--surface,#fff)" }}
          >
            {isEditing ? (
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <input
                  className="budgetplanner-input"
                  type="number"
                  min={0}
                  step="0.01"
                  autoFocus
                  style={{
                    width: 70,
                    fontSize: "1em",
                    padding: "4px 7px",
                    background: "var(--surface,#fff)",
                  }}
                  value={
                    rowDraft.value === 0
                      ? ""
                      : typeof rowDraft.value === "number" &&
                        !Number.isNaN(rowDraft.value)
                      ? rowDraft.value
                      : rowDraft.value || ""
                  }
                  onChange={(e) => {
                    let v = e.target.value;
                    if (/^-?[0-9]*\.?[0-9]*$/.test(v) || v === "") {
                      setRowDraft({
                        value: v === "" ? "" : parseFloat(v),
                      });
                    }
                  }}
                  aria-label={`Budget for ${cat}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveBudget(cat, rowDraft.value);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setEditingRow(null);
                      setRowDraft({});
                      setError("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="budgetplanner-save-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveBudget(cat, rowDraft.value);
                  }}
                  aria-label={`Save budget for ${cat}`}
                  style={{
                    marginLeft: 2,
                    border: "none",
                    background: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "var(--income,#22C55E)",
                    display: "inline-flex",
                    alignItems: "center",
                    fontSize: "1.25em",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M5 11l3.2 3.4a1 1 0 0 0 1.5-.1l5.3-6.5"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="budgetplanner-cancel-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditingRow(null);
                    setRowDraft({});
                    setError("");
                  }}
                  aria-label={`Cancel editing budget for ${cat}`}
                  style={{
                    marginLeft: 1,
                    border: "none",
                    background: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "var(--expense,#E74C3C)",
                    display: "inline-flex",
                    alignItems: "center",
                    fontSize: "1.18em",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M5.6 5.6l6.8 6.8M12.4 5.6l-6.8 6.8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <span
                tabIndex={0}
                className="budgetplanner-edit-span"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  cursor: "pointer",
                }}
                onClick={editingRow === null ? () => setEditingRow(cat) : undefined}
                aria-label={`Edit budget for ${cat}`}
              >
                {currencySymbol}
                {budgetVal.toFixed(2)}
                <button
                  tabIndex={0}
                  type="button"
                  className="budgetplanner-edit-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditingRow(cat);
                    setError("");
                  }}
                  aria-label={`Edit budget for ${cat}`}
                  title="Edit"
                  disabled={editingRow !== null}
                  style={{
                    background: "none",
                    border: "none",
                    marginLeft: 4,
                    padding: 0,
                    fontSize: "1em",
                    cursor: editingRow === null ? "pointer" : "not-allowed",
                    color: "var(--primary, #6C2EBE)",
                    display: "inline-flex",
                    alignItems: "center",
                    opacity: editingRow !== null ? 0.5 : 1,
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 20 20"
                    fill="none"
                    style={{ display: "inline", verticalAlign: "middle" }}
                  >
                    <path
                      d="M14.8 3.8l1.4-1.3a2 2 0 112.8 2.8l-1.3 1.4-2.9-2.9zM3 17l2.4-.3c.2 0 .4-.1.5-.2L16.7 6.7l-2.9-2.9L3.6 14.1c-.1.1-.2.3-.2.5L3 17z"
                      stroke="currentColor"
                      strokeWidth="1.15"
                    />
                  </svg>
                </button>
              </span>
            )}
          </td>
          <td
            className="budgetplanner-actual-cell"
            style={{ textAlign: "right", background: "var(--surface,#fff)" }}
          >
            {currencySymbol}
            {actual.toFixed(2)}
          </td>
          <td
            className="budgetplanner-variance-cell"
            style={{
              textAlign: "right",
              color:
                variance < 0
                  ? "var(--expense,#E74C3C)"
                  : "var(--income,#22C55E)",
              fontWeight: 600,
              background: "var(--surface,#fff)",
              position: "relative",
            }}
          >
            {variance >= 0 ? (
              <>
                +{currencySymbol}
                {Math.abs(variance).toFixed(2)}
              </>
            ) : (
              <>
                -{currencySymbol}
                {Math.abs(variance).toFixed(2)}
              </>
            )}
            {/* Exceeds flag */}
            {variance < 0 && (
              <span
                style={{
                  fontSize: "0.98em",
                  color: "var(--expense,#E74C3C)",
                  marginLeft: 6,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                (exceeds)
              </span>
            )}
          </td>
        </tr>
      );
    });
  }

  // Down/Up period availability
  const curIdx = allPeriodsUsed.indexOf(periodKey);

  return (
    <section className="placeholder-view">
      <div
        className="container"
        style={{
          maxWidth: 720,
          minWidth: 250,
          background: "var(--surface,#fff)",
          borderRadius: 18,
          boxShadow: "0 6px 36px rgba(60,42,150,0.10)",
          marginTop: 24,
          padding: "0 0 30px 0",
          border: "1.2px solid var(--secondary, #ececec)",
          animation: "fadein 0.18s",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 23,
            marginTop: 28,
            marginBottom: 12,
          }}
        >
          <h1
            style={{
              fontSize: "2.02rem",
              color: "var(--primary,#6C2EBE)",
              fontWeight: 800,
              letterSpacing: "0.01em",
              textAlign: "left",
              lineHeight: 1.13,
              marginBottom: 0,
              marginTop: 0,
            }}
          >
            Budget Planner
          </h1>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                background: "#eee",
                color: "#7d37db",
                border: "none",
                padding: "2px 13px",
                fontSize: "1.24em",
                borderRadius: 7,
                cursor: curIdx >= 0 && curIdx < allPeriodsUsed.length - 1 ? "pointer" : "not-allowed",
                opacity: curIdx >= 0 && curIdx < allPeriodsUsed.length - 1
                  ? 1
                  : 0.44,
                fontWeight: 500,
              }}
              onClick={handlePrevPeriod}
              aria-label="Previous period"
              disabled={!(curIdx >= 0 && curIdx < allPeriodsUsed.length - 1)}
              tabIndex={0}
              type="button"
            >
              &lt;
            </button>
            <select
              value={month}
              style={{
                fontSize: "1em",
                padding: "4px 8px",
                borderRadius: 6,
                border: "1.2px solid var(--secondary, #ececec)",
                background: "var(--surface, #fff)",
                color: "var(--text-color,#23243A)",
              }}
              onChange={(e) => setMonth(e.target.value)}
              aria-label="Select month"
            >
              {getMonthOptions().map(({ value, label }) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={year}
              style={{
                fontSize: "1em",
                padding: "4px 8px",
                borderRadius: 6,
                border: "1.2px solid var(--secondary, #ececec)",
                background: "var(--surface, #fff)",
                color: "var(--text-color,#23243A)",
                marginLeft: 4,
              }}
              onChange={(e) => setYear(e.target.value)}
              aria-label="Select year"
            >
              {yearOpts.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              style={{
                background: "#eee",
                color: "#7d37db",
                border: "none",
                padding: "2px 13px",
                fontSize: "1.24em",
                borderRadius: 7,
                cursor: curIdx > 0 ? "pointer" : "not-allowed",
                opacity: curIdx > 0 ? 1 : 0.44,
                fontWeight: 500,
              }}
              onClick={handleNextPeriod}
              aria-label="Next period"
              disabled={!(curIdx > 0)}
              tabIndex={0}
              type="button"
            >
              &gt;
            </button>
          </div>
        </div>
        {/* Summary panel above table */}
        <div
          style={{
            margin: "0 0 10px 2px",
            padding: "12px 8px 7px 8px",
            borderRadius: "11px",
            background: "var(--secondary, #F5F6FA)",
            color: "var(--text-color, #23243A)",
            fontSize: "1.05em",
            border: "1.1px solid var(--secondary, #ececec)",
            boxShadow: "0 2px 9px rgba(60,42,150,0.05)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "20px 24px",
          }}
        >
          <span>
            <b>Total Budgeted:</b> {currencySymbol}
            {totalBudget.toFixed(2)}
          </span>
          <span>
            <b>Income this Period:</b> {currencySymbol}
            {monthIncome.toFixed(2)}
          </span>
          {monthIncome > 0 && totalBudget > monthIncome && (
            <span
              style={{
                color: "var(--expense,#E74C3C)",
                fontWeight: 600,
                marginLeft: 14,
              }}
            >
              Over Budget! Your expense budgets exceed your income.
            </span>
          )}
          {monthIncome > 0 && totalBudget <= monthIncome && (
            <span
              style={{
                color: "var(--income,#22C55E)",
                fontWeight: 500,
                marginLeft: 14,
              }}
            >
              Budgets are within your income.
            </span>
          )}
        </div>
        <div style={{ overflowX: "auto", width: "100%", marginBottom: 4 }}>
          <table
            className="budgetplanner-table"
            style={{
              minWidth: 490,
              width: "100%",
              maxWidth: 740,
              tableLayout: "fixed",
              fontSize: "1em",
              background: "var(--surface,#fff)",
            }}
          >
            <colgroup>
              <col style={{ minWidth: 110, width: "33%" }} />
              <col style={{ minWidth: 78, width: "18%" }} />
              <col style={{ minWidth: 78, width: "18%" }} />
              <col style={{ minWidth: 90, width: "21%" }} />
            </colgroup>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: "1.01em",
                    padding: "9px 6px",
                  }}
                >
                  Category
                </th>
                <th style={{ textAlign: "right" }}>Budget Set</th>
                <th style={{ textAlign: "right" }}>Actual Expenses</th>
                <th style={{ textAlign: "right" }}>Variance</th>
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
        </div>
        {error && (
          <div
            style={{
              color: "var(--expense,#E74C3C)",
              fontWeight: 500,
              marginLeft: 8,
              marginBottom: 10,
            }}
          >
            {error}
          </div>
        )}
        <div
          style={{
            color: "var(--text-secondary)",
            fontSize: "1em",
            marginTop: 23,
            marginLeft: 6,
          }}
        >
          <ul
            style={{
              marginLeft: 9,
              paddingLeft: 0,
              listStyle: "circle",
              color: "var(--primary)",
              fontSize: "0.99em",
            }}
          >
            <li>
              Budgets are saved separately for each month/year. To review or edit
              past/future months, adjust the selectors above.
            </li>
            <li>
              "Actual Expenses" and "Variance" update live from your transactions for
              the selected month/year.
            </li>
            <li>
              Variance = Budget Set - Actual Expenses. Positive means under budget;
              negative is over budget (red).
            </li>
            <li>
              Navigation arrows let you jump to months with budget or transaction data.
            </li>
          </ul>
        </div>
        {allPeriodsUsed.length > 1 && (
          <div
            style={{
              marginTop: 15,
              color: "var(--text-secondary,#888)",
              fontSize: "0.97em",
              paddingLeft: 12,
            }}
          >
            <span style={{ fontWeight: 500 }}>You have budget data for:</span>
            <span style={{ marginLeft: 5 }}>
              {allPeriodsUsed.map((p, i) => {
                const { year, month } = parsePeriodKey(p);
                const label =
                  getMonthOptions().find((x) => x.value === month)?.label +
                  " " +
                  year;
                return (
                  <span key={p}>
                    {i > 0 ? ", " : ""}
                    <a
                      href="#"
                      style={{
                        color:
                          p === periodKey
                            ? "var(--primary, #6C2EBE)"
                            : "var(--text-secondary,#888)",
                        fontWeight: p === periodKey ? 600 : 400,
                        textDecoration: p === periodKey ? "underline" : "none",
                        marginRight: 2,
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setYear(year);
                        setMonth(month);
                      }}
                    >
                      {label}
                    </a>
                  </span>
                );
              })}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export default BudgetPlanner;
