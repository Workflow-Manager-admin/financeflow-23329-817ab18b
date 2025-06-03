import React from "react";
import "./Dashboard.css";
import PieChart from "./visuals/PieChart";
import SpendingTrendsWithInsights from "./visuals/SpendingTrendsWithInsights";
import SavingsRing from "./savings/SavingsRing";
import TransactionList from "./transactions/TransactionList";

/**
 * PUBLIC_INTERFACE
 * Dashboard main panel - structure:
 * - Left/First: Expenses by Category (PieChart) and Savings Goal
 * - Right/Second: Spending Trends & Insights
 * - TransactionList: below all charts
 * - Add Transaction button (FAB)
 * Responsive: columns stack on small screens, flex on desktop.
 */ 
function Dashboard({
  transactions,
  setTransactions,
  goal,
  setGoal,
  showToast,
  onAddTransaction,
}) {
  const income = transactions.filter((tx) => tx.type === "income");
  const expense = transactions.filter((tx) => tx.type === "expense");
  const totalIncome = income.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpense = expense.reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <section className="dashboard">
      {/* PUBLIC_INTERFACE: Modern Floating Add Transaction Button */}
      <button
        className="fab-add"
        type="button"
        title="Add transaction"
        aria-label="Add transaction"
        tabIndex={0}
        onClick={onAddTransaction}
      >
        {/* SVG Plus icon for modern look */}
        <span className="fab-icon" aria-hidden="true">
          <svg
            width="32"
            height="32"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
            focusable="false"
            aria-hidden="true"
          >
            <circle cx="14" cy="14" r="14" fill="currentColor" opacity="0.17" />
            <rect x="7.7" y="13" width="12.6" height="2" rx="1" fill="currentColor" />
            <rect x="13" y="7.7" width="2" height="12.6" rx="1" fill="currentColor" />
          </svg>
        </span>
        {/* Label: always visible except on <480px screens */}
        <span className="fab-label">Add transaction</span>
      </button>

      {/* Dashboard flex/grid arrangement */}
      <div className="dashboard-flex-grid">
        <div className="dashboard-pie-savings-col">
          <div className="dashboard-piechart-panel">
            <PieChart transactions={transactions} />
          </div>
          <div className="dashboard-savings-goal" style={{ marginTop: 22 }}>
            <SavingsRing
              goal={goal}
              totalSaved={totalIncome - totalExpense}
              setGoal={setGoal}
              showToast={showToast}
            />
          </div>
        </div>
        <div className="dashboard-insights-col">
          <div className="dashboard-insights-panel">
            <SpendingTrendsWithInsights transactions={transactions} />
          </div>
        </div>
      </div>

      <div className="dashboard-transactions-list">
        <TransactionList transactions={transactions} onEdit={() => {}} onDelete={() => {}} />
      </div>
    </section>
  );
}
export default Dashboard;
