# Persistent Login/Profile Strategy for FinanceFlow

## 1. Overview

FinanceFlow aims for a seamless, user-friendly experience. Core data (transactions, settings, theme) is stored per-device using localStorage. User profile (which minimally includes name, and optionally email, currency, language, etc.) should be captured on first run. 

## 2. LocalStorage-Based Persistence

- **First Run**: If profile info is not present in localStorage, prompt the user with a modal dialog to enter name (and optionally, email, preferred currency, language).
- **Persistence**: Upon completion, profile data is saved to `localStorage` under a key such as `fflow-profile-v1`.
- **Restoring Profile**: On reload/app start, profile is loaded directly from localStorage; no external authentication is needed.
- **Logout**: Optionally, we can allow profile reset/clear for demo/testing.

---

**Dashboard Tab: Data Loss Analysis**

- If dashboard info is lost *only* when navigating between tabs, but is restored on browser refresh, this implies the state is correctly loaded from localStorage.
- If dashboard info is lost after reloading or navigating (and no JavaScript errors/corruption), likely something or some code is clearing `localStorage`.
- No current code in Expenses/Calendar/Settings/Sidebar clears the Dashboard's storage keys.

**Recommendation:**
- If you want persistence only on this device/browser, the codebase is already handling this appropriately (localStorage-level).
- If you require data to sync across browsers/devices or recover after clearing browser data, a backend (e.g., Firebase) is required. See section below.
- User data stays private ("on-device", privacy friendly).
- Instant load, fast prototyping.

### Cons
- Data is browser/device-local only—users lose profile if they clear browser storage, switch devices, or use incognito/private mode.
- Not suitable for real multi-device sync.

## 3. Backend-Integrated Model (OPTIONAL)

In a real multi-device or cloud-synced scenario:
- **Authentication**: Use third-party sign-in (Google, email/password, Firebase Auth, etc.).
- **Profile**: Store profile information in a backend database (e.g., Firebase, Supabase, custom server).
- **Persistence**: User's authentication token is stored in browser (using cookies/localStorage), and profile is fetched on app load.

### Pros
- True multi-device sync.
- Accounts not lost on device/browser reset.
- Can support email notifications.

### Cons
- Requires backend infra, user account system.
- More complex onboarding and data privacy considerations.

## 4. Current Implementation Plan

For this version:
- Prompt for profile (name, optional email/currency/lang) on first run if not present in localStorage.
- Store and display profile on dashboard and settings.
- (WIP comment: If cloud sync is ever enabled, authentication and profile fetch logic will be switched to talk to backend.)

## 5. Integration

- The login/profile modal will be shown before onboarding if required.
- Profile info will be shown in a compact card/section on dashboard and within Settings.
- Profile edit/reset is allowed via Settings.

---
**Further enhancements**: Optional backend/Firebase integration can be shipped later without breaking the localStorage approach, allowing smooth upgrade/migration paths.
