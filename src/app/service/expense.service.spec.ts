import { TestBed } from '@angular/core/testing';
import { ExpenseService } from './expense.service';
import { Expense } from '../model/expense.model';

describe('ExpenseService', () => {
  const coffee: Expense = { name: 'Coffee', date: '1.2.2026', category: 'Food', amount: 3.5 };
  const bus: Expense = { name: 'Bus', date: '2.2.2026', category: 'Transport', amount: 2 };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('starts empty when nothing is saved', () => {
    const service = TestBed.inject(ExpenseService);
    expect(service.getExpenses()).toEqual([]);
    expect(service.getTotalExpense()).toBe(0);
  });

  it('adds expenses, totals them and persists to localStorage', () => {
    const service = TestBed.inject(ExpenseService);
    service.addExpense(coffee);
    service.addExpense(bus);

    expect(service.getExpenses()).toEqual([coffee, bus]);
    expect(service.getTotalExpense()).toBe(5.5);
    expect(JSON.parse(localStorage.getItem('expenses')!)).toEqual([coffee, bus]);
  });

  it('loads previously saved expenses', () => {
    localStorage.setItem('expenses', JSON.stringify([coffee]));
    const service = TestBed.inject(ExpenseService);
    expect(service.getExpenses()).toEqual([coffee]);
  });

  it('deletes an expense by index and persists the change', () => {
    const service = TestBed.inject(ExpenseService);
    service.addExpense(coffee);
    service.addExpense(bus);

    service.deleteExpense(0);

    expect(service.getExpenses()).toEqual([bus]);
    expect(JSON.parse(localStorage.getItem('expenses')!)).toEqual([bus]);
  });
});
