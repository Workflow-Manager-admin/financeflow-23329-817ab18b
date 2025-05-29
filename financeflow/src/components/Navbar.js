import React, { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import './Navbar.css';

// PUBLIC_INTERFACE
function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <div className="logo">
          <span className="logo-symbol">*</span> FinanceFlow
        </div>
        <button
          aria-label="Toggle dark/light mode"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <span role="img" aria-label="sun">🌞</span>
          ) : (
            <span role="img" aria-label="moon">🌙</span>
          )}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
