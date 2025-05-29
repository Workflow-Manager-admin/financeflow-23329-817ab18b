import React from 'react';
import './SavingsRing.css';

// PUBLIC_INTERFACE
function SavingsRing({ goal, stats, onSetGoal }) {
  const target = goal?.target || 0;
  const label = goal?.label || 'Savings Goal';
  const saved = stats.balance || 0;
  const percent = target > 0 ? Math.min(1, saved / target) : 0;

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
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span>
          <span style={{ color: 'var(--text-secondary)' }}>${saved.toFixed(2)}/</span>
          <span>${target ? target.toFixed(2) : '---'}</span>
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
