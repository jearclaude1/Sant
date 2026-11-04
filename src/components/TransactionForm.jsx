import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Receipt,
  Calendar,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  Building2,
  Lock,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  formatCurrency,
  getPaymentMethodLabel,
  getTodayDateString,
  generateReceiptNumber
} from '../utils/formatters';

export default function TransactionForm({ onSave, isSubmitting, currentUser }) {
  // First fields: Only name of user inserting data and date of transaction (locked to logged-in user)
  const [userName, setUserName] = useState(currentUser?.username || '');
  const [date, setDate] = useState(getTodayDateString());
  const [receiptNo, setReceiptNo] = useState(generateReceiptNumber());
  const [customer, setCustomer] = useState('');

  // Auto-fill and lock username when currentUser is loaded
  useEffect(() => {
    if (currentUser?.username) {
      setUserName(currentUser.username);
    }
  }, [currentUser]);

  // Items State (Dynamic array with multi-row support via plus button)
  const [items, setItems] = useState([
    { id: '1', name: '', quantity: 1, price: '', paymentMethod: '' }
  ]);

  // Error and Notification states
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  // Add another item row (The "pulse button" feature)
  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: '',
      quantity: 1,
      price: '',
      paymentMethod: ''
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remove an item row
  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update item field
  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Subtotals and Grand Total
  const calculateItemsSubtotal = () => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + q * p;
    }, 0);
  };

  const itemsSubtotal = calculateItemsSubtotal();

  // Calculate Momo fees using the existing transaction fee tiers.
  const calculateMobileMoneyFee = (amount) => {
    const num = parseFloat(amount) || 0;
    if (num <= 0) return 0;
    if (num <= 1000) return 20;
    if (num <= 10000) return 100;
    if (num <= 150000) return 250;
    if (num <= 500000) return 500;
    if (num <= 1000000) return 1000;
    return 1500;
  };

  const getItemTransactionFee = (item) => {
    const itemAmount = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
    return item.paymentMethod === 'momo' ? calculateMobileMoneyFee(itemAmount) : 0;
  };

  const parsedFees = items.reduce((total, item) => total + getItemTransactionFee(item), 0);
  const grandTotal = itemsSubtotal + parsedFees;
  const paymentMethods = [...new Set(items.map((item) => item.paymentMethod).filter(Boolean))];

  // Form Validation
  const validate = () => {
    const newErrors = {};

    const activeUser = (currentUser?.username || userName).trim();
    if (!activeUser) {
      newErrors.userName = 'Please enter your name (user inserting data)';
    }

    if (!date) {
      newErrors.date = 'Date of transaction is required';
    }

    // Validate items
    const itemErrors = [];
    items.forEach((item, index) => {
      if (!item.name.trim()) {
        itemErrors.push(`Item #${index + 1}: Item name or description is required`);
      }
      if (!item.price || parseFloat(item.price) <= 0) {
        itemErrors.push(`Item #${index + 1}: Valid price is required`);
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        itemErrors.push(`Item #${index + 1}: Quantity must be at least 1`);
      }
      if (!item.paymentMethod) {
        itemErrors.push(`Item #${index + 1}: Payment method is required`);
      }
    });

    if (itemErrors.length > 0) {
      newErrors.items = itemErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset form
  const handleReset = () => {
    setDate(getTodayDateString());
    setReceiptNo(generateReceiptNumber());
    setCustomer('');
    setItems([{ id: Date.now().toString(), name: '', quantity: 1, price: '', paymentMethod: '' }]);
    setErrors({});
    if (currentUser?.username) {
      setUserName(currentUser.username);
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // Format items with calculated subtotal
    const formattedItems = items.map((item) => {
      const qty = parseFloat(item.quantity) || 1;
      const unitPrice = parseFloat(item.price) || 0;
      return {
        id: item.id,
        name: item.name.trim(),
        quantity: qty,
        price: unitPrice,
        subtotal: qty * unitPrice,
        paymentMethod: item.paymentMethod,
        transactionFee: getItemTransactionFee(item),
      };
    });

    const activeUser = (currentUser?.username || userName).trim();
    const cleanCustomer = customer.trim();

    const transactionMadeAt = new Date().toISOString();
    const transactionData = {
      receiptNo,
      date,
      transactionMadeAt,
      userName: activeUser,
      recordedBy: activeUser, // for backwards-compatibility with views
      notes: cleanCustomer,
      customer: cleanCustomer,
      items: formattedItems,
      itemsTotal: itemsSubtotal,
      paymentMethods,
      fees: parsedFees,
      feesNote: paymentMethods.map((method) => method === 'momo' ? 'Momo' : 'Code').join(', '),
      totalAmount: grandTotal,
    };

    try {
      await onSave(transactionData);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Confetti non-fatal
      }

      setSuccessMessage(
        `Transaction voucher #${receiptNo} recorded successfully into database! Total: ${formatCurrency(grandTotal)}`
      );
      handleReset();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save transaction.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Building2 className="w-6 h-6 text-blue-600" />
            </span>
            Santa Columbus Apartments — MIS Entry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Input apartment expenses, maintenance items, quantities, prices, and transaction fees.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
          <span className="text-slate-500">Voucher Ref:</span>
          <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {receiptNo}
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{successMessage}</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Saved into database and updated in daily and monthly reports.
            </p>
          </div>
        </div>
      )}

      {/* Top Error Alert with Firebase Guidance */}
      {errors.submit && (
        <div className="mb-6 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm text-rose-950">Transaction Not Saved To Firebase</p>
              <p className="text-xs text-rose-700 mt-1">{errors.submit}</p>
            </div>
          </div>

          {errors.submit.includes('Permission Denied') && (
            <div className="p-3.5 bg-white rounded-xl border border-rose-200 text-xs text-slate-700 space-y-2">
              <p className="font-bold text-amber-800">How to Fix in 10 Seconds:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                <li>
                  Open{' '}
                  <a
                    href="https://console.firebase.google.com/project/santacolumbus-fb5e0/database/santacolumbus-fb5e0-default-rtdb/rules"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-semibold hover:text-blue-700"
                  >
                    Firebase Console &gt; Realtime Database &gt; Rules
                  </a>
                </li>
                <li>Change rules to:</li>
              </ol>
              <pre className="p-2 bg-slate-900 rounded font-mono text-[10px] text-emerald-300 overflow-x-auto">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
              </pre>
              <p className="text-[11px] text-slate-500">
                Click <strong>Publish</strong> in the Firebase Console, then click Save again.
              </p>
            </div>
          )}
        </div>
      )}

      {errors.items && errors.items.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Please complete the following item details:
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 text-amber-800">
            {errors.items.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* FIRST FIELDS: ONLY NAME OF USER INSERTING DATA & DATE OF TRANSACTION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            User Identification & Transaction Date
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* ONLY FIELD: Name of user who is going to insert data (Locked when logged in) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {currentUser ? (
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Name of User Inserting Data *</span>
                </span>
                {currentUser?.username ? (
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-slate-600" />
                    Locked (Logged In)
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                    Required
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={currentUser?.username || userName}
                onChange={(e) => {
                  if (!currentUser) setUserName(e.target.value);
                }}
                readOnly={!!currentUser}
                required
                className={`w-full rounded-xl px-4 py-3 text-sm transition shadow-xs ${
                  currentUser
                    ? 'bg-slate-100 text-slate-800 font-bold border border-slate-300 cursor-not-allowed select-none focus:outline-none'
                    : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {errors.userName && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.userName}</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                {currentUser ? (
                  <span className="text-slate-600">
                    Verified User: <strong className="text-slate-900">{currentUser.username}</strong> ({currentUser.telephone || 'Active'}) — Name is locked to logged-in user and cannot be changed.
                  </span>
                ) : (
                  <span>Your name will be associated with this transaction voucher.</span>
                )}
              </p>
            </div>

            {/* Date of Transaction */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Date of Transaction *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
              />
              {errors.date && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.date}</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                Defaults to today. Used for daily and monthly expenditure reporting.
              </p>
            </div>
          </div>
        </div>

        {/* DYNAMIC MULTI-ITEM SECTION WITH PULSE / PLUS BUTTON */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Items, Quantities & Prices Breakdown
                </h2>
                <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                If data to insert is more than one, click the plus button to add another field.
              </p>
            </div>
          </div>

          {/* Items Input Rows */}
          <div className="space-y-3">
            {items.map((item, index) => {
              return (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3 sm:p-4 transition-all duration-150"
                >
                  <div className="grid grid-cols-12 gap-3 items-end">
                    {/* Index badge */}
                    <div className="col-span-12 sm:col-span-1 flex sm:flex-col items-center justify-between sm:justify-center">
                      <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-2xs">
                        #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="sm:hidden text-rose-500 hover:text-rose-700 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Item Name / Description */}
                    <div className="col-span-12 sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Item Description / Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bathroom Ceramic Taps, LED Bulbs, Pool Chlorine..."
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="integer"
                        min="1"
                        step="any"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Unit Price (Frw) *
                      </label>
                      <input
                        type="integer"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={item.paymentMethod}
                        onChange={(e) => handleItemChange(item.id, 'paymentMethod', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      >
                        <option value="">Select</option>
                        <option value="momo">Momo</option>
                        <option value="code">Code</option>
                      </select>
                    </div>

                    {/* Line Transaction Fee */}
                    <div className="col-span-10 sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Transaction Fees
                      </label>
                      <div className="py-2 px-1 text-sm font-bold text-amber-600 truncate">
                        {formatCurrency(getItemTransactionFee(item))}
                      </div>
                    </div>

                    {/* Remove Action (Desktop) */}
                    <div className="col-span-2 sm:col-span-1 hidden sm:flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length <= 1}
                        className={`p-2 rounded-lg transition ${
                          items.length <= 1
                            ? 'text-slate-300 cursor-not-allowed opacity-40'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={items.length <= 1 ? 'At least one item required' : 'Remove this item'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Plus / Pulse Button Container */}
          <div className="mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleAddItem}
              className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Animated Pulse indicator */}
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Click to Add Another Item Field (+)</span>
            </button>

            <div className="text-xs text-slate-500 font-medium">
              Items Subtotal: <span className="font-bold text-slate-800 ml-1">{formatCurrency(itemsSubtotal)}</span>
            </div>
          </div>
        </div>

        {/* FEES FOR TRANSACTION SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Fees for Transaction
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs font-semibold text-slate-600 mb-2">Payment methods used</p>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.length > 0 ? paymentMethods.map((method) => (
                  <span key={method} className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-200">
                    {getPaymentMethodLabel(method)}
                  </span>
                )) : (
                  <span className="text-xs text-slate-500">Choose a method for each item above.</span>
                )}
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-800 mb-1">Total transaction fees</p>
              <p className="text-lg font-bold text-amber-700">
                {parsedFees > 0 ? formatCurrency(parsedFees) : 'No transaction fees'}
              </p>
            </div>
          </div>

          {/* d: Title changed from Remarks to Customer */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer</span>
            </label>
            <textarea
              rows="2"
              placeholder="Enter customer name, contact, apartment unit # or remarks..."
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            ></textarea>
          </div>
        </div>

        {/* CALCULATION SUMMARY & SUBMISSION BAR */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Breakdown numbers */}
            <div className="grid grid-cols-3 gap-4 w-full md:w-auto text-center md:text-left">
              <div>
                <p className="text-xs text-slate-400">Items Total</p>
                <p className="text-lg font-bold text-white">{formatCurrency(itemsSubtotal)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Transaction Fees</p>
                <p className="text-lg font-bold text-amber-400">+{formatCurrency(parsedFees)}</p>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Total Amount Spent
                </p>
                <p className="text-2xl font-black text-emerald-400 tracking-tight">
                  {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving to Database...' : 'Save Data in Database'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
