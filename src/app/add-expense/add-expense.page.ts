import { Component } from '@angular/core';
import { ExpenseService } from '../service/expense.service';
import { Expense } from '../model/expense.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.page.html',
  styleUrls: ['./add-expense.page.scss'],
})
export class AddExpensePage {
  date: string = '';
  location: string = '';
  amount: number = 0;

  constructor(private expenseService: ExpenseService, private router: Router) { }

  addExpense() {
    const newExpense: Expense = {
      date: this.date,
      location: this.location,
      amount: this.amount,
    };
    this.expenseService.addExpense(newExpense);
    this.router.navigateByUrl('/view-expenses');
  }
}
