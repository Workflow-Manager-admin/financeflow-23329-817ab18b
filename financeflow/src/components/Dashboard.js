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
function Dashboard({ transactions, setTransactions, goal, setGoal, showToast, onAddTransaction }) {
  // Calculate values for charts and savings
  const income = transactions.filter(tx => tx.type === "income");
  const expense = transactions.filter(tx => tx.type === "expense");
  const totalIncome = income.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpense = expense.reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <section className="dashboard">
      {/* Floating Action Button (enhanced) */}
      <button
        className="fab-add enhanced"
        title="Add Transaction"
        aria-label="Add Transaction"
        onClick={onAddTransaction}
      >
        <span className="fab-icon" aria-hidden="true">＋</span>
        <span className="fab-label">Add transaction</span>
      </button>

      {/* Dashboard flex/grid arrangement */}
      <div className="dashboard-flex-grid">
        {/* SWAPPED: PieChart + Savings column first, then Insights column */}
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
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    </section>
  );
}
export default Dashboard;
