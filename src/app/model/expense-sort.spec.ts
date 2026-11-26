import { Expense } from './expense.model';
import { isExpenseSortOption, parseExpenseDate, sortExpenses } from './expense-sort';

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
