import { sampleTransactions } from '../utils/sampleData';

const LOCAL_STORAGE_KEY = 'sant_mis_transactions_cache';

// Load locally cached transactions
export const getLocalTransactions = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading localStorage transactions', err);
  }
  // Default to sample data if empty
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sampleTransactions));
  return sampleTransactions;
};

// Save locally
export const saveLocalTransactions = (transactions) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
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
    'Entered By (User)',
    'Item Name',
    'Quantity',
    'Unit Price',
    'Item Subtotal',
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
          `"${user.replace(/"/g, '""')}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          item.quantity || 1,
          item.price || 0,
          item.subtotal || 0,
          index === 0 ? (tx.fees || 0) : 0, // only on first row of multi-item tx
          index === 0 ? (tx.totalAmount || 0) : '',
          `"${(tx.notes || '').replace(/"/g, '""')}"`
        ]);
      });
    } else {
      rows.push([
        `"${tx.receiptNo || ''}"`,
        `"${tx.date || ''}"`,
        `"${user.replace(/"/g, '""')}"`,
        '"N/A"',
        0,
        0,
        0,
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
