const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, deleteApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DATABASE_URL = 'https://santacolumbus-fb5e0-default-rtdb.firebaseio.com';
const PROJECT_ID = 'santacolumbus-fb5e0';
const PROJECT_NUMBER = '912433211538';

// Look for serviceAccountKey.json in common places
function findServiceAccountPath() {
  const possiblePaths = [
    path.join(__dirname, '..', 'serviceAccountKey.json'),
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(process.cwd(), 'serviceAccountKey.json'),
    path.join(process.cwd(), 'serviceAccount.json')
  ];
  return possiblePaths.find((p) => fs.existsSync(p)) || null;
}

let db = null;
let currentApp = null;
let initError = null;

function initFirebaseAdmin(accountObj = null) {
  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      deleteApp(existingApps[0]);
    }

    let credential = null;

    if (accountObj && accountObj.project_id) {
      credential = cert(accountObj);
    } else {
      const saPath = findServiceAccountPath();
      if (saPath) {
        console.log(`Found service account file at: ${saPath}`);
        const raw = fs.readFileSync(saPath, 'utf8');
        const parsed = JSON.parse(raw);
        credential = cert(parsed);
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = cert(parsed);
      }
    }

    if (credential) {
      currentApp = initializeApp({
        credential,
        databaseURL: DATABASE_URL,
        projectId: PROJECT_ID,
      });
      db = getDatabase(currentApp);
      initError = null;
      console.log('Firebase Admin initialized with service account credentials successfully!');
      return true;
    } else {
      currentApp = initializeApp({
        databaseURL: DATABASE_URL,
        projectId: PROJECT_ID,
      });
      db = getDatabase(currentApp);
      initError = null;
      console.log('Firebase Admin initialized with databaseURL (serviceAccountKey.json pending).');
      return true;
    }
  } catch (err) {
    console.error('Firebase Admin init error:', err.message);
    initError = err.message;
    db = null;
    return false;
  }
}

// Initial attempt
initFirebaseAdmin();

// --- API ROUTES ---

// Health & Status
app.get('/api/status', async (req, res) => {
  const saPath = findServiceAccountPath();
  let status = 'error';
  let statusError = initError;
  if (db) {
    try {
      await db.ref('transactions').limitToFirst(1).once('value');
      status = 'connected';
      statusError = null;
    } catch (err) {
      statusError = err.message;
    }
  }
  res.json({
    status,
    databaseURL: DATABASE_URL,
    projectId: PROJECT_ID,
    projectNumber: PROJECT_NUMBER,
    hasServiceAccount: !!saPath,
    serviceAccountPath: saPath ? path.basename(saPath) : null,
    error: statusError,
  });
});

// Save Service Account Key from UI
app.post('/api/save-service-account', async (req, res) => {
  try {
    const keyData = req.body;
    if (!keyData || !keyData.project_id) {
      return res.status(400).json({ error: 'Invalid service account key JSON. Missing project_id.' });
    }

    const targetPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    fs.writeFileSync(targetPath, JSON.stringify(keyData, null, 2), 'utf8');

    const success = initFirebaseAdmin(keyData);
    if (success) {
      try {
        await db.ref('transactions').limitToFirst(1).once('value');
        res.json({
          success: true,
          message: 'serviceAccountKey.json saved and database access verified!',
        });
      } catch (err) {
        res.status(500).json({ error: 'Key loaded, but Firebase database access failed: ' + err.message });
      }
    } else {
      res.status(500).json({ error: 'Saved key file, but Firebase Admin init failed: ' + initError });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to write service account key: ' + err.message });
  }
});

// GET all transactions
app.get('/api/transactions', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not initialized: ' + (initError || 'Please provide serviceAccountKey.json') });
  }

  try {
    const snapshot = await db.ref('transactions').once('value');
    const val = snapshot.val();
    if (!val) {
      return res.json([]);
    }

    // Convert object { key: { ...data } } to array sorted newest first
    const list = Object.entries(val).map(([key, data]) => ({
      id: key,
      ...data,
    })).sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

    res.json(list);
  } catch (err) {
    console.error('Error fetching transactions from Firebase:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST new transaction
app.post('/api/transactions', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not initialized: ' + (initError || 'Please provide serviceAccountKey.json') });
  }

  try {
    const txData = req.body;
    const newRef = db.ref('transactions').push();
    const payload = {
      ...txData,
      id: newRef.key,
      createdAt: new Date().toISOString(),
    };

    await newRef.set(payload);
    res.status(201).json(payload);
  } catch (err) {
    console.error('Error writing transaction to Firebase:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE transaction
app.delete('/api/transactions/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not initialized.' });
  }

  try {
    const { id } = req.params;
    await db.ref(`transactions/${id}`).remove();
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting transaction from Firebase:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST bulk upload (e.g. sample data or local transactions)
app.post('/api/transactions/bulk', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not initialized.' });
  }

  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Empty or invalid transactions array' });
    }

    let count = 0;
    for (const tx of transactions) {
      const newRef = db.ref('transactions').push();
      await newRef.set({
        ...tx,
        id: newRef.key,
        createdAt: new Date().toISOString(),
      });
      count++;
    }

    res.json({ success: true, count });
  } catch (err) {
    console.error('Error bulk uploading transactions:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Santa Columbus Apartments MIS Firebase Backend running on http://localhost:${PORT}`);
  console.log(`Connected to Firebase Database: ${DATABASE_URL}`);
  console.log(`Project ID: ${PROJECT_ID}`);
});
