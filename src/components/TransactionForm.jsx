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
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency, getTodayDateString, generateReceiptNumber } from '../utils/formatters';

export default function TransactionForm({ onSave, isSubmitting, currentUser }) {
  // First fields: Only name of user inserting data and date of transaction (auto-filled from logged-in user)
  const [userName, setUserName] = useState(currentUser?.username || '');
  const [date, setDate] = useState(getTodayDateString());
  const [receiptNo, setReceiptNo] = useState(generateReceiptNumber());
  const [notes, setNotes] = useState('');

  // Auto-fill username when currentUser is loaded
  useEffect(() => {
    if (currentUser?.username) {
      setUserName(currentUser.username);
    }
  }, [currentUser]);

  // Items State (Dynamic array with multi-row support via plus button)
  const [items, setItems] = useState([
    { id: '1', name: '', quantity: 1, price: '' }
  ]);

  // Transaction Fees
  const [fees, setFees] = useState('');
  const [feesNote, setFeesNote] = useState('');

  // Error and Notification states
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  // Add another item row (The "pulse button" feature)
  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: '',
      quantity: 1,
      price: ''
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
  const parsedFees = parseFloat(fees) || 0;
  const grandTotal = itemsSubtotal + parsedFees;

  // Form Validation
  const validate = () => {
    const newErrors = {};

    if (!userName.trim()) {
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
    setNotes('');
    setFees('');
    setFeesNote('');
    setItems([{ id: Date.now().toString(), name: '', quantity: 1, price: '' }]);
    setErrors({});
    if (currentUser?.username) {
      setUserName(currentUser.username);
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      };
    });

    const transactionData = {
      receiptNo,
      date,
      userName: userName.trim(),
      recordedBy: userName.trim(), // for backwards-compatibility with views
      notes: notes.trim(),
      items: formattedItems,
      itemsTotal: itemsSubtotal,
      fees: parsedFees,
      feesNote: feesNote.trim(),
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
            {/* ONLY FIELD: Name of user who is going to insert data */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Name of User Inserting Data *</span>
                </span>
                {currentUser?.username && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                    Auto-filled from Login
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="Enter your name (e.g. Sarah Jenkins, David Miller...)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
              />
              {errors.userName && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.userName}</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                {currentUser?.telephone ? (
                  <span>Verified User: <strong>{currentUser.username}</strong> ({currentUser.telephone})</span>
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
              const itemSubtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);

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
                    <div className="col-span-12 sm:col-span-5">
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
                    <div className="col-span-6 sm:col-span-2">
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

                    {/* Line Subtotal */}
                    <div className="col-span-10 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Subtotal
                      </label>
                      <div className="py-2 px-1 text-sm font-bold text-emerald-600 truncate">
                        {formatCurrency(itemSubtotal)}
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Transaction Fees ($)</span>
                <span className="text-[11px] text-slate-500">Bank charge, transfer fee, delivery fee, taxes</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  $
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fee Description / Reason (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Bank wire charge, Courier delivery, Carrier fee"
                value={feesNote}
                onChange={(e) => setFeesNote(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs transition"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Transaction Notes / Remarks (Optional)</span>
            </label>
            <textarea
              rows="2"
              placeholder="Any additional remarks regarding this expenditure, apartment unit #, purpose..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
