//
// Firebase setup and utilities for FinanceFlow.
// This file initializes Firebase app, Auth and Firestore,
// and provides low-level helpers for cloud sync.
//
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// --- Replace these with your real config in deployment/cloud --- //
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// PUBLIC_INTERFACE
/**
 * Get the current user from Auth.
 */
export function getCurrentUser() {
  return auth.currentUser;
}

// PUBLIC_INTERFACE
/**
 * Listen to auth state changes (login/logout)
 * @param {function} callback Receives user (or null) on any change.
 */
export function onUserAuthChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

// PUBLIC_INTERFACE
/**
 * Simple Google Sign-in workflow.
 */
export function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

// PUBLIC_INTERFACE
/**
 * Simple logout.
 */
export function logout() {
  return signOut(auth);
}

// PUBLIC_INTERFACE
/**
 * Get a user root doc ref in Firestore.
 */
export function userDocRef(uid) {
  return doc(db, 'users', uid);
}

// PUBLIC_INTERFACE
/**
 * Read user profile from Firestore.
 */
export async function loadCloudProfile(uid) {
  const docSnap = await getDoc(userDocRef(uid));
  return docSnap.exists() ? docSnap.data().profile : null;
}

// PUBLIC_INTERFACE
/**
 * Write user profile to Firestore.
 */
export async function saveCloudProfile(uid, profile) {
  await setDoc(userDocRef(uid), { profile }, { merge: true });
}

// PUBLIC_INTERFACE
/**
 * Read user transactions from Firestore.
 */
export async function loadCloudTransactions(uid) {
  const docSnap = await getDoc(userDocRef(uid));
  return docSnap.exists() ? (docSnap.data().transactions || []) : [];
}

// PUBLIC_INTERFACE
/**
 * Write transactions to Firestore.
 */
export async function saveCloudTransactions(uid, transactions) {
  await setDoc(userDocRef(uid), { transactions }, { merge: true });
}

// PUBLIC_INTERFACE
/**
 * Read user settings from Firestore.
 */
export async function loadCloudSettings(uid) {
  const docSnap = await getDoc(userDocRef(uid));
  return docSnap.exists() ? (docSnap.data().settings || {}) : {};
}

// PUBLIC_INTERFACE
/**
 * Write settings to Firestore.
 */
export async function saveCloudSettings(uid, settings) {
  await setDoc(userDocRef(uid), { settings }, { merge: true });
}

// PUBLIC_INTERFACE
/**
 * Subscribe to real-time updates (cloud changes).
 * Returns unsubscribe function.
 */
export function subscribeCloudUserDoc(uid, callback) {
  return onSnapshot(userDocRef(uid), (docSnap) => {
    callback(docSnap.exists() ? docSnap.data() : null);
  });
}
