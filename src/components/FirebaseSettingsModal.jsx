import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  UploadCloud,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Flame,
  Check,
  Zap
} from 'lucide-react';
import {
  testFirebaseDirectConnection,
  uploadBulkToRealtimeDatabase,
  SANTA_COLUMBUS_FIREBASE
} from '../services/firebase';

const RULES_SNIPPET = `{
  "rules": {
    ".read": true,
    ".write": true
  }
}`;

export default function FirebaseSettingsModal({
  isOpen,
  onClose,
  onConfigUpdated,
  currentTransactions = [],
  onReloadSampleData
}) {
  const [connectionStatus, setConnectionStatus] = useState({
    checking: false,
    checked: false,
    ok: false,
    isPermissionDenied: false,
    message: ''
  });
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setConnectionStatus({ checking: true, checked: false, ok: false, isPermissionDenied: false, message: 'Testing Firebase database endpoint...' });
    const res = await testFirebaseDirectConnection();
    setConnectionStatus({
      checking: false,
      checked: true,
      ok: res.ok,
      isPermissionDenied: !!res.isPermissionDenied,
      message: res.ok
        ? 'Successfully connected! Database is live and writable.'
        : res.isPermissionDenied
        ? 'Permission Denied: Firebase rules are currently locked.'
        : res.error || 'Connection failed.'
    });
    if (onConfigUpdated) onConfigUpdated(res.ok);
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(RULES_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePushToFirebase = async () => {
    if (currentTransactions.length === 0) {
      setSyncResult({ type: 'info', text: 'No local transactions to upload.' });
      return;
    }
    try {
      setIsSyncing(true);
      setSyncResult(null);
      const count = await uploadBulkToRealtimeDatabase(currentTransactions);
      setSyncResult({
        type: 'success',
        text: `Successfully synced ${count} transactions into Firebase Realtime Database!`
      });
      // Re-test connection after write
      handleTestConnection();
    } catch (err) {
      setSyncResult({
        type: 'error',
        text: `Sync error: ${err.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-left text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Firebase Database Setup
                </h2>
                {connectionStatus.checked && (
                  connectionStatus.ok ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Online & Writable
                    </span>
                  ) : connectionStatus.isPermissionDenied ? (
                    <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      Rules Locked (401)
                    </span>
                  ) : null
                )}
              </div>
              <p className="text-xs text-slate-500">
                Santa Columbus Apartments — Cloud Database Integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Live Status Notification */}
          {connectionStatus.checked && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-xs ${
                connectionStatus.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : connectionStatus.isPermissionDenied
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {connectionStatus.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold text-sm">
                  {connectionStatus.ok
                    ? 'Firebase Cloud Database is Ready'
                    : connectionStatus.isPermissionDenied
                    ? 'Firebase Database Permission Denied'
                    : 'Firebase Status Notice'}
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {connectionStatus.message}
                </p>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={connectionStatus.checking}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 border border-slate-300 shadow-2xs shrink-0"
              >
                {connectionStatus.checking ? 'Testing...' : 'Retest'}
              </button>
            </div>
          )}

          {/* Configuration Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1 font-medium">Realtime Database Endpoint:</span>
              <p className="font-mono text-amber-700 break-all text-[11px] font-semibold">
                {SANTA_COLUMBUS_FIREBASE.databaseURL}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1 font-medium">Project ID:</span>
              <p className="font-mono text-blue-700 text-xs font-semibold">
                {SANTA_COLUMBUS_FIREBASE.projectId} <span className="text-slate-400">({SANTA_COLUMBUS_FIREBASE.messagingSenderId})</span>
              </p>
            </div>
          </div>

          {/* Action Step: Fix Firebase Rules */}
          {(!connectionStatus.checked || !connectionStatus.ok) && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Required: Set Realtime Database Rules to Allow Writing
                </span>
                <a
                  href="https://console.firebase.google.com/project/santacolumbus-fb5e0/database/santacolumbus-fb5e0-default-rtdb/rules"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold underline"
                >
                  <span>Open Firebase Rules Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed">
                Firebase Realtime Database defaults to locked rules (<code className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">".read": false, ".write": false</code>).
                To let Santa Columbus Apartments MIS users save entries, paste the following rules into your Firebase Console and click <strong className="text-slate-900">Publish</strong>:
              </p>

              <div className="relative">
                <pre className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-emerald-300 border border-slate-800 overflow-x-auto">
{RULES_SNIPPET}
                </pre>
                <button
                  onClick={handleCopyRules}
                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold border border-slate-700 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-300" />
                      <span>Copy Rules</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-600">
                  After clicking <strong>Publish</strong> in Firebase Console, click:
                </span>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={connectionStatus.checking}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Zap className="w-3.5 h-3.5 text-white" />
                  <span>Verify Connection Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Sync Result */}
          {syncResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                syncResult.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              {syncResult.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{syncResult.text}</span>
            </div>
          )}

          {/* Cloud Actions */}
          <div className="pt-2 flex flex-wrap gap-2 justify-between">
            <button
              type="button"
              onClick={handlePushToFirebase}
              disabled={isSyncing || !connectionStatus.ok}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold disabled:opacity-40 transition shadow-2xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Pushing Data...' : `Push Local Data (${currentTransactions.length}) to Firebase`}</span>
            </button>

            <button
              type="button"
              onClick={onReloadSampleData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restore Sample Apartment Records</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Target Path: <code className="text-amber-700 font-semibold">/transactions</code> in Realtime Database</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
