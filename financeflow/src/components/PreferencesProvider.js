import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const STORAGE_SETTINGS = 'fflow-settings-v1';
const STORAGE_SETTINGS_TAB = 'fflow-settings-tab-v1'; // For toggles in Settings page (notifications)
const PROFILE_STORAGE_KEY = 'fflow-profile-v1';
const DEFAULT_LANGUAGE = 'English';
const DEFAULT_CURRENCY = 'USD';

const PreferencesContext = createContext();

/**
 * PUBLIC_INTERFACE
 * Provides app-wide language, currency, and notifications preferences, with sync to localStorage.
 */
export function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  // --- Don't initialize currency up front. We'll sync from profile/settings on mount below ---

  const [currency, setCurrency] = useState(() => {
    // Prefer currency from profile, fallback to settings, fallback to default
    try {
      const profile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));
      if (profile && profile.currency && typeof profile.currency === "string") {
        return profile.currency;
      }
    } catch {}
    try {
      const settings = JSON.parse(localStorage.getItem(STORAGE_SETTINGS));
      if (settings && settings.currency && typeof settings.currency === "string") {
        return settings.currency;
      }
    } catch {}
    return DEFAULT_CURRENCY;
  });

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

  // Sync: load language/currency on first mount and whenever profile/settings currency changes
  useEffect(() => {
    // Load language (not in profile, only settings)
    const stored = localStorage.getItem(STORAGE_SETTINGS);
    if (stored) {
      try {
        const obj = JSON.parse(stored);
        if (obj.language) setLanguage(obj.language);
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
    // On mount (and on any profile/settings currency update), always recompute and resolve correct currency:
    const checkAndSyncCurrency = () => {
      let selected = null;
      try {
        const profile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));
        if (profile && profile.currency && typeof profile.currency === "string") {
          selected = profile.currency;
        }
      } catch {}
      if (!selected) {
        try {
          const settings = JSON.parse(localStorage.getItem(STORAGE_SETTINGS));
          if (settings && settings.currency && typeof settings.currency === "string") {
            selected = settings.currency;
          }
        } catch {}
      }
      if (!selected) selected = DEFAULT_CURRENCY;
      setCurrency(cur => cur !== selected ? selected : cur);
    };
    // Listen for storage events for currency updates in other tabs/windows
    window.addEventListener("storage", checkAndSyncCurrency);
    checkAndSyncCurrency();

    return () => {
      window.removeEventListener("storage", checkAndSyncCurrency);
    }
    // eslint-disable-next-line
  }, []);

  // Global listener for profile or settings updates; always pull latest currency on change
  useEffect(() => {
    // Listen for explicit changes to either localStorage profile or settings currency
    const checkCurrency = () => {
      let selected = null;
      try {
        const profile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));
        if (profile && profile.currency && typeof profile.currency === "string") {
          selected = profile.currency;
        }
      } catch {}
      if (!selected) {
        try {
          const settings = JSON.parse(localStorage.getItem(STORAGE_SETTINGS));
          if (settings && settings.currency && typeof settings.currency === "string") {
            selected = settings.currency;
          }
        } catch {}
      }
      if (!selected) selected = DEFAULT_CURRENCY;
      setCurrency(cur => cur !== selected ? selected : cur);
    };
    // Use polling interval as well as storage for reliability (cheap, safe because no backend)
    const intv = setInterval(checkCurrency, 800);
    return () => clearInterval(intv);
  }, []);

  // On any change to in-context currency, propagate it back to both settings and (if profile exists) update there too
  useEffect(() => {
    // Save to settings (always)
    let newSettings = {};
    try {
      newSettings = JSON.parse(localStorage.getItem(STORAGE_SETTINGS)) || {};
    } catch { newSettings = {}; }
    if (newSettings.currency !== currency) {
      localStorage.setItem(
        STORAGE_SETTINGS,
        JSON.stringify({ ...newSettings, currency })
      );
    }
    // Save to profile (non-destructive: only patch currency if profile exists)
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.currency !== currency) {
          obj.currency = currency;
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(obj));
        }
      }
    } catch {/* no-op */}
  }, [currency]);


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
      // PUBLIC_INTERFACE for global real-time updates
      setCurrency: (cur) => {
        // Update context immediately, persistence is handled in effect
        setCurrency(cur);
        // Optionally: sub-persist handled in effect above.
      },
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
