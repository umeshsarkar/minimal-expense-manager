import { Injectable } from '@angular/core';
import { Expense } from '../model/expense.model';
import { DEFAULT_EXPENSE_SORT, ExpenseSortOption, isExpenseSortOption } from '../model/expense-list';

const SORT_KEY = 'expenseSort';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private expenses: Expense[] = [];

  constructor() {
    this.loadExpenses();
  }

  addExpense(expense: Expense) {
    this.expenses.push(expense);
    this.saveExpenses();
  }

  getExpenses(): Expense[] {
    return this.expenses;
  }

  getTotalExpense(): number {
    return this.expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  deleteExpense(index: number) {
    this.expenses.splice(index, 1);
    this.saveExpenses();
  }

  /**
   * Deletes this exact expense object (as returned by getExpenses()).
   * Use this from sorted views, where the on-screen position is not the stored index.
   */
  removeExpense(expense: Expense): boolean {
    const index = this.expenses.indexOf(expense);
    if (index === -1) {
      return false;
    }
    this.deleteExpense(index);
    return true;
  }

  /**
   * Replaces this exact expense object (as returned by getExpenses()) with
   * `updated`, keeping its position so "same-day, most recently added" order is preserved.
   */
  updateExpense(original: Expense, updated: Expense): boolean {
    const index = this.expenses.indexOf(original);
    if (index === -1) {
      return false;
    }
    this.expenses[index] = { ...updated };
    this.saveExpenses();
    return true;
  }

  getSortOption(): ExpenseSortOption {
    const saved = localStorage.getItem(SORT_KEY);
    return isExpenseSortOption(saved) ? saved : DEFAULT_EXPENSE_SORT;
  }

  setSortOption(option: ExpenseSortOption) {
    localStorage.setItem(SORT_KEY, option);
  }

  private saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(this.expenses));
  }

  private loadExpenses() {
    const savedExpenses = localStorage.getItem('expenses');
    this.expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
  }
}
