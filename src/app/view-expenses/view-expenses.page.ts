import { Component, OnInit } from '@angular/core';
import { ExpenseService } from '../service/expense.service';
import { Expense } from '../model/expense.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-expenses',
  templateUrl: './view-expenses.page.html',
  styleUrls: ['./view-expenses.page.scss'],
})
export class ViewExpensesPage implements OnInit {
  expenses: Expense[] = [];
  totalExpense: number = 0;

  constructor(private expenseService: ExpenseService, private router: Router) { }

  async ngOnInit() {
    await this.loadExpenses();
  }

  async ionViewWillEnter() {
    await this.loadExpenses();
  }

  private async loadExpenses() {
    this.expenses = this.expenseService.getExpenses();
    this.totalExpense = this.expenseService.getTotalExpense();
  }

  navigateToAddExpense() {
    this.router.navigateByUrl('/add-expense');
  }
}
