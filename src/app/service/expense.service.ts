import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Expense } from '../model/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private expenses: Expense[] = [];
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    this.loadExpenses();
  }

  private async loadExpenses() {
    const storedExpenses = await this._storage?.get('expenses');
    if (storedExpenses) {
      this.expenses = storedExpenses;
    }
  }

  addExpense(expense: Expense) {
    this.expenses.push(expense);
    this._storage?.set('expenses', this.expenses);
  }

  getExpenses(): Expense[] {
    return [...this.expenses];
  }

  getTotalExpense(): number {
    return this.expenses.reduce((total, expense) => total + expense.amount, 0);
  }
}
