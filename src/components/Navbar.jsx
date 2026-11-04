import React from 'react';
import {
  Building2,
  PlusCircle,
  Calendar,
  BarChart3,
  ListOrdered,
  Database,
  Settings,
  FileSpreadsheet,
  LogOut
} from 'lucide-react';
import { exportTransactionsToCSV } from '../services/storage';

export default function Navbar({
  activeTab,
  setActiveTab,
  firebaseConfigured,
  onOpenSettings,
  transactions = [],
  currentUser,
  onLogout
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 py-1.5 sm:py-3">
          {/* Logo & Company Title */}
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left sm:flex-none sm:gap-3"
            onClick={() => setActiveTab('form')}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500/20 sm:h-11 sm:w-11 sm:rounded-xl">
              <Building2 className="h-4 w-4 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="hidden font-extrabold text-xl tracking-tight text-slate-900 sm:inline">
                  Santa Columbus Apartments
                </span>
                <span className="block font-extrabold text-[11px] leading-tight tracking-tight text-slate-900 sm:hidden">
                  Santa Columbus<br />Apartments
                </span>
              </div>
              <p className="truncate text-[8px] font-medium leading-tight text-slate-500 sm:text-xs">
                Apartment Expense & Transaction Tracker
              </p>
            </div>
          </button>

          {/* Navigation Tabs */}
          <nav aria-label="Main navigation" className="hidden xl:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('form')}
              aria-current={activeTab === 'form' ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'form'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <PlusCircle className={`w-4 h-4 ${activeTab === 'form' ? 'text-white' : 'text-emerald-600'}`} />
              <span>New Entry</span>
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              aria-current={activeTab === 'daily' ? 'page' : undefined}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'daily'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Calendar className={`w-4 h-4 ${activeTab === 'daily' ? 'text-white' : 'text-amber-600'}`} />
              <span>Daily Report</span>
            </button>

            <button
              onClick={() => setActiveTab('monthly')}
              aria-current={activeTab === 'monthly' ? 'page' : undefined}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'monthly' ? 'text-white' : 'text-blue-600'}`} />
              <span>Monthly Report</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              aria-current={activeTab === 'history' ? 'page' : undefined}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <ListOrdered className={`w-4 h-4 ${activeTab === 'history' ? 'text-white' : 'text-purple-600'}`} />
              <span>All Transactions</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'history' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {transactions.length}
              </span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
            {/* Quick CSV Export */}
            <button
              onClick={() => exportTransactionsToCSV(transactions)}
              title="Export all data to CSV / Excel"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {/* Database status pill */}
            {/* <button
              onClick={onOpenSettings}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-xs font-medium border transition shadow-sm sm:gap-2 sm:px-3 sm:py-1.5 ${
                firebaseConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
              }`}
              title="Click to configure Firebase"
            >
              <Database className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline font-semibold">
                {firebaseConfigured ? 'Firebase Connected' : 'Firebase Setup'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  firebaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </button> */}

            {/* Current Logged-in User Profile Pill */}
            {currentUser && (
              <div
                className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs shadow-2xs sm:gap-2 sm:px-2.5 sm:rounded-xl"
                title={`Logged in as ${currentUser.username} (${currentUser.telephone || 'Verified'})`}
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] sm:text-[11px] shrink-0">
                  {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="font-bold text-slate-800 text-[11px] truncate max-w-[110px]">
                    {currentUser.username}
                  </p>
                  <p className="text-[9.5px] text-slate-500 font-mono">
                    {currentUser.telephone || 'Staff'}
                  </p>
                </div>
              </div>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 hover:border-rose-300 text-xs font-semibold shadow-xs transition"
                title="Log out of MIS"
              >
                <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition"
              title="System & Database Settings"
            >
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <nav aria-label="Main navigation" className="xl:hidden flex items-center justify-around gap-1 border-t border-slate-200 bg-white py-1 sm:py-2">
          <button
            onClick={() => setActiveTab('form')}
            aria-current={activeTab === 'form' ? 'page' : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center rounded-lg py-1 text-[10px] transition-colors sm:text-xs ${
              activeTab === 'form' ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="mb-0.5 h-3.5 w-3.5 text-emerald-600 sm:h-4 sm:w-4" />
            <span>New Entry</span>
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            aria-current={activeTab === 'daily' ? 'page' : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center rounded-lg py-1 text-[10px] transition-colors sm:text-xs ${
              activeTab === 'daily' ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="mb-0.5 h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
            <span>Daily</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            aria-current={activeTab === 'monthly' ? 'page' : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center rounded-lg py-1 text-[10px] transition-colors sm:text-xs ${
              activeTab === 'monthly' ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="mb-0.5 h-3.5 w-3.5 text-blue-600 sm:h-4 sm:w-4" />
            <span>Monthly</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            aria-current={activeTab === 'history' ? 'page' : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center rounded-lg py-1 text-[10px] transition-colors sm:text-xs ${
              activeTab === 'history' ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ListOrdered className="mb-0.5 h-3.5 w-3.5 text-purple-600 sm:h-4 sm:w-4" />
            <span>History</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
