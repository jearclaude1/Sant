import React, { useState, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Printer,
  ShoppingBag,
  Clock,
  ArrowRight,
  Eye,
  Filter,
  CheckCircle2,
  Building2
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatTransactionTime,
  getTodayDateString,
  getPaymentMethodLabel,
  getTransactionPaymentMethods
} from '../utils/formatters';
import { deduplicateTransactions } from '../services/storage';

export default function DailyReport({ transactions = [], onViewReceipt }) {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  // Quick Date presets
  const handleQuickDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${da}`);
  };

  // Filter transactions for the selected day (deduplicated)
  const dailyTransactions = useMemo(() => {
    return deduplicateTransactions(transactions).filter((tx) => tx.date === selectedDate);
  }, [transactions, selectedDate]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalSpent = 0;
    let itemsTotal = 0;
    let totalFees = 0;
    let totalItemsCount = 0;
    const categoryTotals = {};
    const allItemsList = [];

    dailyTransactions.forEach((tx) => {
      totalSpent += parseFloat(tx.totalAmount) || 0;
      itemsTotal += parseFloat(tx.itemsTotal) || 0;
      totalFees += parseFloat(tx.fees) || 0;

      // Category breakdown
      const cat = tx.category || 'Maintenance & Operations';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (parseFloat(tx.totalAmount) || 0);

      // Collect items
      if (Array.isArray(tx.items)) {
        tx.items.forEach((item) => {
          totalItemsCount += parseFloat(item.quantity) || 1;
          allItemsList.push({
            ...item,
            receiptNo: tx.receiptNo,
            userName: tx.userName || tx.recordedBy || 'Staff',
            vendor: tx.vendor,
            category: tx.category,
            paymentMethod: item.paymentMethod,
            transactionFee: item.transactionFee,
          });
        });
      }
    });

    const txCount = dailyTransactions.length;
    const avgPerTx = txCount > 0 ? totalSpent / txCount : 0;

    return {
      totalSpent,
      itemsTotal,
      totalFees,
      txCount,
      totalItemsCount,
      avgPerTx,
      categoryTotals,
      allItemsList,
    };
  }, [dailyTransactions]);

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <Calendar className="w-5 h-5" />
              </span>
              Daily Expense Report
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Audit and track daily expenditures, transactions, and fees for Santa Columbus Apartments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Quick date shortcuts */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDate(0)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedDate === getTodayDateString()
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(1)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 font-medium transition"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(2)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 font-medium transition"
              >
                2 Days Ago
              </button>
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition"
              title="Print official report"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Header (Visible in print) */}
      <div className="hidden print-only mb-6 border-b pb-4 text-black">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
              SANTA COLUMBUS APARTMENTS
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              Daily MIS Financial & Expenditure Report
            </p>
            <p className="text-xs text-slate-500">Report Date: {formatDate(selectedDate)}</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">Total Spent: {formatCurrency(metrics.totalSpent)}</p>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Spent */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Amount Spent</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
            {formatCurrency(metrics.totalSpent)}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">
            For {formatDate(selectedDate)}
          </p>
        </div>

        {/* Items Subtotal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Items Subtotal</span>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(metrics.itemsTotal)}</p>
          <span className="text-[11px] text-slate-500">{metrics.totalItemsCount} units total</span>
        </div>

        {/* Fees Paid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Transaction Fees</span>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(metrics.totalFees)}</p>
          <span className="text-[11px] text-slate-500">Momo transaction fees</span>
        </div>

        {/* Transactions count */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Transactions</span>
          <p className="text-xl font-bold text-blue-600">{metrics.txCount}</p>
          <span className="text-[11px] text-slate-500">Recorded vouchers</span>
        </div>

        {/* Avg per Transaction */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Avg Transaction</span>
          <p className="text-xl font-bold text-indigo-600">{formatCurrency(metrics.avgPerTx)}</p>
          <span className="text-[11px] text-slate-500">Per entry average</span>
        </div>
      </div>

      {/* Main Content Grid: Category Breakdown + Item Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Department Breakdown</span>
            <span className="text-xs text-slate-500 font-normal">
              {Object.keys(metrics.categoryTotals).length} categories
            </span>
          </h2>

          {Object.keys(metrics.categoryTotals).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No expenses recorded for this date.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(metrics.categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => {
                  const percent = metrics.totalSpent > 0 ? (amount / metrics.totalSpent) * 100 : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-medium truncate">{category}</span>
                        <span className="text-slate-900 font-bold">{formatCurrency(amount)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-slate-500 text-right">
                        {percent.toFixed(1)}% of daily spend
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Purchased Items List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Items Purchased On {formatDate(selectedDate)}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              {metrics.allItemsList.length} line items
            </span>
          </h2>

          {metrics.allItemsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <p>No transactions recorded for this day.</p>
              <p className="text-xs text-slate-500 mt-1">Select another date or add a new entry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2.5">Item Name</th>
                    <th className="pb-2.5">Recorded By</th>
                    <th className="pb-2.5 text-center">Qty</th>
                    <th className="pb-2.5 text-right">Unit Price</th>
                    <th className="pb-2.5">Payment Method</th>
                    <th className="pb-2.5 text-right">Transaction Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.allItemsList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 text-slate-900 font-medium">
                        <div>{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.receiptNo}</div>
                      </td>
                      <td className="py-2.5 text-slate-600">{item.userName}</td>
                      <td className="py-2.5 text-center font-bold text-blue-600">{item.quantity}</td>
                      <td className="py-2.5 text-right text-slate-600">{formatCurrency(item.price)}</td>
                      <td className="py-2.5 text-slate-700">
                        {getPaymentMethodLabel(item.paymentMethod) || '—'}
                      </td>
                      <td className="py-2.5 text-right font-bold text-amber-600">
                        {formatCurrency(item.transactionFee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Vouchers Table for this Day */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-blue-600" />
          Transactions & Receipts ({dailyTransactions.length})
        </h2>

        {dailyTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No transaction records found for this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3">Voucher #</th>
                  <th className="pb-3">Transaction Made</th>
                  <th className="pb-3">Entered By (User)</th>
                  <th className="pb-3">Items Summary</th>
                  <th className="pb-3 text-center">Items Qty</th>
                  <th className="pb-3 text-right">Items Subtotal</th>
                  <th className="pb-3">Payment Methods</th>
                  <th className="pb-3 text-right">Fees</th>
                  <th className="pb-3 text-right">Grand Total</th>
                  <th className="pb-3 text-center no-print">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-mono font-bold text-amber-700">{tx.receiptNo}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">
                      {formatTransactionTime(tx.transactionMadeAt) || '—'}
                    </td>
                    <td className="py-3 text-slate-900 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        {tx.userName || tx.recordedBy || 'MIS User'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 max-w-xs truncate">
                      {tx.items?.map((i) => i.name).filter(Boolean).join(', ') || tx.vendor || 'N/A'}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                        {tx.items?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-700 font-medium">
                      {formatCurrency(tx.itemsTotal)}
                    </td>
                    <td className="py-3 text-slate-700">
                      {getTransactionPaymentMethods(tx).join(', ') || '—'}
                    </td>
                    <td className="py-3 text-right text-amber-600 font-medium">
                      {formatCurrency(tx.fees)}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-600 text-sm">
                      {formatCurrency(tx.totalAmount)}
                    </td>
                    <td className="py-3 text-center no-print">
                      <button
                        onClick={() => onViewReceipt && onViewReceipt(tx)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition shadow-xs"
                        title="View & Print Voucher"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Sign-off Box for Daily Audit (Print Only) */}
      <div className="hidden print-only mt-12 pt-6 border-t border-slate-300 text-black text-xs">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="border-b border-black pb-1 mb-1 font-bold">MIS Officer / User</div>
            <p>Prepared By</p>
          </div>
          <div>
            <div className="border-b border-black pb-1 mb-1 font-bold">Property Accounts</div>
            <p>Verified By</p>
          </div>
          <div>
            <div className="border-b border-black pb-1 mb-1 font-bold">Apartment Management / Director</div>
            <p>Approved By</p>
          </div>
        </div>
      </div>
    </div>
  );
}
