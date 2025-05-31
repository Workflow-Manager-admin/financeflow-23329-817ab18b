import React, { useState } from "react";
import "./Dashboard.css";
import SavingsGoalModal from "./savings/SavingsGoalModal";
import SavingsRing from "./savings/SavingsRing";
import PieChart from "./visuals/PieChart";
import SpendingTrendsWithInsights from "./visuals/SpendingTrendsWithInsights";
/**
 * PUBLIC_INTERFACE
 * Main dashboard layout:
 * - Left: Savings Goal/Progress Ring (fixed width, "sidebar-style").
 * - Right: "elongated" section containing Visuals (Pie & Trends stacked) and HeatMap/Insights.
 * - Uses flexbox for clean, modern, responsive look.
 */
function Dashboard({ showToast, transactions, setTransactions, goal, setGoal }) {
  const [showGoalModal, setShowGoalModal] = useState(false);

  return (
    <section className="dashboard-root">
      <div className="dashboard-flex-row">
        {/* Savings Goal Left Column: Original Position */}
        <div className="dashboard-savings-goal-col">
          <div className="savings-goal-verticalCard">
            <SavingsRing goal={goal} />
            <button
              className="btn goal-btn"
              onClick={() => setShowGoalModal(true)}
              style={{ marginTop: 18 }}
              aria-label="Set Savings Goal"
            >
              Set Savings Goal
            </button>
          </div>
        </div>
        {/* Main Dashboard Visuals Area */}
        <div className="dashboard-visuals-area">
          <div className="dashboard-header-row">
            <h1 className="dashboard-title">Dashboard</h1>
          </div>
          {/* Main grid: PieChart (Expenses by Category), SpendingTrendsWithInsights side-by-side on large screens, stacked on mobile */}
          <div className="dashboard-visuals-main-grid" style={{ display: 'flex', flexDirection: 'row', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 270, maxWidth: 410 }}>
              <PieChart transactions={transactions} />
            </div>
            <div style={{ flex: 2, minWidth: 340, maxWidth: 630 }}>
              <SpendingTrendsWithInsights transactions={transactions} />
            </div>
          </div>
        </div>
      </div>
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
