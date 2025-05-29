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
    // Modern, outlined gear/cog icon
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.7-.3c-.6.2-1.3.4-2 .4s-1.4-.2-2-.4a1.7 1.7 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.7c-.2-.6-.4-1.3-.4-2s.2-1.4.4-2a1.7 1.7 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1c.5.5 1.2.5 1.7.3.6-.2 1.3-.4 2-.4s1.4.2 2 .4c.6.2 1.2.2 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1c-.5.5-.5 1.2-.3 1.7.2.6.4 1.3.4 2s-.1 1.4-.3 2z"/>
    </svg>
  )
};

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', route: '/' },
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
          {/* Minimal, beautiful SVG logo */}
          <span className="sidebar-logo-svg" aria-label="FinanceFlow logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{display: 'block'}}>
              <defs>
                <linearGradient id="fflow-logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6C2EBE"/>
                  <stop offset="1" stopColor="#E87A41"/>
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="14" fill="url(#fflow-logo-gradient)" />
              <path d="M10.8 18.7c.8 2.1 2.7 3.5 5.2 3.5 2.8 0 5-1.8 5-4.3 0-2.7-2.2-3.5-4.5-4.1-2.2-.5-3.2-1-3.2-2.3 0-1.2 1.1-2.1 2.8-2.1 1.7 0 2.8.7 3.2 2.1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="16" cy="16" r="14" fill="none" stroke="#fff" strokeWidth=".8" opacity=".12"/>
            </svg>
          </span>
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
              // Sun SVG for light mode
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
                <g stroke="currentColor" strokeWidth="1.5">
                  <line x1="11" y1="2" x2="11" y2="4"/>
                  <line x1="11" y1="18" x2="11" y2="20"/>
                  <line x1="2" y1="11" x2="4" y2="11"/>
                  <line x1="18" y1="11" x2="20" y2="11"/>
                  <line x1="5" y1="5" x2="6.4" y2="6.4"/>
                  <line x1="16" y1="16" x2="17" y2="17"/>
                  <line x1="5" y1="17" x2="6.4" y2="15.6"/>
                  <line x1="16" y1="6" x2="17" y2="5"/>
                </g>
              </svg>
            ) : (
              // Moon SVG for dark mode
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M14.6 18c-2.7 0-5.2-1.8-6.2-4.5-.7-2 .1-4.1 2.2-6.2.4-.4.4-1 0-1.3C9.7 5.4 8.2 4 6.3 3.6c-.7-.2-1.2.6-.8 1.1A9 9 0 0020 11.1c0 4.6-3.6 6.9-5.4 6.9z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
