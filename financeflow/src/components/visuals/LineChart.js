import React from 'react';
import './LineChart.css';

// Simple grouping and min/max for sparkline chart
function groupByMonth(transactions) {
  const byDate = {};
  transactions.forEach(t => {
    const month = t.date ? t.date.slice(0, 7) : null;
    if (!month) return;
    if (!byDate[month]) byDate[month] = { income: 0, expense: 0 };
    byDate[month][t.type] += Number(t.amount);
  });
  // order ascending
  const labels = Object.keys(byDate).sort();
  return labels.map(l => ({ month: l, ...byDate[l] }));
}

/**
 * PUBLIC_INTERFACE
 * Displays a line chart of cash flow trends, or a dynamic message indicating how many
 * more transactions are needed to generate the chart.
 */
function LineChart({ transactions }) {
  // Minimum number of grouped periods (e.g., months) for a trend to be meaningful
  const MIN_PERIODS = 2;

  const data = groupByMonth(transactions);

  // Determine the raw count of transactions required to get at least MIN_PERIODS
  // For month-wise grouping, need transactions from at least MIN_PERIODS unique months
  const uniqueMonths = new Set(transactions.map(t => t.date && t.date.slice(0, 7)).filter(Boolean));
  const monthsNeeded = Math.max(0, MIN_PERIODS - uniqueMonths.size);

  if (data.length < MIN_PERIODS) {
    const remaining = monthsNeeded > 0 ? monthsNeeded : (MIN_PERIODS - data.length);
    let msg = '';
    if (transactions.length === 0) {
      msg = `Add at least ${MIN_PERIODS} transactions (from different months) to view your trends!`;
    } else if (monthsNeeded > 0) {
      msg = `Add transactions from ${monthsNeeded} more month${monthsNeeded > 1 ? 's' : ''} to view your trends!`;
    } else {
      msg = `Add ${MIN_PERIODS - data.length} more transaction${MIN_PERIODS - data.length > 1 ? 's' : ''} to view your trends!`;
    }
    return (
      <div className="linechart-box">
        <h4>Cash Flow Trend</h4>
        <div style={{ marginTop: 48, color: 'var(--text-secondary,#aaa)', fontSize: '1.13em', textAlign: 'center' }}>
          {msg}
        </div>
      </div>
    );
  }
  // Normalize Y for SVG
  const maxY = Math.max(...data.map(d => Math.max(d.income, d.expense)), 100);
  const stepX = 180 / (data.length - 1);

  const line = (type, color) => {
    let points = data.map((d, i) =>
      `${10 + i * stepX},${110 - (d[type] / maxY) * 90}`
    ).join(' ');
    return (
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        points={points}
        style={{ transition: 'stroke 0.1s' }}
      />
    );
  };

  return (
    <div className="linechart-box">
      <h4>Cash Flow Trend</h4>
      <svg width="200" height="120" viewBox="0 0 200 120" className="linechart-svg">
        {/* Baseline grid */}
        <line x1="10" y1="110" x2="190" y2="110" stroke="#dcdcf9" strokeDasharray="2,3" />
        {line('income', 'var(--income,#22C55E)')}
        {line('expense', 'var(--expense,#E74C3C)')}
      </svg>
      <div className="linechart-labels">
        {data.map(d => (
          <div key={d.month}>
            <span>{d.month.slice(2)}</span>
          </div>
        ))}
      </div>
      <div className="linechart-legend">
        <span style={{ color: 'var(--income,#22C55E)' }}>● Income</span>
        <span style={{ color: 'var(--expense,#E74C3C)' }}>● Expense</span>
      </div>
    </div>
  );
}

export default LineChart;
