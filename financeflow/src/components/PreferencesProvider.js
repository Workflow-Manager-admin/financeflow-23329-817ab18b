import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const STORAGE_SETTINGS = 'fflow-settings-v1';
const DEFAULT_LANGUAGE = 'English';
const DEFAULT_CURRENCY = 'USD';

const PreferencesContext = createContext();

/**
 * PUBLIC_INTERFACE
 * Provides app-wide language and currency preferences, with sync to localStorage.
 */
export function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  // Load from localStorage (first render)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_SETTINGS);
    if (stored) {
      try {
        const obj = JSON.parse(stored);
        if (obj.language) setLanguage(obj.language);
        if (obj.currency) setCurrency(obj.currency);
      } catch {/* ignore parse errors */}
    }
  }, []);

  // Write to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem(
      STORAGE_SETTINGS,
      JSON.stringify({ language, currency })
    );
  }, [language, currency]);

  const value = useMemo(
    () => ({
      language,
      currency,
      setLanguage,
      setCurrency,
      setPreferences: ({ language, currency }) => {
        // allow partial updates
        if (language) setLanguage(language);
        if (currency) setCurrency(currency);
      },
      languageOptions: ['English', 'Spanish', 'French', 'German', 'Chinese'],
      currencyOptions: ['USD', 'EUR', 'GBP', 'INR', 'CNY'],
    }),
    [language, currency]
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
