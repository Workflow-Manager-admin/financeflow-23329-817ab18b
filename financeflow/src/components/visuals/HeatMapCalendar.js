import React, { useMemo, useState } from 'react';
import './HeatMapCalendar.css';

/**
 * PUBLIC_INTERFACE
 * Interactive HeatMapCalendar component.
 * Shows expense intensity per day in a calendar heatmap style.
 * Hover (desktop) or click (mobile) on a date cell shows a detail popup for transactions.
 * Designed for dashboard integration.
 */
function getMonthGrid(year, month) {
  // Returns all cells for a 7xN grid for the calendar UI for a given month
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const firstDayIdx = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = lastOfMonth.getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthDays = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

  let days = [];
  for (let i = 0; i < firstDayIdx; i++) {
    const d = prevMonthDays - (firstDayIdx - i - 1);
    let dateObj = new Date(prevMonthYear, prevMonth, d);
    days.push({
      dateObj,
      inMonth: false,
      dateStr: dateObj.toISOString().slice(0, 10),
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    let dateObj = new Date(year, month, d);
    days.push({
      dateObj,
      inMonth: true,
      dateStr: dateObj.toISOString().slice(0, 10),
    });
  }
  let totalCells = days.length;
  let trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    let dateObj = new Date(year, month + 1, i);
    days.push({
      dateObj,
      inMonth: false,
      dateStr: dateObj.toISOString().slice(0, 10),
    });
  }
  return days;
}

// Color scale for heatmap intensity
function getIntensityColor(amount, max) {
  if (amount === 0) return 'var(--heatmap-low,#ececed)';
  const scale = amount / (max || 1); // avoid div by zero
  if (scale < 0.18) return 'var(--heatmap-verylow,#f2f0fb)';
  if (scale < 0.34) return 'var(--heatmap-low,#e5daf7)';
  if (scale < 0.55) return 'var(--heatmap-med,#c4b3ed)';
  if (scale < 0.80) return 'var(--heatmap-high,#9660e6)';
  return 'var(--heatmap-extreme,#6c2ebe)';
}

function getHeatMapData(transactions = [], year, month) {
  // Returns object: { [ISOdate]: sum of expenses }
  const map = {};
  for (let t of transactions) {
    if (t.type !== 'expense') continue; // Only expenses
    if (!t.date) continue;
    const d = new Date(t.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    map[t.date] = (map[t.date] || 0) + Number(t.amount);
  }
  return map;
}

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function HeatMapCalendar({ transactions = [], onDateClick, currencySymbol = '$' }) {
  const today = new Date();
  // Month/year state
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [popupAnchor, setPopupAnchor] = useState(null);

  // Pull available months with data (to allow dropdown nav)
  const availableMonths = useMemo(() => {
    const set = new Set(
      transactions
        .filter(t => t.type === 'expense' && t.date)
        .map(t => t.date.slice(0, 7))
    );
    let months = Array.from(set).sort().reverse();
    // List as [{year, monthIdx, label}]
    return months.map(ym => {
      const [y, m] = ym.split('-');
      return {
        year: +y,
        monthIdx: +m - 1,
        label: `${y} ${new Date(+y, +m - 1, 1).toLocaleString(undefined, { month: 'long' })}`,
      };
    });
  }, [transactions]);

  // Expense mapping for the selected month/year
  const heatMapData = useMemo(() => {
    return getHeatMapData(transactions, selectedYear, selectedMonth);
  }, [transactions, selectedYear, selectedMonth]);

  // For coloring: maximum expense for any date in the current view
  const maxAmount = useMemo(
    () => Math.max(...Object.values(heatMapData), 0.1), // set 0.1 so scale never /0
    [heatMapData]
  );

  // Month days grid
  const gridDays = useMemo(
    () => getMonthGrid(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  // Quick filter to show transaction details for popup
  const transactionsByDate = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (t.type === 'expense' && t.date) {
        if (!map[t.date]) map[t.date] = [];
        map[t.date].push(t);
      }
    });
    return map;
  }, [transactions]);

  // Handlers
  function handleCellEnter(dateStr, ev) {
    setHoveredDate(dateStr);
    setPopupAnchor(ev.currentTarget);
  }
  function handleCellLeave() {
    setHoveredDate(null);
    setPopupAnchor(null);
  }
  function handleCellClick(dateStr, ev) {
    setHoveredDate(dateStr);
    setPopupAnchor(ev.currentTarget);
    if (typeof onDateClick === 'function') onDateClick(dateStr, transactionsByDate[dateStr] || []);
  }
  function handleMonthChange(e) {
    const v = e.target.value;
    const [y, m] = v.split('-');
    setSelectedYear(+y);
    setSelectedMonth(+m);
    setHoveredDate(null);
    setPopupAnchor(null);
  }

  return (
    <div className="heatmapcard-box">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7, gap: 9 }}>
        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.11em' }}>
          Transaction HeatMap
        </h4>
        {availableMonths.length > 0 && (
          <select
            style={{
              fontSize: '0.99em',
              padding: '5px 7px',
              borderRadius: 6,
              border: '1px solid var(--secondary, #ececec)',
              background: 'var(--surface, #fff)',
              color: 'var(--text-color,#23243A)'
            }}
            onChange={handleMonthChange}
            value={selectedYear + '-' + selectedMonth}
            aria-label="Jump to month"
          >
            {availableMonths.map(m =>
              <option key={m.label} value={m.year + '-' + m.monthIdx}>{m.label}</option>
            )}
          </select>
        )}
      </div>
      <table className="heatmapcalendar-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {weekdayLabels.map(wd => (
              <th key={wd} style={{ fontWeight: 500, color: 'var(--primary,#6C2EBE)', paddingBottom: 5, fontSize: '0.99em', background: 'none', border: 'none', textAlign: 'center' }}>{wd}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {
            Array.from({ length: Math.ceil(gridDays.length / 7) }, (_, w) => (
              <tr key={w}>
                {gridDays.slice(w * 7, w * 7 + 7).map((cell, i) => {
                  const amount = heatMapData[cell.dateStr] || 0;
                  const isToday = cell.dateStr === (new Date().toISOString().slice(0, 10));
                  return (
                    <td
                      key={cell.dateStr}
                      className="heatmapcalendar-cell"
                      style={{
                        background: cell.inMonth
                          ? getIntensityColor(amount, maxAmount)
                          : 'var(--secondary,#f4f4f6)',
                        opacity: cell.inMonth ? 1 : 0.45,
                        cursor: cell.inMonth && amount > 0 ? 'pointer' : 'default',
                        border: isToday ? '1.5px solid var(--primary,#6C2EBE)' : 'none',
                        borderRadius: 7,
                        minWidth: 38,
                        height: 40,
                        position: 'relative',
                        transition: 'background 0.15s'
                      }}
                      tabIndex={cell.inMonth ? 0 : -1}
                      aria-label={cell.inMonth ? `Day ${cell.dateObj.getDate()} expense: ${currencySymbol}${amount.toFixed(2)}` : undefined}
                      onMouseEnter={cell.inMonth && amount > 0 ? ev => handleCellEnter(cell.dateStr, ev) : undefined}
                      onMouseLeave={cell.inMonth ? handleCellLeave : undefined}
                      onFocus={cell.inMonth && amount > 0 ? ev => handleCellEnter(cell.dateStr, ev) : undefined}
                      onBlur={handleCellLeave}
                      onClick={cell.inMonth && amount > 0 ? ev => handleCellClick(cell.dateStr, ev) : undefined}
                    >
                      <span style={{
                        fontWeight: isToday ? 700 : 500,
                        fontSize: '1.10em',
                        color: isToday ? 'var(--primary,#6C2EBE)' : cell.inMonth ? 'var(--text-color)' : 'var(--text-secondary)',
                        background: isToday ? 'rgba(108,46,190,0.09)' : 'none',
                        borderRadius: 4,
                        display: 'block',
                        textAlign: 'center'
                      }}>{cell.dateObj.getDate()}</span>
                      {amount > 0 && (
                        <span
                          className="heatmapcalendar-dot"
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 5,
                            display: 'inline-block',
                            background: 'var(--expense,#E74C3C)',
                            position: 'absolute',
                            left: '62%',
                            top: 5
                          }}
                        ></span>
                      )}
                      {/* Popup for this cell */}
                      {hoveredDate === cell.dateStr && popupAnchor && (
                        <div
                          className="heatmapcalendar-popup"
                          style={{
                            position: 'absolute',
                            zIndex: 10,
                            top: 35,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'var(--surface, #fff)',
                            boxShadow: '0 4px 20px rgba(60,42,150,0.17)',
                            borderRadius: 9,
                            minWidth: 192,
                            padding: 14,
                            color: 'var(--text-color)',
                            fontSize: '0.98em',
                            lineHeight: 1.34,
                            border: '1.5px solid var(--border-color,#ecebea)'
                          }}
                          onMouseLeave={handleCellLeave}
                        >
                          <strong>
                            {cell.dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </strong>
                          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0', maxHeight: 140, overflowY: 'auto' }}>
                            {(transactionsByDate[cell.dateStr] || []).map((tx, idx) => (
                              <li key={idx} style={{ borderBottom: '1px solid #ececec', marginBottom: 3, paddingBottom: 2 }}>
                                <span style={{ color: 'var(--expense,#E74C3C)', fontWeight: 600 }}>{currencySymbol}{Number(tx.amount).toFixed(2)}</span>
                                {tx.category && <span style={{ color: '#333', marginLeft: 7 }}>{tx.category}</span>}
                                {tx.description && <span style={{ color: 'var(--text-secondary)', marginLeft: 7 }}>– {tx.description}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          }
        </tbody>
      </table>
      {/* Heatmap Color Legend */}
      <div style={{ display: 'flex', gap: 13, marginTop: 13, justifyContent: 'center', fontSize: '0.98em', color: 'var(--text-secondary)' }}>
        <span>Expense Intensity:</span>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          <span className="heatmapcolorball" style={{ background: getIntensityColor(5, maxAmount) }} />Low
        </span>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          <span className="heatmapcolorball" style={{ background: getIntensityColor(0.25 * maxAmount, maxAmount) }} />Med
        </span>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          <span className="heatmapcolorball" style={{ background: getIntensityColor(maxAmount, maxAmount) }} />High
        </span>
      </div>
      {Object.keys(heatMapData).length === 0 &&
        <div style={{ color: 'var(--text-secondary)', marginTop: 17, textAlign: 'center' }}>
          No expenses found for this month.
        </div>
      }
    </div>
  );
}

export default HeatMapCalendar;
