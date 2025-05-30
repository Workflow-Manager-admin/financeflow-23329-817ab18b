# FinanceFlow Cloud Sync: Step-by-Step User Instructions

This guide will walk you through enabling and using FinanceFlow's **cloud sync** feature, which securely backs up your financial data to the cloud and enables seamless restoration across devices. The process covers:

1. Ensuring your Firebase configuration is set
2. Enabling sync in the app
3. Logging in for cloud access
4. Confirming your data is backed up
5. Restoring your data after login/logout

---

## 1. Ensure Firebase Configuration Is Set

FinanceFlow uses [Firebase](https://firebase.google.com/) for cloud sync. Before using the sync feature:

- Make sure your Firebase project is set up and you have project configuration details (API key, Project ID, etc).
- Copy your Firebase config to a file named `firebase.config.js` in `financeflow/src/`:
    1. Duplicate the provided `firebase.sample.config.js` and rename it to `firebase.config.js`
    2. Fill in your actual Firebase credentials:
      ```js
      // financeflow/src/firebase.config.js
      export default {
        apiKey: '...',
        authDomain: '...',
        projectId: '...',
        storageBucket: '...',
        messagingSenderId: '...',
        appId: '...'
      };
      ```
- **Never** commit your real Firebase credentials to public version control systems.

**Note:** If this file is not set or filled with placeholders, cloud sync will not function.

---

## 2. Enable Cloud Sync In-App

1. Launch the FinanceFlow web application in your browser.
2. Navigate to the **Settings** tab (sidebar button with gear icon).
3. In Settings, find the toggle labeled **Enable Data Sync**.
4. Switch the toggle **on**.
    - You may optionally adjust other preferences here as needed.
5. Click **Save Preferences** to apply your changes.

---

## 3. Log In to Activate Cloud Sync

1. Once sync is enabled, look for the login panel in the top-right corner (shows "Login to Sync" if you’re not signed in).
2. Click **Login to Sync**.
3. You will be prompted with a Google login window. Sign in using your Google account (or another supported Firebase auth provider if enabled).
4. After successful login:
    - The panel updates to show your name and status: **Cloud Sync On**.
    - FinanceFlow now securely syncs your data with the cloud.
    - A toast notification will confirm that sync is active.

---

## 4. Confirm Your Data Has a Cloud Backup

- After logging in, all your profile, transactions, settings, savings goals, and budgets are automatically uploaded to your Firebase cloud account.
- Any changes you make while logged in (adding transactions, editing profile, etc.) are instantly backed up.
- To verify sync is working:
    1. Look for the status "Cloud Sync On" in the top-right panel.
    2. Try editing your data and verify that no warning or offline notice appears.
    3. If you log out or the connection fails, the app automatically falls back to device-local mode and will notify you.

---

## 5. Restore Synced State on New Device or After Login

- To retrieve your cloud-synced data on a new browser, fresh device, or after a logout:
    1. Open the FinanceFlow app and ensure **Enable Data Sync** is checked in Settings.
    2. Click **Login to Sync** and complete authentication.
    3. Upon successful login, all data previously synced with your cloud account is automatically downloaded and restored—your dashboard, transactions, savings, and preferences will appear as before.
- If you log out, FinanceFlow switches back to local storage, and cloud sync is paused.

---

## Troubleshooting & Tips

- **Cloud sync unavailable?**
    - Ensure your Firebase credentials are set and valid in `firebase.config.js`.
    - Check your internet connection.
    - Make sure you are logged into your Google/authorized account.
- **Data not matching?**
    - Cloud sync merges with local data on enable/log-in. If syncing after lots of local changes, use "Enable Sync" then log in to push your latest changes to the cloud.
- **Privacy:** Only you have access to your account's cloud data; logging in is required for cloud sync.

---

For additional help, visit the [FinanceFlow documentation](README.md) or contact your app administrator.
