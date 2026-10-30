import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  CreditCard,
  Printer,
  ChevronRight,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, formatDate, getCurrentMonthString } from '../utils/formatters';
import { deduplicateTransactions } from '../services/storage';

export default function MonthlyReport({ transactions = [], onViewReceipt }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString()); // 'YYYY-MM'

  // Filter transactions belonging to selected 'YYYY-MM' (deduplicated)
  const monthlyTransactions = useMemo(() => {
    return deduplicateTransactions(transactions).filter((tx) => tx.date && tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Aggregate monthly stats
  const stats = useMemo(() => {
    let totalSpent = 0;
    let itemsTotal = 0;
    let totalFees = 0;
    let totalUnits = 0;
    const categoryTotals = {};
    const dailySpendMap = {}; // { '2026-10-15': amount }

    monthlyTransactions.forEach((tx) => {
      const amt = parseFloat(tx.totalAmount) || 0;
      totalSpent += amt;
      itemsTotal += parseFloat(tx.itemsTotal) || 0;
      totalFees += parseFloat(tx.fees) || 0;

      // Category
      const cat = tx.category || 'Operations & Maintenance';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;

      // Daily breakdown
      const day = tx.date;
      dailySpendMap[day] = (dailySpendMap[day] || 0) + amt;

      // Units
      if (Array.isArray(tx.items)) {
        tx.items.forEach((item) => {
          totalUnits += parseFloat(item.quantity) || 1;
        });
      }
    });

    const txCount = monthlyTransactions.length;

    // Peak day
    let peakDay = null;
    let peakAmount = 0;
    Object.entries(dailySpendMap).forEach(([day, amt]) => {
      if (amt > peakAmount) {
        peakAmount = amt;
        peakDay = day;
      }
    });

    // Determine days in this selected month
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyAverage = daysInMonth > 0 ? totalSpent / daysInMonth : 0;

    // Build timeline data for all days in month (1 to daysInMonth)
    const timeline = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayString = `${yearStr}-${monthStr.padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const amount = dailySpendMap[dayString] || 0;
      timeline.push({
        dayNumber: d,
        dateString: dayString,
        amount,
      });
    }

    // Top transactions
    const topPurchases = [...monthlyTransactions]
      .sort((a, b) => (parseFloat(b.totalAmount) || 0) - (parseFloat(a.totalAmount) || 0))
      .slice(0, 5);

    return {
      totalSpent,
      itemsTotal,
      totalFees,
      txCount,
      totalUnits,
      dailyAverage,
      peakDay,
      peakAmount,
      daysInMonth,
      categoryTotals,
      timeline,
      topPurchases,
    };
  }, [monthlyTransactions, selectedMonth]);

  // Max daily amount for chart scaling
  const maxDailyAmount = useMemo(() => {
    return Math.max(...stats.timeline.map((t) => t.amount), 1);
  }, [stats.timeline]);

  // Month formatted title
  const monthTitle = useMemo(() => {
    const [yr, mo] = selectedMonth.split('-');
    const d = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Month Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <BarChart3 className="w-5 h-5" />
              </span>
              Monthly Expenditure Report
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Monthly overview of total amount spent, daily trends, and department expenses for Santa Columbus Apartments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 font-semibold hidden sm:inline">
                Select Month:
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition"
              title="Print Monthly Report"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print-only mb-6 border-b pb-4 text-black">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
              SANTA COLUMBUS APARTMENTS
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              Monthly Financial & Expenditure Statement
            </p>
            <p className="text-xs text-slate-500">Period: {monthTitle}</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">Total Month Spend: {formatCurrency(stats.totalSpent)}</p>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Monthly KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Monthly Spend */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Month Spend</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
            {formatCurrency(stats.totalSpent)}
          </p>
          <p className="text-[11px] text-blue-700 mt-1">
            Total for {monthTitle}
          </p>
        </div>

        {/* Daily Average */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Daily Average</span>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.dailyAverage)}</p>
          <span className="text-[11px] text-slate-500">Across {stats.daysInMonth} days</span>
        </div>

        {/* Total Fees */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Total Fees Paid</span>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.totalFees)}</p>
          <span className="text-[11px] text-slate-500">Bank & transfer fees</span>
        </div>

        {/* Peak Day */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Peak Spend Day</span>
          <p className="text-lg font-bold text-purple-600">
            {stats.peakDay ? formatCurrency(stats.peakAmount) : 'N/A'}
          </p>
          <span className="text-[11px] text-slate-500">
            {stats.peakDay ? formatDate(stats.peakDay) : 'None'}
          </span>
        </div>

        {/* Total Transactions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Vouchers</span>
          <p className="text-xl font-bold text-emerald-600">{stats.txCount}</p>
          <span className="text-[11px] text-slate-500">{stats.totalUnits} items bought</span>
        </div>
      </div>

      {/* Daily Spending Trend Chart for the Month */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Daily Spend Progression - {monthTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Day-by-day expenditure breakdown for the entire month.
            </p>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block"></span>
              Daily Spend
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block"></span>
              Peak Day
            </span>
          </div>
        </div>

        {/* Interactive Bar Chart */}
        <div className="h-56 flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 px-2 border-b border-slate-200 overflow-x-auto">
          {stats.timeline.map((day) => {
            const heightPercent = day.amount > 0 ? Math.max((day.amount / maxDailyAmount) * 100, 8) : 2;
            const isPeak = day.amount > 0 && day.dateString === stats.peakDay;

            return (
              <div
                key={day.dayNumber}
                className="flex-1 min-w-[14px] sm:min-w-[18px] flex flex-col items-center group relative h-full justify-end"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded shadow-lg">
                  <span>Day {day.dayNumber}: {formatCurrency(day.amount)}</span>
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80 ${
                    day.amount === 0
                      ? 'bg-slate-100'
                      : isPeak
                      ? 'bg-gradient-to-t from-purple-600 to-indigo-600'
                      : 'bg-gradient-to-t from-blue-600 to-cyan-500'
                  }`}
                ></div>

                {/* Day number label */}
                <span className="text-[9px] text-slate-500 mt-1 font-mono">{day.dayNumber}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Category Distribution & Top Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Department Expense Distribution
          </h2>

          {Object.keys(stats.categoryTotals).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No expenses recorded in {monthTitle}.
            </div>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(stats.categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => {
                  const percent = stats.totalSpent > 0 ? (amount / stats.totalSpent) * 100 : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-semibold">{category}</span>
                        <span className="text-slate-900 font-bold">{formatCurrency(amount)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-slate-500 text-right">
                        {percent.toFixed(1)}% of total monthly spend
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Top 5 Largest Expenditures */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Top 5 Largest Transactions
          </h2>

          {stats.topPurchases.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No transactions found for this month.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.topPurchases.map((tx, idx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {tx.userName || tx.vendor || 'MIS User'}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span className="font-mono text-amber-700">{tx.receiptNo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">
                      {formatCurrency(tx.totalAmount)}
                    </p>
                    <button
                      onClick={() => onViewReceipt && onViewReceipt(tx)}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Voucher →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Monthly Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
          <span>All Transactions in {monthTitle} ({monthlyTransactions.length})</span>
          <span className="text-xs text-emerald-600 font-bold">
            Total Spent: {formatCurrency(stats.totalSpent)}
          </span>
        </h2>

        {monthlyTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No entries for this month yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3">Voucher #</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Entered By (User)</th>
                  <th className="pb-3">Items Summary</th>
                  <th className="pb-3 text-center">Items Qty</th>
                  <th className="pb-3 text-right">Items Subtotal</th>
                  <th className="pb-3 text-right">Fees</th>
                  <th className="pb-3 text-right">Grand Total</th>
                  <th className="pb-3 text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-mono font-bold text-amber-700">{tx.receiptNo}</td>
                    <td className="py-3 text-slate-600">{formatDate(tx.date)}</td>
                    <td className="py-3 text-slate-900 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        {tx.userName || tx.recordedBy || 'MIS User'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 max-w-xs truncate">
                      {tx.items?.map((i) => i.name).filter(Boolean).join(', ') || tx.vendor || 'N/A'}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] border border-blue-100">
                        {tx.items?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-700 font-medium">
                      {formatCurrency(tx.itemsTotal)}
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
                        title="View Receipt"
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

      {/* Official Sign-off Box for Monthly Audit (Print Only) */}
      <div className="hidden print-only mt-12 pt-6 border-t border-slate-300 text-black text-xs">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="border-b border-black pb-1 mb-1 font-bold">MIS Lead / User</div>
            <p>Prepared By</p>
          </div>
          <div>
            <div className="border-b border-black pb-1 mb-1 font-bold">Financial Controller</div>
            <p>Reviewed By</p>
          </div>
          <div>
            <div className="border-b border-black pb-1 mb-1 font-bold">Santa Columbus Management</div>
            <p>Approved By</p>
          </div>
        </div>
      </div>
    </div>
  );
}
