//
// Firebase setup and utilities for FinanceFlow.
// This file initializes Firebase app, Auth and Firestore,
// and provides low-level helpers for cloud sync.
//

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

import firebaseConfig from './firebase.sample.config.js';

// Use project config (replace firebase.sample.config.js with real config for prod)
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

/**
 * Write user profile to Firestore.
 */
export async function saveCloudProfile(uid, profile) {
  await setDoc(userDocRef(uid), { profile }, { merge: true });
}

/**
 * Read user transactions from Firestore.
 */
export async function loadCloudTransactions(uid) {
  const docSnap = await getDoc(userDocRef(uid));
  return docSnap.exists() ? (docSnap.data().transactions || []) : [];
}

/**
 * Write transactions to Firestore.
 */
export async function saveCloudTransactions(uid, transactions) {
  await setDoc(userDocRef(uid), { transactions }, { merge: true });
}

/**
 * Read user settings from Firestore.
 */
export async function loadCloudSettings(uid) {
  const docSnap = await getDoc(userDocRef(uid));
  return docSnap.exists() ? (docSnap.data().settings || {}) : {};
}

/**
 * Write settings to Firestore.
 */
export async function saveCloudSettings(uid, settings) {
  await setDoc(userDocRef(uid), { settings }, { merge: true });
}

// PUBLIC_INTERFACE
/**
 * Read user savings goal from Firestore.
 */
export async function loadCloudGoal(uid) {
  const docSnap = await getDoc(userDocRef(uid));
  return docSnap.exists() ? (docSnap.data().goal || null) : null;
}

/**
 * Write user savings goal to Firestore.
 */
export async function saveCloudGoal(uid, goal) {
  await setDoc(userDocRef(uid), { goal }, { merge: true });
}

/**
 * Read budgets from Firestore.
 */
export async function loadCloudBudgets(uid) {
  const docSnap = await getDoc(userDocRef(uid));
  return docSnap.exists() ? (docSnap.data().budgets || {}) : {};
}

/**
 * Write budgets to Firestore.
 */
export async function saveCloudBudgets(uid, budgets) {
  await setDoc(userDocRef(uid), { budgets }, { merge: true });
}

/**
 * Subscribe to real-time updates (cloud changes).
 * Returns unsubscribe function.
 */
export function subscribeCloudUserDoc(uid, callback) {
  return onSnapshot(userDocRef(uid), (docSnap) => {
    callback(docSnap.exists() ? docSnap.data() : null);
  });
}
