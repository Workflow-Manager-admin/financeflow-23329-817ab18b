import React, { useState } from "react";
import "./Dashboard.css";
import SavingsRing from "./savings/SavingsRing";
import PieChart from "./visuals/PieChart";
import SpendingTrendsWithInsights from "./visuals/SpendingTrendsWithInsights";
import TransactionList from "./transactions/TransactionList";
import FilterBar from "./transactions/FilterBar";
import SavingsGoalModal from "./savings/SavingsGoalModal";

/**
 * PUBLIC_INTERFACE
 * Main dashboard layout (2024 revision):
 * - Top row: PieChart (top left), Spending Trends & Insights (top right)
 * - Second row: Savings Goal (centered, below both charts)
 * - Third row: Transactions List (spans full width)
 * Responsive and visually balanced.
 */
function Dashboard({ showToast, transactions, setTransactions, goal, setGoal }) {
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Currency symbol can be brought in from context/provider if needed, use "$" fallback for demo
  const currencySymbol = "$";

  // TransactionList callbacks (if unused, pass noop)
  const handleEdit = () => {};
  const handleDelete = () => {};

  // Filter state for type, category, date range
  const [filters, setFilters] = useState({
    type: "All",       // All, Income, Expense
    category: "All",   // All, or per options below
    from: "",
    to: ""
  });

  // Build categories dynamically from transactions, mapping legacy "Salary" to "Rent/House" for expense
  const categories = React.useMemo(() => {
    const set = new Set(
      (transactions || []).map(t =>
        t.type === "expense" && t.category === "Salary"
          ? "Rent/House"
          : t.category
      )
    );
    return ["All", ...Array.from(set).filter(Boolean)];
  }, [transactions]);

  // Filtering logic for Dashboard
  function applyFilters(data, flt) {
    let arr = data || [];
    if (flt.type && flt.type !== "All") {
      arr = arr.filter(t => t.type === flt.type.toLowerCase());
    }
    if (flt.category && flt.category !== "All") {
      arr = arr.filter(t =>
        (t.type === "expense" && t.category === "Salary" ? "Rent/House" : t.category) === flt.category
      );
    }
    if (flt.from) arr = arr.filter(t => t.date >= flt.from);
    if (flt.to) arr = arr.filter(t => t.date <= flt.to);
    return arr;
  }
  const filteredTransactions = React.useMemo(() => applyFilters(transactions, filters), [transactions, filters]);

  return (
    <section className="dashboard-root">

      {/* Top Row: Visuals + Insights */}
      <div className="dashboard-visuals-top">
        <div className="dashboard-col dashboard-col-pie">
          <PieChart transactions={transactions} />
        </div>
        <div className="dashboard-col dashboard-col-trends">
          <SpendingTrendsWithInsights transactions={transactions} />

          {/* SavingsRing is placed directly below the insights/trends */}
          <div className="dashboard-savings-goal-card dash-savings-below-insights">
            <SavingsRing
              goal={goal}
              stats={{
                balance: Array.isArray(transactions)
                  ? transactions
                      .filter((tx) => tx.type === "income") // treat only incomes as savings
                      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
                  : 0
              }}
              onSetGoal={() => setShowGoalModal(true)}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>
      </div>

      {/* Transactions List (bottom row) */}
      <div className="dashboard-transactions-list-row">

        {/* Transactions Heading */}
        <h2
          style={{
            margin: "0 0 7px 1px",
            fontSize: "1.38rem",
            fontWeight: 700,
            color: "var(--primary,#6C2EBE)",
            letterSpacing: "0.01em",
            textAlign: "left",
          }}
        >
          Transactions
        </h2>

        {/* Filtering Bar */}
        <FilterBar filters={filters} setFilters={setFilters} categories={categories} />

        <TransactionList
          transactions={filteredTransactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMsg="No transactions yet."
          currencySymbol={currencySymbol}
        />
        {filteredTransactions.length === 0 && (
          <p style={{ color: "var(--text-secondary)", paddingLeft: 0, margin: "11px 0 0 1px" }}>
            No transactions for current filters.
          </p>
        )}
      </div>

      {/* Modal for setting savings goal */}
      {showGoalModal && (
        <SavingsGoalModal
          currentGoal={goal}
          onClose={() => setShowGoalModal(false)}
          onSaveGoal={setGoal}
        />
      )}
    </section>
  );
}

export default Dashboard;
