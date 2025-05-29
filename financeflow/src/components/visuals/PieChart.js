import React from 'react';
import './PieChart.css';

const COLORS = [
  '#E87A41', '#6C2EBE', '#22C55E', '#E74C3C', '#F9D423',
  '#00B8D9', '#FF8B4D', '#8247E5', '#3498db', '#ff5c8a'
];

function getPieData(transactions) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const data = {};
  expenses.forEach((t) => {
    data[t.category] = (data[t.category] || 0) + Number(t.amount);
  });
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  // Avoid division by zero for empty case
  const divisor = total || 1;
  return {
    total,
    slices: Object.entries(data).map(([cat, value], i) => ({
      category: cat,
      value,
      percent: value / divisor,
      color: COLORS[i % COLORS.length]
    }))
  };
}

/**
 * PUBLIC_INTERFACE
 * PieChart displays a pie of expenses by category, with total expense value shown next to chart.
 */
function PieChart({ transactions }) {
  const pie = getPieData(transactions);
  const pieData = pie.slices || [];
  const total = pie.total !== undefined ? pie.total : 0;

  // Prepare arcs
  let start = 0;
  const arcs = pieData.map((slice) => {
    const end = start + slice.percent * 2 * Math.PI;
    const large = slice.percent > 0.5 ? 1 : 0;
    const x1 = 60 + 50 * Math.cos(start - Math.PI / 2);
    const y1 = 60 + 50 * Math.sin(start - Math.PI / 2);
    const x2 = 60 + 50 * Math.cos(end - Math.PI / 2);
    const y2 = 60 + 50 * Math.sin(end - Math.PI / 2);
    const arc = (
      <path
        key={slice.category}
        d={`M60,60 L${x1},${y1} A50,50 0 ${large},1 ${x2},${y2} Z`}
        fill={slice.color}
        aria-label={slice.category}
      />
    );
    start = end;
    return arc;
  });

  return (
    <div className="piechart-box">
      <h4>Expenses by Category</h4>
      {/* Add a wrapper to show chart + total in a row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginBottom: pieData.length ? 8 : 0,
        justifyContent: "center"
      }}>
        <svg width="120" height="120" viewBox="0 0 120 120" className="piechart-svg">
          {arcs}
          <circle cx="60" cy="60" r="32" fill="var(--surface,#fff)" />
          <text
            x="60"
            y="65"
            textAnchor="middle"
            fontSize="1rem"
            fill="var(--primary)"
            fontWeight="bold"
          >
            {pieData.length ? 'Total' : 'No data'}
          </text>
        </svg>
        {/* Show total expense */}
        <div style={{
          minWidth: 76,
          textAlign: "center",
          fontWeight: 600,
          color: "var(--expense,#E74C3C)",
          fontSize: "1.14rem"
        }}>
          <span style={{ display: "block", fontSize: "1.04rem", color: "var(--text-secondary,#aaa)", fontWeight: 400, marginBottom: 2 }}>
            Total
          </span>
          ${total.toFixed(2)}
        </div>
      </div>
      {pieData.length > 0 && (
        <div className="piechart-legend">
          {pieData.map(d =>
            <div key={d.category} className="piechart-legitem">
              <span className="piechart-colorball" style={{ background: d.color }} />
              <span>{d.category}</span>
              <span className="piechart-legamt">${d.value.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PieChart;
