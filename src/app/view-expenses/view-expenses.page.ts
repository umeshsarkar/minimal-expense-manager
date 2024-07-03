import { Component, OnInit } from '@angular/core';
import { ExpenseService } from '../service/expense.service';
import { Expense } from '../model/expense.model';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-view-expenses',
  templateUrl: './view-expenses.page.html',
  styleUrls: ['./view-expenses.page.scss'],
})
export class ViewExpensesPage implements OnInit {
  expenses: Expense[] = [];
  totalExpense: number = 0;

  constructor(
    private expenseService: ExpenseService,
    private router: Router,
    private alertController: AlertController
  ) {}

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

  async deleteExpense(index: number) {
    const expense = this.expenses[index];
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: `Are you sure you want to delete the expense name "${expense.name}" and amount of "${expense.amount} €"?`,
      cssClass: 'my-custom-class',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Delete operation cancelled');
          },
        },
        {
          text: 'Delete',
          handler: async () => {
            await this.expenseService.deleteExpense(index);
            await this.loadExpenses();
          },
        },
      ],
    });

    await alert.present();
  }
}
