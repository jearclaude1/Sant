// Utility functions for formatting and calculations

export const formatCurrency = (amount, currency = 'USD') => {
  const num = Number(amount) || 0;
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'Frw',
      minimumFractionDigits: 2,
    }).format(num);
  }
  return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getPaymentMethodLabel = (method) => {
  if (method === 'momo' || method === 'mobile_money') return 'Momo';
  if (method === 'code' || method === 'momo_code') return 'Code';
  return '';
};

export const getTransactionPaymentMethods = (transaction) => {
  const itemMethods = Array.isArray(transaction?.items)
    ? transaction.items.map((item) => item.paymentMethod).filter(Boolean)
    : [];
  const methods = itemMethods.length
    ? itemMethods
    : Array.isArray(transaction?.paymentMethods) && transaction.paymentMethods.length
      ? transaction.paymentMethods
      : [transaction?.feeMethod].filter(Boolean);

  return [...new Set(methods.map(getPaymentMethodLabel).filter(Boolean))];
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTransactionTime = (dateTime) => {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentMonthString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const generateReceiptNumber = () => {
  const prefix = 'SCA';
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${randomNum}`;
};
