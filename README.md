# 💼 E-Tracker — Personal Expense Tracker

<div align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**A professional personal finance tracking app — track expenses, split bills, monitor your actual pocket spend, and see who owes you money. All in one place. All in real-time.**

</div>

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

<div align="center">

| 🔐 Secure Login | 💸 Expense Tracking | 🤝 Bill Splitting |
|:---:|:---:|:---:|
| PIN-based auth per user | Add, edit, delete with categories | Custom shares per person |
| **👤 My Spend** | **💰 Money Received** | **📊 Personal Reports** |
| Only YOUR pocket money | Today / Week / Month / All Time | Splits excluded from all charts |
| **🌙 Dark / Light Mode** | **📱 PWA Ready** | **☁️ Cloud Sync** |
| Theme saved automatically | Install like a native app | Firebase real-time across devices |

</div>

---

## 🛠 Tech Stack

<div align="center">

![React](https://skillicons.dev/icons?i=react,firebase,vite,js,html,css)

</div>

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router DOM v6 |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Backend / DB** | Firebase Firestore (real-time) |
| **Auth** | Firebase Authentication |
| **Build Tool** | Vite |
| **Hosting** | Vercel |

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
┌─────────────────────────────────────┐
│         Restaurant Bill             │
│         Total = ₹5,000              │
├─────────────────────────────────────┤
│  Kirti    →  ₹1,000                 │
│  Amitabh  →  ₹1,000                 │
│  Pritam   →  ₹1,000                 │
│  ─────────────────────              │
│  My Share =  ₹2,000  ✓             │
└─────────────────────────────────────┘
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


## Author

<div align="center">

<img src="https://github.com/Jayprakash7.png" width="120px"/>

### Jayaprakash Biswal

[![GitHub](https://img.shields.io/badge/GitHub-Jayprakash7-181717?style=for-the-badge&logo=github)](https://github.com/Jayprakash7)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/jayaprakash-biswal-9918b1257)
[![Hashnode](https://img.shields.io/badge/Hashnode-Blog-2962FF?style=for-the-badge&logo=hashnode)](https://hashnode.com/@Jayprakash777)

| | |
|:---:|:---:|
| Role | Full Stack Java Developer @ Cozentus Technologies |
| Education | B.Tech — Computer Science & Engineering |
| Achievements | NIRMAN 3.0 Winner  IC Hack 2.0 Finalist  Trithon 2023 Winner |
| Content | Technical Writer on Hashnode |
| Exploring | Spring Boot  AWS  Docker  Generative AI |

> *"Building scalable, impactful solutions — one commit at a time."*

</div>

---

## License

Private project — all rights reserved.