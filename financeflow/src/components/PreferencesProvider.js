import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const STORAGE_SETTINGS = 'fflow-settings-v1';
const STORAGE_SETTINGS_TAB = 'fflow-settings-tab-v1'; // For toggles in Settings page (notifications)
const DEFAULT_LANGUAGE = 'English';
const DEFAULT_CURRENCY = 'USD';

const PreferencesContext = createContext();

/**
 * PUBLIC_INTERFACE
 * Provides app-wide language, currency, and notifications preferences, with sync to localStorage.
 */
export function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  // Notifications preference (default to true if no setting present)
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      // PATCH: Accept both tab and global settings for migration/robustness
      // Prefer STORAGE_SETTINGS_TAB, but fallback to STORAGE_SETTINGS for legacy support
      const tabVal = JSON.parse(localStorage.getItem(STORAGE_SETTINGS_TAB));
      if (typeof tabVal?.notificationsEnabled === "boolean") return tabVal.notificationsEnabled;
      const globalVal = JSON.parse(localStorage.getItem(STORAGE_SETTINGS));
      if (typeof globalVal?.notificationsEnabled === "boolean") return globalVal.notificationsEnabled;
      return true;
    } catch {
      return true;
    }
  });

  // Sync: load language/currency on first mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_SETTINGS);
    if (stored) {
      try {
        const obj = JSON.parse(stored);
        if (obj.language) setLanguage(obj.language);
        if (obj.currency) setCurrency(obj.currency);
      } catch {/* ignore parse errors */}
    }
    // Also try to load notification pref from tab settings (covers SettingsView 'save')
    const tabStored = localStorage.getItem(STORAGE_SETTINGS_TAB);
    if (tabStored) {
      try {
        const obj = JSON.parse(tabStored);
        if (typeof obj.notificationsEnabled === "boolean") {
          setNotificationsEnabled(obj.notificationsEnabled);
        }
      } catch {/* ignore parse errors */}
    }
  }, []);

  // Write to localStorage whenever updated (for language, currency)
  useEffect(() => {
    localStorage.setItem(
      STORAGE_SETTINGS,
      JSON.stringify({ language, currency })
    );
  }, [language, currency]);

  // Write to tab settings storage on change of notifications (for two-way sync)
  useEffect(() => {
    let prev = {};
    try { prev = JSON.parse(localStorage.getItem(STORAGE_SETTINGS_TAB)) || {}; } catch { prev = {}; }
    localStorage.setItem(
      STORAGE_SETTINGS_TAB,
      JSON.stringify({
        ...prev,
        notificationsEnabled
      })
    );
  }, [notificationsEnabled]);

  // Map ISO code to symbol
  const currencySymbolMap = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CNY: '¥',
  };
  const currencySymbol = currencySymbolMap[currency] || '$';

  const value = useMemo(
    () => ({
      language,
      currency,
      currencySymbol,
      setLanguage,
      setCurrency,
      notificationsEnabled,
      setNotificationsEnabled,
      setPreferences: ({ language, currency, notificationsEnabled }) => {
        // allow partial updates
        if (language) setLanguage(language);
        if (currency) setCurrency(currency);
        if (typeof notificationsEnabled === "boolean") setNotificationsEnabled(notificationsEnabled);
      },
      languageOptions: ['English', 'Spanish', 'French', 'German', 'Chinese'],
      currencyOptions: ['USD', 'EUR', 'GBP', 'INR', 'CNY'],
    }),
    [language, currency, currencySymbol, notificationsEnabled]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 * Hook to consume preferences.
 */
export const usePreferences = () => useContext(PreferencesContext);

export default PreferencesProvider;
