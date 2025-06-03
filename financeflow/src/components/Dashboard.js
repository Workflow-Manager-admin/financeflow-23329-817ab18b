import React from "react";
import "./Dashboard.css";
import PieChart from "./visuals/PieChart";
import { usePreferences } from './PreferencesProvider';
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
  const { currencySymbol } = usePreferences();

  const income = transactions.filter((tx) => tx.type === "income");
  const expense = transactions.filter((tx) => tx.type === "expense");
  const totalIncome = income.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpense = expense.reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <section className="dashboard">
      {/* PUBLIC_INTERFACE: Modern Floating Add Transaction Button - Modern & Prominent */}
      <button
        className="fab-add"
        type="button"
        title="Add transaction"
        aria-label="Add transaction"
        tabIndex={0}
        onClick={onAddTransaction}
      >
        {/* Plus-circle Icon (SVG) - Modern, prominent */}
        <span className="fab-icon" aria-hidden="true">
          <svg
            width="30"
            height="30"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
            focusable="false"
          >
            <circle cx="18" cy="18" r="18" fill="currentColor" opacity="0.14" />
            <rect x="9" y="17" width="18" height="2" rx="1" fill="currentColor" />
            <rect x="17" y="9" width="2" height="18" rx="1" fill="currentColor" />
          </svg>
        </span>
        <span className="fab-label">Add transaction</span>
      </button>

      {/* Dashboard main content with sidebar offset */}
      <div className="dashboard-content-wrapper">
        <div className="dashboard-flex-grid">
          <div className="dashboard-pie-savings-col">
            <div className="dashboard-piechart-panel">
              {/* Pass currencySymbol to PieChart */}
              <PieChart transactions={transactions} currencySymbol={currencySymbol} />
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
      </div>
    </section>
  );
}

export default Dashboard;
