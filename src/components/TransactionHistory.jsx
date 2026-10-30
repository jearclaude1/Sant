import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  Layers
} from 'lucide-react';
import { CATEGORIES } from '../utils/sampleData';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportTransactionsToCSV, deduplicateTransactions } from '../services/storage';

export default function TransactionHistory({
  transactions = [],
  onDeleteTransaction,
  onViewReceipt,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // Filtered & Sorted list
  const filteredTransactions = useMemo(() => {
    return deduplicateTransactions(transactions)
      .filter((tx) => {
        // Search filter
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchesUser = (tx.userName || tx.recordedBy || '').toLowerCase().includes(query);
          const matchesVendor = (tx.vendor || '').toLowerCase().includes(query);
          const matchesReceipt = (tx.receiptNo || '').toLowerCase().includes(query);
          const matchesNotes = (tx.customer || tx.notes || '').toLowerCase().includes(query);
          const matchesItem = Array.isArray(tx.items) && tx.items.some((item) =>
            (item.name || '').toLowerCase().includes(query)
          );
          if (!matchesUser && !matchesVendor && !matchesReceipt && !matchesNotes && !matchesItem) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) {
          return false;
        }

        // Date range filter
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount-desc') return (b.totalAmount || 0) - (a.totalAmount || 0);
        if (sortBy === 'amount-asc') return (a.totalAmount || 0) - (b.totalAmount || 0);
        return 0;
      });
  }, [transactions, searchTerm, selectedCategory, startDate, endDate, sortBy]);

  // Total amount of filtered
  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + (parseFloat(tx.totalAmount) || 0), 0);
  }, [filteredTransactions]);

  const toggleExpand = (id) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await onDeleteTransaction(deleteCandidate.id, deleteCandidate.receiptNo);
      setDeleteCandidate(null);
    } catch (err) {
      alert('Failed to delete transaction: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                <Layers className="w-5 h-5" />
              </span>
              Santa Columbus Apartments — Transaction Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Search by user name, item description, voucher number, or filter by date.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportTransactionsToCSV(filteredTransactions)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Filtered ({filteredTransactions.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search user name, item name, voucher ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start"
              className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End"
              className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="date-desc">Sort: Date (Newest First)</option>
              <option value="date-asc">Sort: Date (Oldest First)</option>
              <option value="amount-desc">Sort: Amount (Highest First)</option>
              <option value="amount-asc">Sort: Amount (Lowest First)</option>
            </select>
          </div>
        </div>

        {/* Filter stats bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredTransactions.length}</strong> of {transactions.length} records
          </span>
          <span>
            Total Spent in View: <strong className="text-emerald-600 text-sm">{formatCurrency(filteredTotal)}</strong>
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No transactions match your query</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search keywords or date range.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Entered By (User)</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Items Subtotal</th>
                  <th className="py-3 px-4 text-right">Fees</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isExpanded = expandedRowId === tx.id;
                  const itemsCount = tx.items?.length || 0;
                  const user = tx.userName || tx.recordedBy || 'MIS User';

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-slate-50 transition">
                        {/* Receipt No */}
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">
                          {tx.receiptNo}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>

                        {/* Entered by user */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {user}
                          </span>
                        </td>

                        {/* Items Summary */}
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                          {tx.items?.map((i) => i.name).filter(Boolean).join(', ') || tx.vendor || 'N/A'}
                        </td>

                        {/* Items count button */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleExpand(tx.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition"
                            title="Click to expand item breakdown"
                          >
                            <span>{itemsCount} items</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </td>

                        {/* Items Subtotal */}
                        <td className="py-3 px-4 text-right text-slate-700 font-medium whitespace-nowrap">
                          {formatCurrency(tx.itemsTotal)}
                        </td>

                        {/* Fees */}
                        <td className="py-3 px-4 text-right text-amber-600 font-medium whitespace-nowrap">
                          {formatCurrency(tx.fees)}
                        </td>

                        {/* Grand Total */}
                        <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                          {formatCurrency(tx.totalAmount)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onViewReceipt && onViewReceipt(tx)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition shadow-xs"
                              title="View & Print Voucher"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteCandidate(tx)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 text-slate-400 hover:text-white transition shadow-xs"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Line Items Detail */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan="9" className="px-6 py-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                              <div className="flex items-center justify-between mb-3 text-xs">
                                <span className="font-bold text-slate-900">
                                  Items Breakdown for {tx.receiptNo}
                                </span>
                                <span className="text-slate-500">
                                  Entered By (User): <strong className="text-blue-700">{user}</strong>
                                </span>
                              </div>

                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="pb-1.5">#</th>
                                    <th className="pb-1.5">Item Name / Description</th>
                                    <th className="pb-1.5 text-center">Quantity</th>
                                    <th className="pb-1.5 text-right">Unit Price</th>
                                    <th className="pb-1.5 text-right">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {tx.items?.map((item, i) => (
                                    <tr key={i}>
                                      <td className="py-1.5 text-slate-400">{i + 1}</td>
                                      <td className="py-1.5 text-slate-800 font-medium">{item.name}</td>
                                      <td className="py-1.5 text-center text-blue-700 font-semibold">{item.quantity}</td>
                                      <td className="py-1.5 text-right text-slate-600">{formatCurrency(item.price)}</td>
                                      <td className="py-1.5 text-right font-bold text-emerald-600">{formatCurrency(item.subtotal)}</td>
                                    </tr>
                                  ))}
                                  {/* Fees line */}
                                  <tr className="bg-amber-50/50">
                                    <td colSpan="4" className="py-2 text-right font-semibold text-amber-800">
                                      Transaction Fees ({tx.feesNote || 'Handling / processing'}):
                                    </td>
                                    <td className="py-2 text-right font-bold text-amber-700">
                                      +{formatCurrency(tx.fees)}
                                    </td>
                                  </tr>
                                  {/* Customer info */}
                                  {(tx.customer || tx.notes) && (
                                    <tr className="bg-slate-50/70 border-t border-slate-200">
                                      <td colSpan="5" className="py-2 px-1 text-slate-700">
                                        <span className="font-semibold text-slate-900">Customer: </span>
                                        {tx.customer || tx.notes}
                                      </td>
                                    </tr>
                                  )}
                                  {/* Grand total */}
                                  <tr className="bg-slate-50">
                                    <td colSpan="4" className="py-2 text-right font-bold text-slate-900">
                                      Total Amount:
                                    </td>
                                    <td className="py-2 text-right font-black text-emerald-600 text-sm">
                                      {formatCurrency(tx.totalAmount)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-left">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Delete Transaction Record?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete transaction{' '}
              <strong className="text-amber-700 font-mono">{deleteCandidate.receiptNo}</strong> entered by{' '}
              <strong className="text-slate-900">{deleteCandidate.userName || deleteCandidate.recordedBy || 'User'}</strong> ({formatCurrency(deleteCandidate.totalAmount)})?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shadow-xs"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
