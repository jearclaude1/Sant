import React from 'react';
import { X, Printer, Building2, CheckCircle, Calendar, CreditCard, User, Tag } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function ReceiptModal({ transaction, onClose }) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const userName = transaction.userName || transaction.recordedBy || 'MIS Staff';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left text-slate-800">
        {/* Top Actions (No Print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>MIS Official Voucher Preview</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Area */}
        <div className="space-y-6 printable-receipt text-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md text-white">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  SANTA COLUMBUS APARTMENTS
                </h2>
                <p className="text-xs text-slate-500">
                  Management Information System (MIS) Expense Voucher
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Voucher Ref
              </span>
              <p className="font-mono text-base font-black text-amber-700">
                {transaction.receiptNo}
              </p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Date of Tx:</span>
              <span className="font-bold text-slate-900">{formatDate(transaction.date)}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Entered By (User):</span>
              <span className="font-bold text-blue-700">{userName}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Total Line Items:</span>
              <span className="font-bold text-emerald-600">
                {transaction.items?.length || 0} items
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transaction.items?.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="py-2 px-4 text-slate-400 font-mono">{index + 1}</td>
                    <td className="py-2 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-2 px-4 text-center font-bold text-blue-700">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-600">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}

                {/* Subtotals & Fees */}
                <tr className="bg-slate-50/80 border-t border-slate-200 font-medium">
                  <td colSpan="4" className="py-2 px-4 text-right text-slate-600">
                    Items Subtotal:
                  </td>
                  <td className="py-2 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(transaction.itemsTotal)}
                  </td>
                </tr>

                <tr className="bg-amber-50/50 font-medium">
                  <td colSpan="4" className="py-2 px-4 text-right text-amber-800">
                    Transaction Fees ({transaction.feesNote || (transaction.feeMethod === 'mobile_money' ? 'Mobile maney' : transaction.feeMethod === 'momo_code' ? 'Momo code' : 'Processing fee')}):
                  </td>
                  <td className="py-2 px-4 text-right font-bold text-amber-700">
                    +{formatCurrency(transaction.fees)}
                  </td>
                </tr>

                <tr className="bg-emerald-50/80 font-bold border-t-2 border-emerald-200">
                  <td colSpan="4" className="py-3 px-4 text-right text-emerald-900 text-sm">
                    Total Amount Spent:
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700 text-base">
                    {formatCurrency(transaction.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Customer */}
          {(transaction.customer || transaction.notes) && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Customer: </span>
              {transaction.customer || transaction.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
            <div>
              <div className="border-b border-slate-300 pb-1 mb-1 font-semibold text-slate-800">
                {userName}
              </div>
              <span>Entered & Audited By (User)</span>
            </div>
            <div>
              <div className="border-b border-slate-300 pb-1 mb-1 font-semibold text-slate-800">
                Santa Columbus Property Manager
              </div>
              <span>Authorized Signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
