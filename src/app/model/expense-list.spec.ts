import { Expense } from './expense.model';
import {
  expenseCategories, expenseDateToIso, filterExpenses, groupByMonth, isDateSort, isExpenseSortOption, isFiltered,
  isoToExpenseDate, NO_FILTER, parseExpenseDate, sortExpenses, sumExpenses,
} from './expense-list';

const e = (name: string, date: string, amount: number): Expense => ({ name, date, category: 'Food', amount });

describe('parseExpenseDate', () => {
  it('reads the stored "d.m.yyyy" format', () => {
    expect(parseExpenseDate('15.1.2026')).toBe(Date.UTC(2026, 0, 15));
    expect(parseExpenseDate('05.11.2025')).toBe(Date.UTC(2025, 10, 5));
  });

  it('returns NaN for unreadable dates', () => {
    expect(parseExpenseDate('')).toBeNaN();
    expect(parseExpenseDate('2026-01-15')).toBeNaN();
  });
});

describe('sortExpenses', () => {
  // Stored in the order they were added.
  const added = [
    e('old', '3.1.2026', 20),
    e('newest', '12.1.2026', 5),
    e('mid', '9.1.2026', 100), // "9.1." must sort before "10.1." (not as text)
    e('mid2', '10.1.2026', 20),
  ];

  it('sorts newest first by real date, not by text', () => {
    expect(sortExpenses(added, 'newest').map(x => x.name)).toEqual(['newest', 'mid2', 'mid', 'old']);
  });

  it('sorts oldest first', () => {
    expect(sortExpenses(added, 'oldest').map(x => x.name)).toEqual(['old', 'mid', 'mid2', 'newest']);
  });

  it('sorts by amount high to low, newest-added first on ties', () => {
    expect(sortExpenses(added, 'amount-desc').map(x => x.name)).toEqual(['mid', 'mid2', 'old', 'newest']);
  });

  it('sorts by amount low to high, newest-added first on ties', () => {
    expect(sortExpenses(added, 'amount-asc').map(x => x.name)).toEqual(['newest', 'mid2', 'old', 'mid']);
  });

  it('puts the most recently added first among same-day expenses', () => {
    const sameDay = [e('first', '1.2.2026', 1), e('second', '1.2.2026', 2)];
    expect(sortExpenses(sameDay, 'newest').map(x => x.name)).toEqual(['second', 'first']);
    expect(sortExpenses(sameDay, 'oldest').map(x => x.name)).toEqual(['first', 'second']);
  });

  it('puts unreadable dates last', () => {
    const list = [e('broken', 'n/a', 1), e('ok', '1.1.2026', 1)];
    expect(sortExpenses(list, 'newest').map(x => x.name)).toEqual(['ok', 'broken']);
    expect(sortExpenses(list, 'oldest').map(x => x.name)).toEqual(['ok', 'broken']);
  });

  it('does not modify the input array and keeps the same objects', () => {
    const copy = [...added];
    const sorted = sortExpenses(added, 'oldest');
    expect(added).toEqual(copy);
    expect(sorted[0]).toBe(added[0]);
  });
});

describe('isExpenseSortOption', () => {
  it('accepts only known options', () => {
    expect(isExpenseSortOption('newest')).toBe(true);
    expect(isExpenseSortOption('amount-asc')).toBe(true);
    expect(isExpenseSortOption('name')).toBe(false);
    expect(isExpenseSortOption(null)).toBe(false);
  });
});

describe('date conversion', () => {
  it('converts stored dates to ISO and back', () => {
    expect(expenseDateToIso('5.1.2026')).toBe('2026-01-05');
    expect(expenseDateToIso('31.12.2025')).toBe('2025-12-31');
    expect(expenseDateToIso('bad')).toBeUndefined();
    expect(isoToExpenseDate('2026-01-05')).toBe('5.1.2026');
    expect(isoToExpenseDate('2026-03-15T10:30:00')).toBe('15.3.2026');
  });
});

describe('filterExpenses', () => {
  const list = [
    { name: 'Weekly groceries', date: '1.1.2026', category: 'Food', amount: 50 },
    { name: 'Bus ticket', date: '2.1.2026', category: 'Transport', amount: 3 },
    { name: 'Groceries top-up', date: '3.1.2026', category: 'Food', amount: 12 },
  ];

  it('returns everything without a filter', () => {
    expect(filterExpenses(list, NO_FILTER)).toEqual(list);
    expect(isFiltered(NO_FILTER)).toBe(false);
  });

  it('filters by category', () => {
    const filter = { category: 'Food', query: '' };
    expect(filterExpenses(list, filter).map(x => x.name)).toEqual(['Weekly groceries', 'Groceries top-up']);
    expect(isFiltered(filter)).toBe(true);
  });

  it('searches names case-insensitively, ignoring surrounding spaces', () => {
    expect(filterExpenses(list, { category: null, query: '  GROCER ' }).map(x => x.name)).toEqual([
      'Weekly groceries',
      'Groceries top-up',
    ]);
    expect(isFiltered({ category: null, query: '   ' })).toBe(false);
  });

  it('combines category and search', () => {
    expect(filterExpenses(list, { category: 'Transport', query: 'grocer' })).toEqual([]);
    expect(filterExpenses(list, { category: 'Food', query: 'top' }).map(x => x.name)).toEqual(['Groceries top-up']);
  });

  it('lists the distinct categories alphabetically and sums amounts', () => {
    expect(expenseCategories(list)).toEqual(['Food', 'Transport']);
    expect(sumExpenses(list)).toBe(65);
    expect(sumExpenses([])).toBe(0);
  });
});

describe('groupByMonth', () => {
  it('groups a date-sorted list into months with subtotals, keeping order', () => {
    const sorted = sortExpenses(
      [
        e('dec', '20.12.2025', 10),
        e('jan-a', '3.1.2026', 20),
        e('jan-b', '28.1.2026', 5),
        e('feb', '1.2.2026', 1),
      ],
      'newest',
    );
    const groups = groupByMonth(sorted);

    expect(groups.map(g => g.label)).toEqual(['February 2026', 'January 2026', 'December 2025']);
    expect(groups.map(g => g.expenses.map(x => x.name))).toEqual([['feb'], ['jan-b', 'jan-a'], ['dec']]);
    expect(groups.map(g => g.total)).toEqual([1, 25, 10]);
  });

  it('puts unreadable dates in an "Unknown date" group', () => {
    const groups = groupByMonth(sortExpenses([e('x', '??', 1), e('y', '1.1.2026', 2)], 'newest'));
    expect(groups.map(g => [g.key, g.label])).toEqual([['2026-01', 'January 2026'], ['unknown', 'Unknown date']]);
  });

  it('only date sorts are grouped', () => {
    expect(isDateSort('newest')).toBe(true);
    expect(isDateSort('oldest')).toBe(true);
    expect(isDateSort('amount-desc')).toBe(false);
  });
});
