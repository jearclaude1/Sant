// Firebase Realtime Database Client Integration for Santa Columbus Apartments
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  remove,
  onValue,
  serverTimestamp
} from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyCmJgHHdlBzH2NeTXQQECNCs82yvqD5jiM",
  authDomain: "santacolumbus-fb5e0.firebaseapp.com",
  databaseURL: "https://santacolumbus-fb5e0-default-rtdb.firebaseio.com",
  projectId: "santacolumbus-fb5e0",
  storageBucket: "santacolumbus-fb5e0.firebasestorage.app",
  messagingSenderId: "912433211538",
  appId: "1:912433211538:web:99a9f51838d1c6c8c61e4b",
  measurementId: "G-TY6GHSLGQ6"
};

export const SANTA_COLUMBUS_FIREBASE = firebaseConfig;

let currentApp = null;
let currentDb = null;

// Initialize Firebase
export const initFirebase = () => {
  try {
    if (getApps().length === 0) {
      currentApp = initializeApp(firebaseConfig);
    } else {
      currentApp = getApp();
    }
    currentDb = getDatabase(currentApp, firebaseConfig.databaseURL);
    return { app: currentApp, db: currentDb, isConfigured: true };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return { app: null, db: null, isConfigured: false, error: err.message };
  }
};

// Check if Realtime Database rules allow reading/writing
export const testFirebaseDirectConnection = async () => {
  try {
    const res = await fetch(`${firebaseConfig.databaseURL}/transactions.json?shallow=true`);
    const data = await res.json().catch(() => null);

    if (res.ok) {
      return { ok: true, message: 'Connected and accessible' };
    }
    if (data && data.error) {
      const isPermissionDenied = data.error.toLowerCase().includes('permission denied');
      return {
        ok: false,
        error: data.error,
        isPermissionDenied,
      };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
  return { ok: false, error: 'Cannot connect to database URL' };
};

const COLLECTION_NAME = 'transactions';

/**
 * Add transaction directly to Firebase Realtime Database
 */
export const addTransactionToRealtimeDatabase = async (transactionData) => {
  const { db, isConfigured } = initFirebase();

  // Method 1: Client Web SDK (set / push)
  if (isConfigured && db) {
    try {
      const transactionRef = push(ref(db, COLLECTION_NAME));
      await set(transactionRef, {
        ...transactionData,
        id: transactionRef.key,
        createdAt: serverTimestamp(),
      });
      return transactionRef.key;
    } catch (sdkErr) {
      if (sdkErr.message && sdkErr.message.toLowerCase().includes('permission_denied')) {
        throw new Error(
          'Firebase Permission Denied: Your database rules are locked. In Firebase Console > Realtime Database > Rules, set ".read": true and ".write": true, then click Publish.'
        );
      }
      console.warn('SDK write attempt note, trying REST fallback:', sdkErr.message);
    }
  }

  // Method 2: Direct REST API Fallback
  try {
    const restUrl = `${firebaseConfig.databaseURL}/${COLLECTION_NAME}.json`;
    const res = await fetch(restUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...transactionData,
        createdAt: new Date().toISOString(),
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data && data.name) {
      return data.name;
    }

    if (data && data.error) {
      if (data.error.toLowerCase().includes('permission denied')) {
        throw new Error(
          'Firebase Permission Denied: Your database rules are locked. In Firebase Console > Realtime Database > Rules, set ".read": true and ".write": true, then click Publish.'
        );
      }
      throw new Error(`Firebase Error: ${data.error}`);
    }
  } catch (restErr) {
    if (restErr.message && restErr.message.includes('Firebase Permission Denied')) {
      throw restErr;
    }
    throw new Error(
      `Failed to write to Firebase: ${restErr.message}`
    );
  }

  throw new Error('Could not save to Firebase Realtime Database.');
};

export const updateTransactionInRealtimeDatabase = async (id, transactionData) => {
  const { db, isConfigured } = initFirebase();

  if (isConfigured && db) {
    try {
      await update(ref(db, `${COLLECTION_NAME}/${id}`), {
        ...transactionData,
        updatedAt: serverTimestamp(),
      });
      return id;
    } catch (sdkErr) {
      console.warn('SDK update attempt note, trying REST fallback:', sdkErr.message);
    }
  }

  const restUrl = `${firebaseConfig.databaseURL}/${COLLECTION_NAME}/${id}.json`;
  const res = await fetch(restUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...transactionData,
      updatedAt: new Date().toISOString(),
    }),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(`Failed to update transaction in Firebase: ${data?.error || res.statusText}`);
  }
  return id;
};

/**
 * Delete a transaction from Realtime Database
 */
export const deleteTransactionFromRealtimeDatabase = async (id) => {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      await remove(ref(db, `${COLLECTION_NAME}/${id}`));
      return;
    } catch (e) {
      console.warn('SDK delete error, trying REST:', e);
    }
  }

  await fetch(`${firebaseConfig.databaseURL}/${COLLECTION_NAME}/${id}.json`, {
    method: 'DELETE',
  });
};

/**
 * Real-time listener for database changes
 */
export const subscribeToTransactions = (onSuccess, onError) => {
  const { db, isConfigured } = initFirebase();
  if (!isConfigured || !db) {
    return () => {};
  }

  try {
    const unsubscribe = onValue(
      ref(db, COLLECTION_NAME),
      (snapshot) => {
        const values = snapshot.val() || {};
        // Deduplicate records from Firebase by voucher number (receiptNo) or id
        const uniqueMap = new Map();
        Object.entries(values).forEach(([id, transaction]) => {
          const item = { id, ...transaction };
          const key = (item.receiptNo || id || '').trim();
          if (key && !uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          } else if (!key) {
            uniqueMap.set(id, item);
          }
        });

        const transactions = Array.from(uniqueMap.values())
          .sort((left, right) => new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime());
        onSuccess(transactions);
      },
      (error) => {
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
};

/**
 * Bulk upload transactions into Realtime Database
 */
export const uploadBulkToRealtimeDatabase = async (records) => {
  let count = 0;
  // Deduplicate before uploading
  const seen = new Set();
  const uniqueRecords = (records || []).filter((r) => {
    const key = (r.receiptNo || r.id || '').trim();
    if (key) {
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  });

  for (const record of uniqueRecords) {
    const { id, ...dataToUpload } = record;
    const restUrl = `${firebaseConfig.databaseURL}/${COLLECTION_NAME}.json`;
    const res = await fetch(restUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...dataToUpload,
        createdAt: new Date().toISOString(),
      }),
    });
    if (res.ok) count++;
  }
  return count;
};

// User Authentication Storage in Firebase Realtime Database
const USERS_COLLECTION = 'users';

export const saveUserToFirebase = async (userData) => {
  const cleanPhone = (userData.telephone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) return;

  const dataToSave = {
    username: userData.username,
    telephone: userData.telephone,
    password: userData.password,
    role: 'user',
    adminRequested: Boolean(userData.adminRequested),
    verified: true,
    updatedAt: new Date().toISOString()
  };

  try {
    const restUrl = `${firebaseConfig.databaseURL}/${USERS_COLLECTION}/${cleanPhone}.json`;
    await fetch(restUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave)
    });
  } catch (e) {
    console.warn('Firebase user save note:', e.message);
  }
};

export const fetchUsersFromFirebase = async () => {
  try {
    const restUrl = `${firebaseConfig.databaseURL}/${USERS_COLLECTION}.json`;
    const res = await fetch(restUrl);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        return Object.values(data);
      }
    }
  } catch (e) {
    console.warn('Firebase users fetch note:', e.message);
  }
  return [];
};
