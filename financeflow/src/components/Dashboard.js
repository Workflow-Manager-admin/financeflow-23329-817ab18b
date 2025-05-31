import React, { useState } from "react";
import "./Dashboard.css";
import SavingsGoalModal from "./savings/SavingsGoalModal";
import SavingsRing from "./savings/SavingsRing";
import PieChart from "./visuals/PieChart";
import SpendingTrendsWithInsights from "./visuals/SpendingTrendsWithInsights";
import HeatMapCalendar from "./visuals/HeatMapCalendar";

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
        {/* Left: Savings Goal/Progress, stacked + button */}
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
        {/* Right: Elongated Visuals/Insights/Heatmap section */}
        <div className="dashboard-visuals-area">
          <div className="dashboard-header-row">
            <h1 className="dashboard-title">Dashboard</h1>
          </div>
          {/* Main visuals grid */}
          <div className="dashboard-visuals-main-grid">
            <div className="dashboard-pie-trends">
              <PieChart transactions={transactions} />
              <SpendingTrendsWithInsights transactions={transactions} />
            </div>
            <div className="dashboard-heatmap-long">
              <HeatMapCalendar transactions={transactions} />
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
