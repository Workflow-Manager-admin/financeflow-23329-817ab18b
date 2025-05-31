import React from 'react';
import './FilterBar.css';

// PUBLIC_INTERFACE
function FilterBar({ filters, setFilters, categories }) {
  return (
    <div className="filterbar">
      {/* Filter by type: All, Income, Expense */}
      <select
        value={filters.type}
        onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
        aria-label="Filter by type"
      >
        <option value="All">All</option>
        <option value="Income">Income</option>
        <option value="Expense">Expense</option>
      </select>
      {/* Filter by category */}
      <select
        value={filters.category}
        onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
        aria-label="Filter by category"
      >
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {/* From date */}
      <input
        type="date"
        value={filters.from}
        onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
        aria-label="From date"
        placeholder="From"
        style={{ minWidth: 0 }}
      />
      {/* To date */}
      <input
        type="date"
        value={filters.to}
        onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
        aria-label="To date"
        placeholder="To"
        style={{ minWidth: 0 }}
      />
    </div>
  );
}

export default FilterBar;
