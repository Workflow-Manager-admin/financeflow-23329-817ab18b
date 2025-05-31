import React, { useMemo } from "react";

/**
 * Minimal sparkline implementation (SVG, no dependencies).
 * PUBLIC_INTERFACE
 */
function Sparkline({ data, color = "#6C2EBE", width = 100, height = 28, strokeWidth = 2 }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 6) + 3;
    const y = height - 3 - ((val - min) / ((max - min) || 1)) * (height - 12);
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible", display: "block" }}>
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      {/* Optional dot on last value */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * (width - 6) + 3}
        cy={height - 3 - ((data[data.length - 1] - min) / ((max - min) || 1)) * (height - 12)}
        r="2.8" fill={color}
      />
    </svg>
  );
}

// PUBLIC_INTERFACE
/**
 * SpendingTrendsWithInsights analyzes transaction data to reveal spending trends,
 * top categories, and generates human-friendly insights.
 */
function SpendingTrendsWithInsights({ transactions, currencySymbol = "$" }) {
  // Only "expense" type transactions, normalized category
  const byMonth = useMemo(() => {
    const map = {};
    transactions
      .filter(t => t.type === "expense")
      .forEach(tx => {
        const [year, month] = tx.date ? tx.date.split("-") : ["", ""];
        const ym = year && month ? `${year}-${month}` : "";
        if (!ym) return;
        if (!map[ym]) map[ym] = [];
        map[ym].push(tx);
      });
    return map;
  }, [transactions]);

  // Find current & previous period, group by category
  const periods = useMemo(() => {
    const all = Object.keys(byMonth).sort();
    if (all.length === 0) return {};
    const current = all[all.length - 1];
    const prev = all.length > 1 ? all[all.length - 2] : null;

    const aggregate = period => {
      const txs = byMonth[period] || [];
      const total = txs.reduce((sum, t) => sum + Number(t.amount), 0);
      const byCat = {};
      txs.forEach(t => {
        const cat = t.category === "Salary" ? "Rent/House" : t.category;
        if (!byCat[cat]) byCat[cat] = 0;
        byCat[cat] += Number(t.amount);
      });
      // Sort categories by spend
      const topCategories = Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => ({ category: cat, amount: amt }));
      return { total, topCategories, txs };
    };

    return {
      all,
      current,
      prev,
      currentAgg: aggregate(current),
      prevAgg: prev ? aggregate(prev) : null,
    };
  }, [byMonth]);

  // Sparkline data (last 6 months spending trend)
  const sparklineData = useMemo(() => {
    const months = periods.all || [];
    if (!months.length) return [];
    return months.slice(-6).map(ym => {
      const txs = byMonth[ym] || [];
      return txs.reduce((sum, t) => sum + Number(t.amount), 0);
    });
  }, [periods, byMonth]);

  // Plain language insights
  const insights = useMemo(() => {
    const { current, prev, currentAgg, prevAgg } = periods;
    if (!current || !currentAgg) return ["Not enough data yet."];
    const lines = [];

    // Period labels
    function formatPeriod(ym) {
      if (!ym) return "";
      const [year, m] = ym.split("-");
      const monthNames = [
        "January","February","March","April","May","June","July",
        "August","September","October","November","December"
      ];
      if (!m || !year) return ym;
      return `${monthNames[Number(m) - 1] || m} ${year}`;
    }

    if (prev && prevAgg) {
      const change = currentAgg.total - prevAgg.total;
      const pct = prevAgg.total > 0 ? (change / prevAgg.total) * 100 : 0;
      if (change > 0.01) {
        lines.push(
          `Spending increased by ${currencySymbol}${Math.abs(change).toLocaleString(undefined, {minimumFractionDigits:2})} (${pct.toFixed(1)}%) compared to ${formatPeriod(prev)}.`
        );
      } else if (change < -0.01) {
        lines.push(
          `Spending decreased by ${currencySymbol}${Math.abs(change).toLocaleString(undefined, {minimumFractionDigits:2})} (${Math.abs(pct).toFixed(1)}%) compared to ${formatPeriod(prev)}.`
        );
      } else {
        lines.push(`Total spending is unchanged compared to ${formatPeriod(prev)}.`);
      }
    } else {
      lines.push(`Only 1 period of expense data available.`);
    }

    // Top categories for this period
    if (currentAgg.topCategories.length) {
      const topCats = currentAgg.topCategories.slice(0, 2);
      if (topCats.length === 1) {
        lines.push(
          `Top spending category: ${topCats[0].category} (${currencySymbol}${topCats[0].amount.toLocaleString(undefined, {minimumFractionDigits:2})}).`
        );
      } else if (topCats.length > 1) {
        lines.push(
          `Top categories: ${topCats
            .map(
              c =>
                `${c.category} (${currencySymbol}${c.amount.toLocaleString(undefined, {minimumFractionDigits:2})})`
            )
            .join(" and ")}.`
        );
      }
    }
    return lines;
  }, [periods, currencySymbol]);

  return (
    <div className="dashboard-insights-panel" style={{
      marginTop: 11,
      padding: '18px 17px',
      background: 'var(--secondary,#fcfbff)',
      borderRadius: 10,
      minHeight: 42,
      boxShadow: '0 1px 9px rgba(108,64,190,0.04)',
      fontSize: '1.04em',
      color: 'var(--primary,#6C2EBE)',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '24px'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: 2, fontSize: "1.11em" }}>
          <span role="img" aria-label="Trend">📈</span> <b>Spending Trends & Insights</b>
        </div>
        <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 16, color: "var(--text-secondary)" }}>
          {insights.map((line, i) => (
            <li key={i} style={{ marginBottom: 2, lineHeight: 1.5 }}>{line}</li>
          ))}
        </ul>
      </div>
      <div style={{ minWidth: 85, maxWidth: 120, alignSelf: "center" }}>
        <Sparkline data={sparklineData} color="#6C2EBE" />
        <div style={{
          textAlign: "right", fontSize: "0.86em", color: "var(--text-secondary)", marginTop: 3, letterSpacing: ".01em"
        }}>
          last {Math.max(2, sparklineData.length)} mo.
        </div>
      </div>
    </div>
  );
}

export default SpendingTrendsWithInsights;
