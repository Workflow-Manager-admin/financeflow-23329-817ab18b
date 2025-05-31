import React, { useState } from 'react';
import './PieChart.css';

const COLORS = [
  '#E87A41', '#6C2EBE', '#22C55E', '#E74C3C', '#F9D423',
  '#00B8D9', '#FF8B4D', '#8247E5', '#3498db', '#ff5c8a'
];

function getAvailableMonthsAndYears(transactions) {
  const monthYearSet = new Set();
  transactions.forEach(t => {
    if (t.date) {
      // Format: YYYY-MM
      const [y, m] = t.date.split('-');
      monthYearSet.add(`${y}-${m}`);
    }
  });
  const sorted = Array.from(monthYearSet).sort().reverse();
  const yearSet = new Set(sorted.map(v => v.split('-')[0]));
  return {
    months: sorted,
    years: Array.from(yearSet).sort().reverse()
  };
}

function getPieData(transactions) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const data = {};
  expenses.forEach((t) => {
    // Map legacy "Salary" to "Rent/House"
    const cat = t.category === 'Salary' ? 'Rent/House' : t.category;
    data[cat] = (data[cat] || 0) + Number(t.amount);
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
 * PieChart displays a pie of expenses by category, with total expense value shown next to chart, filtered by month and year using dropdowns above the chart. UI matches FinanceFlow style.
 */
function PieChart({ transactions, currencySymbol = '$' }) {
  // Filter state: month/year
  const { months, years } = getAvailableMonthsAndYears(transactions);
  // Default to most recent available month
  const [selectedYear, setSelectedYear] = useState(months.length > 0 ? months[0].split('-')[0] : new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(months.length > 0 ? months[0].split('-')[1] : (String(new Date().getMonth() + 1).padStart(2, "0")));

  // Filter transactions for selected month and year
  const filteredTxs = React.useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    const ym = `${selectedYear}-${selectedMonth}`;
    return transactions.filter(
      t => t.type === 'expense' && t.date && t.date.slice(0, 7) === ym
    );
  }, [transactions, selectedYear, selectedMonth]);
  const pie = getPieData(filteredTxs);
  const pieData = pie.slices || [];
  const total = pie.total !== undefined ? pie.total : 0;

  // For UI: build month options for the selected year (show only months that exist in data for that year)
  const monthsInYear = months.filter(m => m.startsWith(selectedYear)).map(m => m.split('-')[1]);
  // Month labels
  const MONTH_LABELS = {
    "01": "January", "02": "February", "03": "March", "04": "April", "05": "May",
    "06": "June", "07": "July", "08": "August", "09": "September", "10": "October",
    "11": "November", "12": "December"
  };

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
      <div style={{
        marginBottom: 12,
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Expenses by Category</h4>
        <div style={{ display: "flex", gap: 9 }}>
          <select
            style={{
              fontSize: "1em",
              padding: "5px 7px",
              borderRadius: 6,
              border: "1px solid var(--secondary, #ececec)",
              background: "var(--surface, #fff)",
              color: "var(--text-color,#23243A)",
              outline: "none"
            }}
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            aria-label="Filter by month"
          >
            {monthsInYear.map(m => (
              <option key={m} value={m}>{MONTH_LABELS[m] || m}</option>
            ))}
          </select>
          <select
            style={{
              fontSize: "1em",
              padding: "5px 7px",
              borderRadius: 6,
              border: "1px solid var(--secondary, #ececec)",
              background: "var(--surface, #fff)",
              color: "var(--text-color,#23243A)",
              outline: "none"
            }}
            value={selectedYear}
            onChange={e => {
              setSelectedYear(e.target.value);
              // Auto-select latest month with data for new year
              const monthsInNewYear = months.filter(x => x.startsWith(e.target.value));
              if (monthsInNewYear.length > 0) {
                setSelectedMonth(monthsInNewYear[0].split('-')[1]);
              }
            }}
            aria-label="Filter by year"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
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
        {/* Show total expense next to the chart for context */}
        <div style={{
          minWidth: 88,
          textAlign: "center",
          fontWeight: 700,
          color: "var(--expense,#E74C3C)",
          fontSize: "1.16rem",
          letterSpacing: "0.01em"
        }}>
          <span style={{ display: "block", fontSize: "1.075rem", color: "var(--text-secondary,#aaa)", fontWeight: 500, marginBottom: 2 }}>
            Total Expense
          </span>
          <span data-testid="expense-total" style={{fontSize:"1.21rem"}}>
            {currencySymbol}{total.toFixed(2)}
          </span>
        </div>
      </div>
      {pieData.length > 0 && (
        <div className="piechart-legend">
          {pieData.map(d =>
            <div key={d.category} className="piechart-legitem">
              <span className="piechart-colorball" style={{ background: d.color }} />
              <span>{d.category}</span>
              <span className="piechart-legamt">{currencySymbol}{d.value.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PieChart;
