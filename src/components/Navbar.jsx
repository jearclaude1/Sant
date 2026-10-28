import React from 'react';
import {
  Building2,
  PlusCircle,
  Calendar,
  BarChart3,
  ListOrdered,
  Database,
  Settings,
  Sparkles,
  FileSpreadsheet,
  User,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo & Company Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('form')}>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-blue-500/20 text-white">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  Santa Columbus Apartments
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Apartment Expense & Transaction Tracker
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            
            <button
              onClick={() => setActiveTab('daily')}
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
          <div className="flex items-center gap-2.5">
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
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition shadow-sm ${
                firebaseConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
              }`}
              title="Click to configure Firebase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold">
                {firebaseConfigured ? 'Firebase Connected' : 'Firebase Setup'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  firebaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </button>

            {/* Current Logged-in User Profile Pill */}
            {currentUser && (
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs shadow-2xs"
                title={`Logged in as ${currentUser.username} (${currentUser.telephone || 'Verified'})`}
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 hover:border-rose-300 text-xs font-semibold shadow-xs transition"
                title="Log out of MIS"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition"
              title="System & Database Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'form' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <PlusCircle className="w-4 h-4 mb-0.5 text-emerald-600" />
            <span>New Entry</span>
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'daily' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <Calendar className="w-4 h-4 mb-0.5 text-amber-600" />
            <span>Daily</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'monthly' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5 text-blue-600" />
            <span>Monthly</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'history' ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <ListOrdered className="w-4 h-4 mb-0.5 text-purple-600" />
            <span>History</span>
          </button>
        </div>
      </div>
    </header>
  );
}
