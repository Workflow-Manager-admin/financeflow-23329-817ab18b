import React, { useEffect, useRef, useState } from "react";
import "./Dashboard.css";
import SpendingTrendsWithInsights from "./visuals/SpendingTrendsWithInsights";
import PieChart from "./visuals/PieChart";
import SavingsRing from "./savings/SavingsRing";
import SavingsGoalModal from "./savings/SavingsGoalModal";
import TransactionList from "./transactions/TransactionList";
import TransactionFormModal from "./transactions/TransactionFormModal";
import FilterBar from "./transactions/FilterBar";

/**
 * Dashboard component displaying main panels, charts, savings ring, and transactions list.
 * Restores a floating Add Transaction button positioned bottom-right, which triggers the add transaction workflow/modal.
 * 
 * @param {Object} props
 * @param {Function} props.showToast
 * @param {Array} props.transactions
 * @param {Function} props.setTransactions
 * @param {Object|null} props.goal
 * @param {Function} props.setGoal
 */
// PUBLIC_INTERFACE
function Dashboard({
  showToast,
  transactions,
  setTransactions,
  goal,
  setGoal,
}) {
  // -- Local States --
  // Add Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  // Savings Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  // Transactions filter states
  const [filters, setFilters] = useState({
    category: "All",
    from: "",
    to: ""
  });

  // Open transaction add modal
  function handleFabClick() {
    setShowAddModal(true);
  }
  // Close add modal (when user cancels or submits)
  function handleAddModalClose() {
    setShowAddModal(false);
  }
  // Submit handler for new transaction
  function handleAddTransaction(newTx) {
    setTransactions && setTransactions([...transactions, newTx]);
    showToast && showToast("Transaction added!", "success");
    setShowAddModal(false);
  }
  // Open savings goal modal
  function openGoalModal() {
    setShowGoalModal(true);
  }
  // Close savings goal modal
  function closeGoalModal() {
    setShowGoalModal(false);
  }
  // Handle saving a new/updated goal
  function handleGoalSave(goalObj) {
    setGoal && setGoal(goalObj);
    showToast && showToast("Goal saved!", "success");
    closeGoalModal();
  }

  // Category Filter
  const categories = React.useMemo(() => {
    const set = new Set((transactions || [])
      .map(t => t.category && t.type === 'expense' ? t.category : null)
      .filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [transactions]);

  // Filter transactions
  function applyFilters(data, filtersArg) {
    let arr = data;
    const { category = "All", from = "", to = "" } = filtersArg || {};
    if (category && category !== "All") {
      arr = arr.filter(t => t.category === category);
    }
    if (from) arr = arr.filter(t => t.date >= from);
    if (to) arr = arr.filter(t => t.date <= to);
    return arr;
  }
  const filteredTx = React.useMemo(
    () => applyFilters(transactions || [], filters),
    [transactions, filters]
  );

  return (
    <div className="dashboard">
      {/* Top: Savings Ring and Goal Panel */}
      <div className="dashboard-row" style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap", marginTop: 24 }}>
        {/* Savings Progress Ring */}
        <div style={{ flex: "1 1 220px", minWidth: 210, maxWidth: 430 }}>
          <SavingsRing
            goal={goal}
            currentAmount={
              (transactions || []).filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount || 0), 0) -
              (transactions || []).filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount || 0), 0)
            }
            onSetGoal={openGoalModal}
          />
        </div>
        {/* Sparkline/spending trends */}
        <div style={{ flex: "2 1 320px", minWidth: 260, maxWidth: 900 }}>
          <SpendingTrendsWithInsights
            transactions={transactions}
            style={{ width: "100%" }}
          />
        </div>
        {/* Pie Chart Panel */}
        <div style={{ flex: "2 1 300px", minWidth: 220, maxWidth: 800 }}>
          <PieChart
            transactions={transactions}
            style={{ width: "100%" }}
          />
        </div>
      </div>
      {/* Transaction filters and list */}
      <div style={{ marginTop: 36 }}>
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          categories={categories}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <TransactionList
          transactions={filteredTx}
          onEdit={null}
          onDelete={null}
          emptyMsg="No transactions found."
        />
      </div>

      {/* Floating Add Transaction Button */}
      <button
        className="fab-add-transaction"
        aria-label="Add Transaction"
        title="Add Transaction"
        onClick={handleFabClick}
      >
        <span style={{
          fontSize: 28,
          lineHeight: 1,
          display: 'inline-block',
          verticalAlign: 'middle',
        }}>+</span>
      </button>

      {/* Add Transaction Modal */}
      <TransactionFormModal
        isOpen={showAddModal}
        onRequestClose={handleAddModalClose}
        onSubmit={handleAddTransaction}
        mode="add"
      />
      {/* Savings Goal Modal */}
      <SavingsGoalModal
        isOpen={showGoalModal}
        onClose={closeGoalModal}
        onSave={handleGoalSave}
        goal={goal}
      />
    </div>
  );
}

export default Dashboard;
