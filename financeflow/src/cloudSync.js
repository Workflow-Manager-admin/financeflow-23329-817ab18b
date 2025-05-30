// Cloud/local sync helpers for FinanceFlow: syncs profile, settings, transactions.
// Handles fallback to localStorage and merge logic.
// Depends on src/firebase.js for cloud access.

import {
  getCurrentUser,
  loadCloudProfile, saveCloudProfile,
  loadCloudSettings, saveCloudSettings,
  loadCloudTransactions, saveCloudTransactions,
  loadCloudGoal, saveCloudGoal,
  loadCloudBudgets, saveCloudBudgets,
} from './firebase';

// --- LocalStorage keys used by app ---
const LS_PROFILE = 'fflow-profile-v1';
const LS_SETTINGS = 'fflow-settings-v1';
const LS_TRANSACTIONS = 'fflow-transactions-v1';
const LS_GOAL = 'fflow-savings-goal-v1';
const LS_BUDGETS = 'fflow-budgets-v1';

/**
 * Loads ALL user data from the best available source (cloud or local).
 * Tries Firebase, falls back to localStorage.
 */
export async function loadAppState() {
  const user = getCurrentUser();
  if (user) {
    // Cloud state
    try {
      const [profile, settings, transactions, goal, budgets] = await Promise.all([
        loadCloudProfile(user.uid),
        loadCloudSettings(user.uid),
        loadCloudTransactions(user.uid),
        loadCloudGoal(user.uid),
        loadCloudBudgets(user.uid),
      ]);
      return {
        cloudMode: true,
        profile: profile || loadLocalProfile(),
        settings: settings || loadLocalSettings(),
        transactions: transactions || loadLocalTransactions(),
        goal: goal || loadLocalGoal(),
        budgets: budgets || loadLocalBudgets(),
      };
    } catch (err) {
      // Network error, fallback local
      return {
        cloudMode: false,
        profile: loadLocalProfile(),
        settings: loadLocalSettings(),
        transactions: loadLocalTransactions(),
        goal: loadLocalGoal(),
        budgets: loadLocalBudgets(),
      };
    }
  }
  // Not signed in → Use localStorage
  return {
    cloudMode: false,
    profile: loadLocalProfile(),
    settings: loadLocalSettings(),
    transactions: loadLocalTransactions(),
    goal: loadLocalGoal(),
    budgets: loadLocalBudgets(),
  };
}

/**
 * Push all local state to cloud for the current user.
 */
export async function syncLocalStateToCloud(profile, settings, transactions, goal, budgets) {
  const user = getCurrentUser();
  if (!user) return false;
  try {
    await Promise.all([
      saveCloudProfile(user.uid, profile),
      saveCloudSettings(user.uid, settings),
      saveCloudTransactions(user.uid, transactions),
      saveCloudGoal(user.uid, goal),
      saveCloudBudgets(user.uid, budgets),
    ]);
    return true;
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
/**
 * Push cloud state to overwrite localStorage.
 */
export function syncCloudStateToLocal(profile, settings, transactions) {
  if (profile) localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
  if (settings) localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  if (transactions) localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(transactions));
}

export function loadLocalProfile() {
  try {
    return JSON.parse(localStorage.getItem(LS_PROFILE)) || {};
  } catch {
    return {};
  }
}
export function loadLocalSettings() {
  try {
    return JSON.parse(localStorage.getItem(LS_SETTINGS)) || {};
  } catch {
    return {};
  }
}
export function loadLocalTransactions() {
  try {
    return JSON.parse(localStorage.getItem(LS_TRANSACTIONS)) || [];
  } catch {
    return [];
  }
}

export function loadLocalGoal() {
  try {
    return JSON.parse(localStorage.getItem(LS_GOAL)) || null;
  } catch {
    return null;
  }
}
export function loadLocalBudgets() {
  try {
    return JSON.parse(localStorage.getItem(LS_BUDGETS)) || {};
  } catch {
    return {};
  }
}

// PUBLIC_INTERFACE
/**
 * Decide if sync should be enabled: only when user is logged in AND app settings allow it.
 * Example: call after login or on settings change.
 */
export function shouldSyncCloud(syncSetting) {
  const user = getCurrentUser();
  return !!(user && syncSetting);
}
