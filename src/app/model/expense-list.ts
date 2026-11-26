import { Expense } from './expense.model';

export type ExpenseSortOption = 'newest' | 'oldest' | 'amount-desc' | 'amount-asc';

export const EXPENSE_SORT_OPTIONS: { value: ExpenseSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Amount: high to low' },
  { value: 'amount-asc', label: 'Amount: low to high' },
];

export const DEFAULT_EXPENSE_SORT: ExpenseSortOption = 'newest';

export function isExpenseSortOption(value: unknown): value is ExpenseSortOption {
  return EXPENSE_SORT_OPTIONS.some(option => option.value === value);
}

/**
 * Parses the stored expense date. Dates are saved with
 * `toLocaleDateString('de')`, i.e. "d.m.yyyy" (e.g. "15.1.2026").
 * Returns NaN for anything that can't be read.
 */
export function parseExpenseDate(date: string): number {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(date?.trim() ?? '');
  if (!match) {
    return NaN;
  }
  const [, day, month, year] = match.map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Stored "d.m.yyyy" → ISO "yyyy-mm-dd" (for ion-datetime), or undefined if unreadable. */
export function expenseDateToIso(date: string): string | undefined {
  const time = parseExpenseDate(date);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString().slice(0, 10);
}

/** ISO "yyyy-mm-dd" (or a full ISO timestamp) → stored "d.m.yyyy", the format the app saves. */
export function isoToExpenseDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return `${day}.${month}.${year}`;
}

export interface ExpenseFilter {
  /** Show only this category; null means all categories. */
  category: string | null;
  /** Case-insensitive text the expense name must contain. */
  query: string;
}

export const NO_FILTER: ExpenseFilter = { category: null, query: '' };

export function isFiltered(filter: ExpenseFilter): boolean {
  return filter.category !== null || filter.query.trim() !== '';
}

/** Returns the expenses matching the category and name search (input is not modified). */
export function filterExpenses(expenses: readonly Expense[], filter: ExpenseFilter): Expense[] {
  const query = filter.query.trim().toLocaleLowerCase();
  return expenses.filter(
    expense =>
      (filter.category === null || expense.category === filter.category) &&
      (query === '' || expense.name.toLocaleLowerCase().includes(query)),
  );
}

/** The distinct categories used by `expenses`, alphabetically. */
export function expenseCategories(expenses: readonly Expense[]): string[] {
  return [...new Set(expenses.map(expense => expense.category))].sort((a, b) => a.localeCompare(b));
}

export function sumExpenses(expenses: readonly Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export interface ExpenseGroup {
  /** Stable key: "2026-01", or "unknown" for unreadable dates. */
  key: string;
  /** Heading such as "January 2026"; null for an ungrouped list. */
  label: string | null;
  expenses: Expense[];
  total: number;
}

/**
 * Splits an already-sorted list into consecutive month groups, keeping the
 * list's order. Meant for date sorts, where each month forms one block.
 */
export function groupByMonth(sorted: readonly Expense[]): ExpenseGroup[] {
  const groups: ExpenseGroup[] = [];
  for (const expense of sorted) {
    const time = parseExpenseDate(expense.date);
    const key = Number.isNaN(time) ? 'unknown' : new Date(time).toISOString().slice(0, 7);
    let group = groups.at(-1);
    if (!group || group.key !== key) {
      const label = Number.isNaN(time)
        ? 'Unknown date'
        : new Date(time).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      group = { key, label, expenses: [], total: 0 };
      groups.push(group);
    }
    group.expenses.push(expense);
    group.total += expense.amount;
  }
  return groups;
}

/** Whether a sort option orders by date, i.e. month grouping makes sense. */
export function isDateSort(option: ExpenseSortOption): boolean {
  return option === 'newest' || option === 'oldest';
}

/**
 * Returns a sorted copy of `expenses` (the input array is not modified).
 *
 * Ties (same date, or same amount) keep a predictable order: for "newest" and
 * both amount sorts the most recently added expense comes first, for "oldest"
 * the earliest added comes first. Expenses with unreadable dates go last.
 */
export function sortExpenses(expenses: readonly Expense[], option: ExpenseSortOption): Expense[] {
  const entries = expenses.map((expense, addedOrder) => ({ expense, addedOrder, time: parseExpenseDate(expense.date) }));

  const byDate = (a: (typeof entries)[number], b: (typeof entries)[number], direction: 1 | -1) => {
    const aValid = !Number.isNaN(a.time);
    const bValid = !Number.isNaN(b.time);
    if (aValid !== bValid) {
      return aValid ? -1 : 1;
    }
    return aValid && a.time !== b.time ? direction * (a.time - b.time) : 0;
  };

  entries.sort((a, b) => {
    switch (option) {
      case 'oldest':
        return byDate(a, b, 1) || a.addedOrder - b.addedOrder;
      case 'amount-desc':
        return b.expense.amount - a.expense.amount || b.addedOrder - a.addedOrder;
      case 'amount-asc':
        return a.expense.amount - b.expense.amount || b.addedOrder - a.addedOrder;
      case 'newest':
      default:
        return byDate(a, b, -1) || b.addedOrder - a.addedOrder;
    }
  });

  return entries.map(entry => entry.expense);
}
