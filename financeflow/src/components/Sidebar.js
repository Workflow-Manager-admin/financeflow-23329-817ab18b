import React, { useContext, useState } from 'react';
import './Sidebar.css';
import { ThemeContext } from './ThemeProvider';

/**
 * Minimal, modern, and visually consistent SVG icon set for Sidebar navigation.
 * Each icon is outlined, has rounded corners or endpoints, and defaults to "none" fill
 * except where visually intended. The settings (gear) icon is a clean, accessible SVG.
 */
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="2" />
      <rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="10" width="7" height="11" rx="2" />
      <rect x="3" y="13" width="7" height="8" rx="2" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <line x1="8" y1="2.7" x2="8" y2="7.4" />
      <line x1="16" y1="2.7" x2="16" y2="7.4" />
      <rect x="7" y="10" width="2.3" height="2.3" rx="0.8"/>
      <rect x="11" y="10" width="2.3" height="2.3" rx="0.8"/>
      <rect x="15" y="10" width="2.3" height="2.3" rx="0.8"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="9" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  ),
  settings: (
    // Minimal, modern SVG gear icon for Settings, matching Sidebar icon style
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15c.17.4.41.8.7 1.13.23.28.22.7-.03.95l-.93.93a.68.68 0 0 1-.95.03 6.49 6.49 0 0 1-1.13-.7c-.36-.23-.8-.32-1.22-.19-.42.13-.81.31-1.24.38-.17.03-.34.03-.52.03s-.35 0-.52-.03c-.43-.07-.82-.25-1.24-.38-.42-.13-.86-.04-1.22.19a6.49 6.49 0 0 1-1.13.7.68.68 0 0 1-.95-.03l-.93-.93a.68.68 0 0 1-.03-.95c.29-.33.53-.73.7-1.13.18-.4.15-.86-.05-1.22-.2-.36-.34-.76-.37-1.19a4.45 4.45 0 0 1 0-1.04c.03-.43.17-.83.37-1.19.2-.36.23-.82.05-1.22-.17-.4-.41-.8-.7-1.13a.68.68 0 0 1 .03-.95l.93-.93a.68.68 0 0 1 .95-.03c.33.29.73.53 1.13.7.4.18.86.15 1.22-.05.36-.2.76-.34 1.19-.37.17-.03.34-.03.52-.03s.35 0 .52.03c.43.03.83.17 1.19.37.36.2.82.23 1.22.05.4-.17.8-.41 1.13-.7a.68.68 0 0 1 .95.03l.93.93c.25.25.26.67.03.95a6.49 6.49 0 0 1-.7 1.13c-.23.36-.32.8-.19 1.22.13.42.31.81.38 1.24.03.17.03.34.03.52s0 .35-.03.52c-.07.43-.25.82-.38 1.24-.13.42-.04.86.19 1.22z" />
    </svg>
  ),
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
              // Modern outlined sun icon for light mode (heroicons style)
              <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              // Modern outlined crescent-moon for dark mode (heroicons style)
              <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
