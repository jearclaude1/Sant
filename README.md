# 🏢 Santa Columbus Apartments - MIS Transaction & Expense Tracker

A web-based Management Information System (MIS) application built for **Santa Columbus Apartments** to manage, track, and audit property expenditures, maintenance items, transaction fees, and daily/monthly financial reports.

---

## 🌟 Key Features

### 1. 📝 Streamlined MIS Transaction Entry
- **Simplified First Fields**: In the first section, only the **Name of User Inserting Data** (and date of transaction) is required.
- **Dynamic Multi-Item Entry with Pulse Button**:
  - Add items with description, quantity, unit price, and auto-computed line subtotals.
  - Animated **"+ Add Another Item Field (+)"** pulse button to dynamically append another field when inserting more than one item.
  - Delete item button for each row.
- **Transaction Fees**: Dedicated field for transaction fees (bank charges, carrier fees, processing, wire fees) + optional fee description.
- **Real-Time Financial Calculator**: Instantly computes items subtotal, fees, and grand total amount spent.
- **Voucher Auto-Numbering**: Automatic generation of Santa Columbus Apartments reference vouchers (e.g. `SCA-2026-XXXX`).

### 2. 📅 Daily Expense Report
- Audit daily expenditures for any date (Today, Yesterday, 2 Days Ago, or custom calendar date).
- **KPI Metrics**: Total Amount Spent, Items Cost, Total Transaction Fees Paid, Total Items Purchased, and Average Transaction Size.
- **Line Items Breakdown**: Comprehensive breakdown of all items purchased on that day.
- **Printable Report**: Formatted with Santa Columbus Apartments letterhead and formal approval blocks.

### 3. 📊 Monthly Expenditure Report
- Select any month and year (e.g., October 2026).
- **Key Monthly Stats**: Total Monthly Spend, Daily Average, Peak Spending Day, and Total Fees Paid.
- **Interactive Daily Trend Chart**: Day-by-day bar chart showing spending progression across the entire month.
- **Printable Monthly Statement**: Formatted for management and audit reviews.

### 4. 📋 All Transactions History & Ledger
- Search by user name, item description, notes, or voucher reference.
- Filter by custom date ranges and sort by date or amount.
- **Expandable Item Rows**: Expand any voucher to see all item lines, unit prices, and fees.
- **Printable Voucher Modal**: Official Santa Columbus Apartments expense voucher.
- **Export to CSV**: Download filtered data directly into Excel/CSV spreadsheets.

### 5. 🔥 Firebase & Local Persistence
- **Firebase Realtime Database**: Real-time cloud synchronization at `sant_transactions`.
- **In-App Firebase Configuration**: Easily paste your Firebase config object directly inside the web interface without touching code.
- **Configured Project**: Uses the `santacolumbus-fb5e0` Realtime Database URL by default; enter the Firebase Web API key from the Firebase Console to connect.
- **Offline & Local Mode**: Works immediately out-of-the-box with reactive local storage and sample data.

---

## 🚀 Quick Start Guide

### Start the Development Server
```bash
npm run dev
```

The application is accessible at `http://localhost:5173` (or `http://127.0.0.1:5174`).

### Build for Production
```bash
npm run build
```

---

## 🛠 Tech Stack
- **React 19**
- **Vite 8**
- **Tailwind CSS v4**
- **Firebase 13 (Realtime Database)**
- **Lucide Icons**
- **Canvas Confetti**
