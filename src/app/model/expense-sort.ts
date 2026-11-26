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
