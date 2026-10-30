import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TransactionForm from './components/TransactionForm';
import DailyReport from './components/DailyReport';
import MonthlyReport from './components/MonthlyReport';
import TransactionHistory from './components/TransactionHistory';
import ReceiptModal from './components/ReceiptModal';
import FirebaseSettingsModal from './components/FirebaseSettingsModal';
import AuthPage from './components/AuthPage';
import {
  getCurrentUser,
  logoutUser
} from './services/auth';
import {
  getLocalTransactions,
  saveLocalTransactions,
  deduplicateTransactions
} from './services/storage';
import {
  initFirebase,
  addTransactionToRealtimeDatabase,
  deleteTransactionFromRealtimeDatabase,
  subscribeToTransactions,
  testFirebaseDirectConnection,
  uploadBulkToRealtimeDatabase
} from './services/firebase';
import { sampleTransactions } from './utils/sampleData';
import { formatCurrency } from './utils/formatters';
import { Database, AlertTriangle, Sparkles, Building2, Check, Zap, ExternalLink } from 'lucide-react';

const RULES_SNIPPET = `{
  "rules": {
    ".read": true,
    ".write": true
  }
}`;

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'daily' | 'monthly' | 'history'
  const [transactions, setTransactions] = useState([]);
  const [firebaseStatus, setFirebaseStatus] = useState('checking'); // 'connected' | 'permission_denied' | 'error' | 'checking'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [rulesCopied, setRulesCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyFirebase = async () => {
    const res = await testFirebaseDirectConnection();
    if (res.ok) {
      setFirebaseStatus('connected');
    } else if (res.isPermissionDenied) {
      setFirebaseStatus('permission_denied');
    } else {
      setFirebaseStatus('error');
    }
    return res;
  };

  const handleCopyRulesDirectly = () => {
    navigator.clipboard.writeText(RULES_SNIPPET);
    setRulesCopied(true);
    setTimeout(() => setRulesCopied(false), 3000);
  };

  const handleManualVerify = async () => {
    setIsVerifying(true);
    const res = await verifyFirebase();
    setIsVerifying(false);
  };

  // Auto-detect when user publishes rules in Firebase Console
  useEffect(() => {
    if (firebaseStatus !== 'permission_denied') return;
    const interval = setInterval(async () => {
      const res = await testFirebaseDirectConnection();
      if (res.ok) {
        setFirebaseStatus('connected');
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [firebaseStatus]);

  // Initialize transactions and Firebase on mount
  useEffect(() => {
    // 1. Load initial local cache
    const initialLocal = getLocalTransactions();
    setTransactions(initialLocal);

    // 2. Check live connection & rules
    verifyFirebase();

    // 3. Client SDK real-time subscription
    const { isConfigured } = initFirebase();
    if (isConfigured) {
      const unsubscribe = subscribeToTransactions(
        (remoteTransactions) => {
          setFirebaseStatus('connected');
          if (remoteTransactions && remoteTransactions.length > 0) {
            const clean = deduplicateTransactions(remoteTransactions);
            setTransactions(clean);
            saveLocalTransactions(clean);
          }
        },
        (err) => {
          if (err?.message && err.message.toLowerCase().includes('permission_denied')) {
            setFirebaseStatus('permission_denied');
          }
        }
      );
      return () => unsubscribe();
    }
  }, []);

  // Save new transaction
  const handleSaveTransaction = async (newTxData) => {
    setIsSubmitting(true);
    try {
      // Save directly to Firebase Realtime Database (throws if permission denied or error)
      const savedId = await addTransactionToRealtimeDatabase(newTxData);

      // Add to local state and storage
      const fullRecord = {
        id: savedId,
        ...newTxData,
        createdAt: new Date().toISOString(),
      };

      setTransactions((prev) => {
        // Prevent duplication if the record is already received via Firebase listener
        const withoutDuplicate = prev.filter(
          (t) => !(t.id && t.id === savedId) && !(t.receiptNo && t.receiptNo === newTxData.receiptNo)
        );
        const updated = deduplicateTransactions([fullRecord, ...withoutDuplicate]);
        saveLocalTransactions(updated);
        return updated;
      });
      return fullRecord;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id, receiptNo) => {
    if (firebaseStatus === 'connected') {
      try {
        await deleteTransactionFromRealtimeDatabase(id);
      } catch (err) {
        console.warn('Realtime Database delete error:', err);
      }
    }

    setTransactions((prev) => {
      const updated = prev.filter((tx) => tx.id !== id && (!receiptNo || tx.receiptNo !== receiptNo));
      saveLocalTransactions(updated);
      return updated;
    });
  };

  // Reset / reload sample data
  const handleReloadSampleData = () => {
    saveLocalTransactions(sampleTransactions);
    setTransactions(sampleTransactions);
    setIsSettingsOpen(false);
  };

  // Total overall spent
  const totalSpendOverall = transactions.reduce(
    (sum, t) => sum + (parseFloat(t.totalAmount) || 0),
    0
  );

  // Handle user logout
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // If user is not authenticated, show the Login & Registration page
  if (!currentUser) {
    return (
      <AuthPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('form');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        firebaseConfigured={firebaseStatus === 'connected'}
        onOpenSettings={() => setIsSettingsOpen(true)}
        transactions={transactions}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Firebase Permission Denied Warning Banner */}
      {firebaseStatus === 'permission_denied' && (
        <div className="no-print bg-amber-50 border-b border-amber-200 px-4 py-2.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 animate-pulse" />
              <span>
                <strong>Action Required:</strong> Firebase Realtime Database rules are locked (<code>Permission denied</code>). Transactions will be kept locally until rules are updated to allow writing.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://console.firebase.google.com/project/santacolumbus-fb5e0/database/santacolumbus-fb5e0-default-rtdb/rules"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <span>Open Rules in Firebase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={handleCopyRulesDirectly}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 transition flex items-center gap-1.5 shadow-sm"
              >
                {rulesCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <span>Copy Rules</span>
                )}
              </button>
              <button
                onClick={handleManualVerify}
                disabled={isVerifying}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-white" />
                <span>{isVerifying ? 'Verifying...' : 'Verify Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'form' && (
          <TransactionForm
            onSave={handleSaveTransaction}
            isSubmitting={isSubmitting}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'daily' && (
          <DailyReport
            transactions={transactions}
            onViewReceipt={(tx) => setSelectedReceipt(tx)}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyReport
            transactions={transactions}
            onViewReceipt={(tx) => setSelectedReceipt(tx)}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistory
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            onViewReceipt={(tx) => setSelectedReceipt(tx)}
          />
        )}
      </main>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          transaction={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Firebase Settings Modal */}
      <FirebaseSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigUpdated={(ok) => {
          if (ok) setFirebaseStatus('connected');
          else verifyFirebase();
        }}
        currentTransactions={transactions}
        onReloadSampleData={handleReloadSampleData}
      />

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-6 text-slate-500 text-xs text-center shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-auto px-1.5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] border border-blue-200">
              SCA
            </div>
            <span className="font-semibold text-slate-700">
              Santa Columbus Apartments MIS
            </span>
            <span>•</span>
            <span>Property Expense & Transaction Ledger</span>
          </div>

          <div className="flex items-center gap-4">
            <span>
              Cumulative Recorded Spend:{' '}
              <strong className="text-emerald-600 font-bold">
                {formatCurrency(totalSpendOverall)}
              </strong>
            </span>
            <span>•</span>
            <span>
              Records: <strong className="text-slate-800">{transactions.length}</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
