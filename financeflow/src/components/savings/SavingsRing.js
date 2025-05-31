import React from 'react';
import './SavingsRing.css';

/**
 * PUBLIC_INTERFACE
 * SavingsRing component always shows the label 'Savings Goal'
 * (no user or custom label displayed), with a clean appearance.
 */
function SavingsRing({ goal, stats = {}, onSetGoal, currencySymbol = '$' }) {
  const target = goal?.target || 0;
  // Always show 'Savings Goal' as title
  const saved = stats.balance || 0;
  const percent = target > 0 ? Math.min(1, saved / target) : 0;

  // Get label for goal period (fallback = "Goal")
  const periodMap = {
    weekly: 'Weekly Goal',
    monthly: 'Monthly Goal',
    quarterly: 'Quarterly Goal',
    yearly: 'Yearly Goal'
  };
  const goalPeriodLabel = periodMap[goal?.period] || "Goal";

  return (
    <div className="savingring-box">
      <svg width="112" height="112" viewBox="0 0 112 112">
        {/* Background ring */}
        <circle
          cx="56" cy="56" r="46"
          stroke="#eee" strokeWidth="16"
          fill="none"
        />
        {/* Progress ring */}
        <circle
          className="savingring-bar"
          cx="56" cy="56" r="46"
          stroke="var(--primary,#6C2EBE)"
          strokeWidth="16"
          fill="none"
          strokeDasharray={2 * Math.PI * 46}
          strokeDashoffset={2 * Math.PI * 46 * (1 - percent)}
          style={{
            transition: 'stroke-dashoffset 0.45s cubic-bezier(0.22,1,0.36,1)'
          }}
        />
        <text
          x="56" y="63"
          textAnchor="middle"
          fontSize="1.5rem"
          fill="var(--primary)"
          fontWeight="bold"
        >
          {percent >= 1 ? '🎉' : `${Math.round(percent * 100)}%`}
        </text>
      </svg>
      <div className="savingring-label">
        <span style={{ fontWeight: 600 }}>Savings Goal</span>
        <span style={{ fontSize: "0.96em", color: "var(--primary,#6C2EBE)", fontWeight: 500 }}>{goal ? goalPeriodLabel : null}</span>
        <span>
          <span style={{ color: 'var(--text-secondary)' }}>{currencySymbol}{saved.toFixed(2)}/</span>
          <span>{currencySymbol}{target ? target.toFixed(2) : '---'}</span>
        </span>
      </div>
      <button
        className="btn"
        style={{ marginTop: 7 }}
        onClick={onSetGoal}
        aria-label="Set savings goal"
      >{goal ? 'Edit Goal' : 'Set Goal'}</button>
    </div>
  );
}

export default SavingsRing;
