import React, { useMemo, useState } from "react";
import "./HeatMapCalendar.css";

/**
 * A calendar-style heatmap for transaction data, showing daily spending intensity.
 * Clicking on a day opens a popup listing transactions for that day.
 * Colored by total (absolute) daily spending.
 *
 * Expects props:
 *   transactions: Array of {date, amount, category, type, description}
 *   month (optional): {year: number, month: 0-11} // defaults to current month
 *   currencySymbol: string (optional)
 */
// PUBLIC_INTERFACE
function HeatMapCalendar({ transactions = [], month, currencySymbol = "$" }) {
  // Compute which month to show
  const today = new Date();
  const year = month && typeof month.year === "number" ? month.year : today.getFullYear();
  const monthIdx = month && typeof month.month === "number" ? month.month : today.getMonth();

  // Compute days grid for this month (include previous/next overflow for calendar rows)
  function getMonthGrid(year, month) {
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const firstDayIdx = firstOfMonth.getDay();
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
    // trailing days to fill last week
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

  // Group transactions by date, ignore types except for coloring
  const txByDate = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      if (tx.date) {
        if (!map[tx.date]) map[tx.date] = [];
        map[tx.date].push(tx);
      }
    });
    return map;
  }, [transactions]);

  const gridDays = useMemo(
    () => getMonthGrid(year, monthIdx),
    [year, monthIdx]
  );

  // Absolute spending sum per day (expenses only; can be customized)
  const spendingByDate = useMemo(() => {
    const out = {};
    transactions.forEach((tx) => {
      if (!tx.date) return;
      // Only sum expenses for intensity, or could sum all outflows
      if (tx.type === "expense") {
        out[tx.date] = (out[tx.date] || 0) + Math.abs(Number(tx.amount) || 0);
      }
    });
    return out;
  }, [transactions]);

  // Compute scale for color intensity: min/max nonzero spending
  const maxSpending = useMemo(() => Math.max(...Object.values(spendingByDate), 0), [spendingByDate]);
  const minSpending = useMemo(() => {
    const vals = Object.values(spendingByDate).filter(v => v > 0);
    return vals.length ? Math.min(...vals) : 0;
  }, [spendingByDate]);

  // For highlighting clicked cell
  const [selectedDate, setSelectedDate] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  // Helpers for colors (using a purple-red scale, with zero = neutral)
  function getCellColor(date) {
    const amt = spendingByDate[date] || 0;
    if (amt <= 0) return "var(--heatmap-empty, #eaeaf5)";
    if (maxSpending === minSpending) {
      // only one value, use mid color
      return "var(--heatmap-max, #6C2EBE)";
    }
    // Interpolate: pale --> full color
    const pct = (amt - minSpending) / (maxSpending - minSpending);
    // Scale from light purple to full accent
    if (pct < 0.2) return "rgba(108, 46, 190, 0.13)"; // lightest
    if (pct < 0.4) return "rgba(108, 46, 190, 0.23)";
    if (pct < 0.7) return "rgba(108, 46, 190, 0.47)";
    if (pct < 0.9) return "rgba(108, 46, 190, 0.71)";
    return "var(--heatmap-max, #6C2EBE)";
  }

  // Handle popover logic
  const handleCellClick = (e, dayCell) => {
    if (!dayCell.inMonth) return;
    setSelectedDate(dayCell.dateStr);
    // Find nearest position relative to cell
    const rect = e.target.getBoundingClientRect();
    const top = rect.top + window.scrollY + rect.height + 8;
    const left = rect.left + window.scrollX + rect.width / 2;
    setPopupPos({ top, left });
  };
  const closePopup = () => setSelectedDate(null);

  // List for popup
  const popupTxList = selectedDate ? (txByDate[selectedDate] || []) : [];

  // Weekday labels
  const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  // Month/year heading
  const monthLabel = new Date(year, monthIdx, 1).toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <section className="heatmap-calendar-view">
      <div className="heatmap-calendar-container">
        <div className="heatmap-calendar-header">
          <h2 className="title" style={{margin: 0, fontSize: "1.28em"}}>{monthLabel}</h2>
          <p style={{margin: "4px 0 18px", color: "var(--text-secondary)", fontSize: "0.93em"}}>
            <span>Each square shows daily spending intensity.<br/>
            Click a day to view transactions.</span>
          </p>
        </div>
        <table className="heatmap-calendar-table" aria-label="Transaction heatmap" role="grid">
          <thead>
            <tr>
              {weekdayLabels.map((wd, i) => (
                <th key={i}>{wd}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({length: Math.ceil(gridDays.length/7)}).map((_, weekIdx) => (
              <tr key={weekIdx}>
                {gridDays.slice(weekIdx*7, weekIdx*7+7).map((cell, i) => {
                  const cellColor = getCellColor(cell.dateStr);
                  const isToday = cell.dateStr === today.toISOString().slice(0,10);
                  const txList = txByDate[cell.dateStr] || [];
                  return (
                    <td
                      key={cell.dateStr}
                      className={
                        "heatmap-calendar-cell" +
                        (cell.inMonth ? " in-month" : " out-month") +
                        (isToday ? " today" : "")
                      }
                      tabIndex={cell.inMonth ? 0 : -1}
                      aria-label={`${
                        cell.inMonth ? cell.dateObj.getDate() : ""
                      }`}
                      style={{
                        background: cell.inMonth ? cellColor : "var(--secondary,#f4f4f6)",
                        color: isToday ? "var(--primary,#6C2EBE)" : "",
                        border: isToday
                          ? "2px solid var(--primary,#6C2EBE)"
                          : "1px solid var(--border-color,#cccccc02)",
                        borderRadius: i === 0 || i === 6 ? 10 : 4,
                        position: "relative"
                      }}
                      onClick={e => handleCellClick(e, cell)}
                    >
                      <span>{cell.inMonth ? cell.dateObj.getDate() : ""}</span>
                      {txList.length > 0 && (
                        <span className="heatmap-dot" title={`${txList.length} transaction${txList.length>1?"s":""}`}></span>
                      )}
                      {spendingByDate[cell.dateStr] > 0 ? (
                        <span className="heatmap-amount"
                          title={`Total: ${currencySymbol}${Number(spendingByDate[cell.dateStr]).toLocaleString()}`}>
                          {/* Inline badge for sum */}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Popup for transaction list on selected day */}
      {selectedDate && (
        <div className="heatmap-popup" style={{
          top: popupPos.top,
          left: popupPos.left,
        }}>
          <div className="heatmap-popup-inner">
            <button className="heatmap-popup-close" onClick={closePopup} aria-label="Close">&times;</button>
            <h4 style={{marginTop:0, fontWeight:600}}>
              {new Date(selectedDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year:"numeric" })}
            </h4>
            <ul className="heatmap-popup-list">
              {popupTxList.length === 0 ? (
                <li className="heatmap-popup-empty">No transactions.</li>
              ) : popupTxList.map((tx, idx) => (
                <li key={idx}>
                  <span className="heatmap-popup-type"
                    style={{
                      color: tx.type === "income"
                        ? "var(--income,#22C55E)"
                        : "var(--expense,#E74C3C)",
                    }}
                  >
                    {tx.type === "income" ? "+" : "-"}
                  </span>
                  {currencySymbol}
                  <b style={{marginRight:4}}>{Number(tx.amount).toLocaleString()}</b>
                  <span title={tx.category} style={{
                    color: "#555",
                    fontWeight: 500,
                    marginRight: tx.description ? 4 : 0
                  }}>
                    {tx.category}
                  </span>
                  {tx.description && (
                    <span className="heatmap-popup-desc" title={tx.description} style={{ color: "#777", fontStyle: "italic" }}>– {tx.description}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="heatmap-popup-backdrop" onClick={closePopup} tabIndex={-1} aria-label="Close popup"/>
        </div>
      )}
    </section>
  );
}

export default HeatMapCalendar;
