import React, { useContext, useState } from 'react';
import './Sidebar.css';
import { ThemeContext } from './ThemeProvider';

// Icon SVGs for navigation
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="10" width="7" height="11" rx="2" /><rect x="3" y="13" width="7" height="8" rx="2" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <rect x="4" y="6" width="16" height="2" rx="1" /><rect x="4" y="11" width="16" height="2" rx="1" />
      <rect x="4" y="16" width="16" height="2" rx="1" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <rect x="3" y="4" width="18" height="17" rx="3" /><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5"/><rect x="7" y="10" width="2" height="2" rx="1"/>
      <rect x="11" y="10" width="2" height="2" rx="1"/><rect x="15" y="10" width="2" height="2" rx="1"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <circle cx="12" cy="9" r="4"/><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.7-.3c-.6.2-1.3.4-2 .4s-1.4-.2-2-.4a1.7 1.7 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.7c-.2-.6-.4-1.3-.4-2s.2-1.4.4-2a1.7 1.7 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1c.5.5 1.2.5 1.7.3.6-.2 1.3-.4 2-.4s1.4.2 2 .4c.6.2 1.2.2 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1c-.5.5-.5 1.2-.3 1.7.2.6.4 1.3.4 2s-.1 1.4-.3 2z"/>
    </svg>
  )
};

const navItems = [
  { label: 'Home', icon: 'dashboard', route: '/' },
  { label: 'Expenses', icon: 'list', route: '/expenses' },
  { label: 'Calendar', icon: 'calendar', route: '/calendar' },
  { label: 'Profile', icon: 'user', route: '/profile' },
];

/**
 * PUBLIC_INTERFACE
 * Sidebar layout for FinanceFlow with logo, nav, and settings.
 */
function Sidebar({ currentRoute, onNavigate, collapsed, onToggle }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  // Responsive toggle state (if controlled at Sidebar level)
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const sidebarCollapsed = typeof collapsed === "boolean" ? collapsed : internalCollapsed;
  const setSidebarCollapsed = typeof onToggle === 'function' ? onToggle : setInternalCollapsed;

  // For current nav highlight, accept currentRoute (e.g. "/expenses"), fallback home "/"
  const routeMatch = r => (r === "/" && currentRoute === "/") || (r !== "/" && currentRoute?.startsWith(r));

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-upper">
        <div className="sidebar-logo-row">
          <span className="sidebar-logo-mark">{/* stylized logo mark */}💸</span>
          {!sidebarCollapsed && (
            <span className="sidebar-title">Finance<span className="flow-accent">Flow</span></span>
          )}
          <button
            className="sidebar-toggle-btn"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Show menu" : "Hide menu"}>
            <span>{sidebarCollapsed ? "☰" : "×"}</span>
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item =>
            <button
              key={item.route}
              className={`sidebar-nav-item${routeMatch(item.route) ? ' active' : ''}`}
              onClick={() => onNavigate(item.route)}
              aria-label={item.label}
              tabIndex={0}>
              <span className="sidebar-nav-icon">{icons[item.icon]}</span>
              {!sidebarCollapsed && <span className="sidebar-nav-label">{item.label}</span>}
            </button>
          )}
        </nav>
      </div>
      <div className="sidebar-lower">
        <button
          className={`sidebar-nav-item sidebar-settings${routeMatch('/settings') ? ' active' : ''}`}
          onClick={() => onNavigate('/settings')}
          aria-label="Settings"
          tabIndex={0}>
          <span className="sidebar-nav-icon">{icons.settings}</span>
          {!sidebarCollapsed && <span className="sidebar-nav-label">Settings</span>}
        </button>
        {!sidebarCollapsed && (
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? (
              <span role="img" aria-label="sun">🌞</span>
            ) : (
              <span role="img" aria-label="moon">🌙</span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
