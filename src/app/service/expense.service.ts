import { Injectable } from '@angular/core';
import { Expense } from '../model/expense.model';

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

  private saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(this.expenses));
  }

  private loadExpenses() {
    const savedExpenses = localStorage.getItem('expenses');
    this.expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
  }
}
