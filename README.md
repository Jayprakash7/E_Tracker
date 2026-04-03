# 💼 E-Tracker — Personal Expense Tracker

A professional personal finance tracking app built with **React + Firebase**. Track your expenses, split bills with friends, monitor what you've actually spent from your own pocket, and see who owes you money — all in one place.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Workflow Guide](#-workflow-guide)
  - [1. Adding an Expense](#1-adding-an-expense)
  - [2. Splitting a Bill](#2-splitting-a-bill)
  - [3. Dashboard Overview](#3-dashboard-overview)
  - [4. Settling Up](#4-settling-up)
  - [5. Reports](#5-reports)
  - [6. Managing Categories](#6-managing-categories)
- [Key Concepts](#-key-concepts)
- [PWA — Install on Phone](#-pwa--install-on-phone)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Secure Login** | PIN-based authentication per user |
| 💸 **Expense Tracking** | Add, edit, delete expenses with categories |
| 🤝 **Bill Splitting** | Split any expense among multiple people with custom shares |
| 👤 **My Spend** | See only what YOU paid after deducting others' shares |
| 💰 **Money Received** | Track payments received — Today / This Week / This Month / All Time |
| 📊 **Personal Reports** | All charts and summaries show YOUR actual spend, not group totals |
| 🌙 **Dark / Light Mode** | Toggle between themes, preference saved automatically |
| 📱 **PWA** | Install on your phone home screen like a native app |
| ☁️ **Cloud Sync** | All data stored in Firebase — works across devices |

---

## 🛠 Tech Stack

- **Frontend** — React 18, React Router DOM v6
- **Charts** — Recharts
- **Icons** — Lucide React
- **Backend / DB** — Firebase Firestore (real-time)
- **Auth** — Firebase Auth
- **Build Tool** — Vite
- **Hosting** — Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & Run Locally

```bash
# Clone the repo
git clone <your-repo-url>
cd E_Tracker

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Build for Production

```bash
npm run build
```

---

## 📖 Workflow Guide

### 1. Adding an Expense

1. Tap **+** (floating button on mobile) or **+ Add Expense** on desktop
2. Fill in:
   - **Title** — e.g. "Dinner at Zomato"
   - **Amount** — total bill amount
   - **Category** — Food & Dining, Transport, etc.
   - **Date** — defaults to today
   - **Notes** — optional
3. Tap **Save Expense**

> ℹ️ The full amount is recorded under the selected category.

---

### 2. Splitting a Bill

Use this when you paid for a group and others need to pay you back.

1. While adding an expense, toggle **Split this expense**
2. Select people from your saved list (or add a new person)
3. Enter each person's share amount
4. Use **Equal Split** to divide evenly with one tap
5. Your share is automatically calculated: `Total − Others' shares`
6. Save the expense — the split is linked and tracked

**Example:**
```
Dinner Bill = ₹228
  Rahul  → ₹68
  Priya  → ₹68
  Amit   → ₹43
  ─────────────
  My share = ₹49  ✓
```

> ⚠️ Always use the split toggle when adding — do not add the split separately after saving, or the link may break.

---

### 3. Dashboard Overview

The Dashboard gives you a real-time snapshot:

| Card | What it shows |
|---|---|
| **This Month** | Total of all expenses recorded this month |
| **Today** | Total expenses recorded today |
| **My Spend** | What YOU actually paid this month (splits deducted) |
| **To Receive** | Total pending amount others still owe you |
| **Top Category** | Your highest-spending category this month |

**To Receive** shows **"All Clear ✓"** once everyone has paid — no more ₹0.00 clutter.

**Money Received section** (bottom of Dashboard):
- Switch between **Today / This Week / This Month / All Time**
- See each individual payment received with person name, expense, and date

---

### 4. Settling Up

When someone pays you back:

1. Go to **Splits** page (bottom nav)
2. Find the person under active splits
3. Tap **Settle** next to their name
4. Enter the amount they paid → **Confirm**
5. If they overpay, the excess is tracked as a credit automatically

Once fully settled, the split moves to **History** section.

**To delete a settled split:**
- Open **History** → tap the 🗑️ trash icon next to the split

> ⚠️ Deleting an expense also automatically deletes its linked split and all settlement history.

---

### 5. Reports

The Reports page shows **only your personal spend** — group totals are excluded.

| Section | Shows |
|---|---|
| **My Spend** card | Your personal total for selected month |
| **My Daily Avg** | Your average daily personal spend |
| **Top Category** | Category where YOU spent the most |
| **Weekly Breakdown** | Your spend per week (last 4 weeks) |
| **My Daily Spend** | Day-by-day bar chart for selected month |
| **My Category Breakdown** | Pie chart with your share per category |
| **My Category Summary** | Bar progress per category with percentages |
| **12-Month Trend** | Your personal spending trend over last 12 months |

Use the **Month / Year** filter at the top to view any past period.

---

### 6. Managing Categories

1. Go to **Settings → Manage Categories**
2. Add custom categories with a name, color, and emoji icon
3. Default categories (Food & Dining, Transport, etc.) are always available
4. Assign categories when adding expenses for better reporting

---

## 🔑 Key Concepts

### My Spend vs This Month Total

| | This Month | My Spend |
|---|---|---|
| **What it counts** | Every expense you recorded | Only your personal share |
| **Includes split amounts?** | Yes — full bill | No — others' shares deducted |
| **Use case** | Track total money that passed through | Know what actually left your pocket |

### How Split Linking Works

When you add an expense with a split, the split document stores the `expenseId`. The app uses this to calculate your personal amount:

```
Personal Amount = Expense Total − Sum of others' shares
```

If the expense is deleted, the linked split is deleted too — keeping your data clean.

---

## 📱 PWA — Install on Phone

E-Tracker works as a full PWA (Progressive Web App).

**Android (Chrome):**
1. Open the app in Chrome
2. Tap the **⋮ menu** → **Add to Home Screen**
3. Confirm — the app installs as **"E-Tracker"**

**iOS (Safari):**
1. Open the app in Safari
2. Tap the **Share** button → **Add to Home Screen**
3. Confirm — appears as **"E-Tracker"** on your home screen

Once installed, it opens fullscreen with no browser UI — just like a native app.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx        # Main dashboard with all stat cards
│   ├── AddExpense.jsx        # Add expense form with split section
│   ├── ExpenseList.jsx       # Expense list with filters
│   ├── Reports.jsx           # Personal spend reports & charts
│   ├── SplitsPage.jsx        # Split management & settle up
│   ├── SplitSection.jsx      # Split UI component (used in AddExpense)
│   ├── EditExpenseModal.jsx  # Edit existing expense
│   ├── SettleUpModal.jsx     # Settle payment modal
│   ├── ManageCategories.jsx  # Category management
│   ├── LoginPage.jsx         # PIN login screen
│   └── Navbar.jsx            # Sidebar + mobile nav + theme toggle
├── context/
│   ├── AppContext.jsx         # Expenses & categories state + Firebase
│   ├── SplitContext.jsx       # Splits, settlements, people state
│   ├── AuthContext.jsx        # Authentication state
│   └── ThemeContext.jsx       # Dark/light theme with localStorage
└── utils/
    └── helpers.js            # All pure utility functions
```

---

## �‍💻 Author

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Jayprakash7">
        <img src="https://github.com/Jayprakash7.png" width="100px" style="border-radius:50%" alt="Jayaprakash Biswal"/><br/>
        <strong>Jayaprakash Biswal</strong>
      </a>
      <br/>
      💼 Full Stack Java Developer @ Cozentus Technologies<br/>
      🎓 B.Tech — Computer Science & Engineering<br/>
      🏆 Multiple Hackathon Winner<br/>
      ✍️ Technical Content Writer
    </td>
  </tr>
</table>

| | |
|---|---|
| 🐙 **GitHub** | [@Jayprakash7](https://github.com/Jayprakash7) |
| 💼 **LinkedIn** | [jayaprakash-biswal](https://www.linkedin.com/in/jayaprakash-biswal-9918b1257) |
| ✍️ **Hashnode** | [@Jayprakash777](https://hashnode.com/@Jayprakash777) |

---

## �📄 License

Private project — all rights reserved.
