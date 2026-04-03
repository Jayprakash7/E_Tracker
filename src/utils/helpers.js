// Generate a unique ID
export const generateId = () =>
  Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

// Format currency in INR
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

// Format date to readable string
export const formatDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Get short date string: "1 Apr"
export const formatShortDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Return full month name
export const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[monthIndex];
};

// Return short month name
export const getShortMonthName = (monthIndex) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return months[monthIndex];
};

// Filter expenses for a specific month and year
export const getMonthExpenses = (expenses, month, year) =>
  expenses.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  });

// Sum amounts
export const getTotalAmount = (expenses) =>
  expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

// Group expenses by category, return sorted array
export const getCategoryTotals = (expenses, categories) => {
  const map = {};
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, total: 0, count: 0 };
  });
  expenses.forEach((e) => {
    if (map[e.categoryId]) {
      map[e.categoryId].total += parseFloat(e.amount || 0);
      map[e.categoryId].count += 1;
    }
  });
  return Object.values(map)
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total);
};

// Build daily totals for a month: [{day: "1", amount: 200}, ...]
export const getDailyTotals = (expenses, month, year) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daily = {};
  for (let d = 1; d <= daysInMonth; d++) daily[d] = 0;
  expenses.forEach((e) => {
    const date = new Date(e.date + 'T00:00:00');
    if (date.getMonth() === month && date.getFullYear() === year) {
      daily[date.getDate()] += parseFloat(e.amount || 0);
    }
  });
  return Object.entries(daily).map(([day, amount]) => ({
    day: parseInt(day),
    amount,
  }));
};

// Build last N months totals: [{month: "Jan", year: 2026, amount: 1200}, ...]
export const getMonthlyTotals = (expenses, count = 6) => {
  const result = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthExp = getMonthExpenses(expenses, month, year);
    result.push({
      month: getShortMonthName(month),
      year,
      amount: getTotalAmount(monthExp),
    });
  }
  return result;
};

// Today's date as YYYY-MM-DD
export const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ─── Received Money Helpers ────────────────────────────────────────────────────

/**
 * Flatten all settlements across all splits into a single array.
 * Returns [{amount, date, personName, personId, expenseTitle, note, settlementId}]
 * sorted newest first.
 */
export const getAllSettlements = (splits) => {
  const result = [];
  splits.forEach((split) => {
    (split.entries || []).forEach((entry) => {
      (entry.settlements || []).forEach((s) => {
        result.push({
          settlementId: s.id,
          amount:       parseFloat(s.amount || 0),
          date:         s.date,
          note:         s.note || '',
          personId:     entry.personId,
          personName:   entry.personName,
          expenseTitle: split.expenseTitle,
        });
      });
    });
  });
  return result.sort((a, b) => b.date.localeCompare(a.date));
};

/**
 * Sum settlements within a date range (inclusive).
 * startStr and endStr are YYYY-MM-DD strings.
 */
export const getReceivedInRange = (splits, startStr, endStr) => {
  const all = getAllSettlements(splits);
  return all
    .filter((s) => s.date >= startStr && s.date <= endStr)
    .reduce((sum, s) => sum + s.amount, 0);
};

// ─── Personal Spend Helpers ────────────────────────────────────────────────────

/**
 * How much Jay actually spent on an expense from his own pocket.
 * = expense.amount  - sum(split entries for that expense)
 * If no split exists, the full amount is personal.
 */
export const getPersonalAmount = (expense, splits) => {
  const split = splits.find((s) => s.expenseId === expense.id);
  if (!split) return parseFloat(expense.amount || 0);
  const othersShare = split.entries.reduce(
    (sum, e) => sum + parseFloat(e.shareAmount || 0),
    0
  );
  return Math.max(0, parseFloat(expense.amount || 0) - othersShare);
};

// Sum personal amounts across a list of expenses
export const getPersonalTotal = (expenses, splits) =>
  expenses.reduce((sum, e) => sum + getPersonalAmount(e, splits), 0);

// Group expenses by category using personal amounts only
export const getPersonalCategoryTotals = (expenses, categories, splits) => {
  const map = {};
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, total: 0, count: 0 };
  });
  expenses.forEach((e) => {
    if (map[e.categoryId]) {
      const personal = getPersonalAmount(e, splits);
      map[e.categoryId].total += personal;
      if (personal > 0) map[e.categoryId].count += 1;
    }
  });
  return Object.values(map)
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total);
};

// Build daily personal totals for a month
export const getPersonalDailyTotals = (expenses, month, year, splits) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daily = {};
  for (let d = 1; d <= daysInMonth; d++) daily[d] = 0;
  expenses.forEach((e) => {
    const date = new Date(e.date + 'T00:00:00');
    if (date.getMonth() === month && date.getFullYear() === year) {
      daily[date.getDate()] += getPersonalAmount(e, splits);
    }
  });
  return Object.entries(daily).map(([day, amount]) => ({
    day: parseInt(day),
    amount,
  }));
};

// Build last N months personal totals
export const getPersonalMonthlyTotals = (expenses, splits, count = 12) => {
  const result = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthExp = getMonthExpenses(expenses, month, year);
    result.push({
      month: getShortMonthName(month),
      year,
      amount: getPersonalTotal(monthExp, splits),
    });
  }
  return result;
};

/**
 * Last N calendar weeks (Mon–Sun) with total and personal spend.
 * Week 0 = current week (Mon to today).
 * Returns [{label, total, personal}, ...]
 */
export const getWeeklyTotals = (expenses, splits, weeksBack = 4) => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const result = [];

  for (let w = weeksBack - 1; w >= 0; w--) {
    const weekMon = new Date(now);
    weekMon.setDate(now.getDate() - daysToMonday - w * 7);
    weekMon.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekMon);
    weekEnd.setDate(weekMon.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekExpenses = expenses.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d >= weekMon && d <= weekEnd;
    });

    const label =
      w === 0
        ? 'This Week'
        : w === 1
        ? 'Last Week'
        : weekMon.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    result.push({
      label,
      total: getTotalAmount(weekExpenses),
      personal: getPersonalTotal(weekExpenses, splits),
    });
  }
  return result;
};
