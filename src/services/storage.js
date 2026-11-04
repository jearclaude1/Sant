import { sampleTransactions } from '../utils/sampleData';
import { getPaymentMethodLabel, formatTransactionTime } from '../utils/formatters';

const LOCAL_STORAGE_KEY = 'sant_mis_transactions_cache';

// Helper to strictly deduplicate transactions by voucher number (receiptNo) or id
export const deduplicateTransactions = (list) => {
  if (!Array.isArray(list)) return [];
  const seenKeys = new Set();
  const deduped = [];

  for (const item of list) {
    if (!item) continue;
    // Primary key is receiptNo (e.g. SCA-2026-5872) or fallback to database id
    const key = (item.receiptNo || item.id || '').trim();
    if (key) {
      if (seenKeys.has(key)) {
        continue; // Skip duplicate
      }
      seenKeys.add(key);
    }
    deduped.push(item);
  }

  return deduped;
};

// Load locally cached transactions (with automatic deduplication)
export const getLocalTransactions = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = deduplicateTransactions(parsed);
        // If duplicates existed in localStorage, clean it up immediately
        if (clean.length !== parsed.length) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch (err) {
    console.error('Error reading localStorage transactions', err);
  }
  // Default to sample data if empty
  const defaultClean = deduplicateTransactions(sampleTransactions);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultClean));
  return defaultClean;
};

// Save locally with deduplication
export const saveLocalTransactions = (transactions) => {
  try {
    const clean = deduplicateTransactions(transactions);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.error('Error saving to localStorage', err);
  }
};

// Export to CSV
export const exportTransactionsToCSV = (transactions) => {
  if (!transactions || transactions.length === 0) return;

  const headers = [
    'Voucher No',
    'Date',
    'Transaction Made',
    'Entered By (User)',
    'Item Name',
    'Quantity',
    'Unit Price',
    'Item Subtotal',
    'Payment Method',
    'Item Transaction Fee',
    'Transaction Fees',
    'Total Transaction Amount',
    'Notes'
  ];

  const rows = [];

  transactions.forEach((tx) => {
    const user = tx.userName || tx.recordedBy || '';
    if (tx.items && tx.items.length > 0) {
      tx.items.forEach((item, index) => {
        rows.push([
          `"${tx.receiptNo || ''}"`,
          `"${tx.date || ''}"`,
          `"${formatTransactionTime(tx.transactionMadeAt)}"`,
          `"${user.replace(/"/g, '""')}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          item.quantity || 1,
          item.price || 0,
          item.subtotal || 0,
          `"${getPaymentMethodLabel(item.paymentMethod || tx.feeMethod)}"`,
          item.transactionFee ?? (index === 0 ? (tx.fees || 0) : 0),
          index === 0 ? (tx.fees || 0) : 0, // only on first row of multi-item tx
          index === 0 ? (tx.totalAmount || 0) : '',
          `"${(tx.notes || '').replace(/"/g, '""')}"`
        ]);
      });
    } else {
      rows.push([
        `"${tx.receiptNo || ''}"`,
        `"${tx.date || ''}"`,
        `"${formatTransactionTime(tx.transactionMadeAt)}"`,
        `"${user.replace(/"/g, '""')}"`,
        '"N/A"',
        0,
        0,
        0,
        `"${getPaymentMethodLabel(tx.feeMethod)}"`,
        tx.fees || 0,
        tx.fees || 0,
        tx.totalAmount || 0,
        `"${(tx.notes || '').replace(/"/g, '""')}"`
      ]);
    }
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Santa_Columbus_Apartments_MIS_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
