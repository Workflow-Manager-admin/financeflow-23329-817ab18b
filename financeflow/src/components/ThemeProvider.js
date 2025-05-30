import React, { createContext, useEffect, useMemo, useState } from 'react';

// PUBLIC_INTERFACE
export const ThemeContext = createContext();

/**
 * ThemeProvider handles light/dark mode, CSS variable updates, and persistence.
 */
const LIGHT_THEME = {
  '--primary': '#6C2EBE',
  '--secondary': '#F5F6FA',
  '--accent': '#6C2EBE',
  '--background': '#F5F6FA',
  '--surface': '#FFFFFF',
  '--text-color': '#23243A',
  '--text-secondary': '#8A889A',
  '--income': '#22C55E',
  '--expense': '#E74C3C',
};

const DARK_THEME = {
  '--primary': '#6C2EBE',
  '--secondary': '#23243A',
  '--accent': '#BB86FC',
  '--background': '#23243A',
  '--surface': '#292B44',
  '--text-color': '#fff',
  '--text-secondary': '#fff',
  '--income': '#22C55E',
  '--expense': '#E74C3C',
};

function setThemeVars(themeVars) {
  Object.entries(themeVars).forEach(([k, v]) =>
    document.documentElement.style.setProperty(k, v)
  );
}

// PUBLIC_INTERFACE
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fflow-theme') || 'light';
  });

  // Sync CSS vars and localStorage
  useEffect(() => {
    setThemeVars(theme === 'dark' ? DARK_THEME : LIGHT_THEME);
    if (typeof theme === 'string' && theme) {
      localStorage.setItem('fflow-theme', theme);
      document.body.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (t) => setTheme(t),
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
