import React from 'react';
import './FilterBar.css';

// PUBLIC_INTERFACE
function FilterBar({ filters, setFilters, categories }) {
  return (
    <div className="filterbar">
      <select
        value={filters.category}
        onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
        aria-label="Filter by category"
      >
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input
        type="date"
        value={filters.from}
        onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
        aria-label="From date"
        placeholder="From"
      />
      <input
        type="date"
        value={filters.to}
        onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
        aria-label="To date"
        placeholder="To"
      />
    </div>
  );
}

export default FilterBar;
