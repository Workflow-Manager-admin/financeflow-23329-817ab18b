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
        <TransactionList
          transactions={transactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMsg="No transactions yet."
          currencySymbol={currencySymbol}
        />
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
