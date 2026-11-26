import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ExpenseService } from '../service/expense.service';
import { Expense } from '../model/expense.model';
import { EXPENSE_SORT_OPTIONS, ExpenseSortOption, isExpenseSortOption, sortExpenses } from '../model/expense-sort';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  AlertController, IonBackButton, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonItem,
  IonLabel, IonList, IonSelect, IonSelectOption, IonTitle, IonToolbar, SelectCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, swapVerticalOutline, trashOutline } from 'ionicons/icons';

@Component({
    selector: 'app-view-expenses',
    templateUrl: './view-expenses.page.html',
    styleUrls: ['./view-expenses.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
      IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonLabel, IonList,
      IonIcon, IonFooter, IonButton, IonSelect, IonSelectOption, DecimalPipe,
    ],
})
export class ViewExpensesPage implements OnInit {
  private expenseService = inject(ExpenseService);
  private router = inject(Router);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({ addCircleOutline, swapVerticalOutline, trashOutline });
  }

  readonly sortOptions = EXPENSE_SORT_OPTIONS;
  sortOption: ExpenseSortOption = this.expenseService.getSortOption();
  expenses: Expense[] = [];
  totalExpense: number = 0;

  async ngOnInit() {
    await this.loadExpenses();
  }

  async ionViewWillEnter() {
    await this.loadExpenses();
  }

  private async loadExpenses() {
    this.expenses = sortExpenses(this.expenseService.getExpenses(), this.sortOption);
    this.totalExpense = this.expenseService.getTotalExpense();
  }

  onSortChange(event: SelectCustomEvent) {
    const value = event.detail.value;
    if (!isExpenseSortOption(value) || value === this.sortOption) {
      return;
    }
    this.sortOption = value;
    this.expenseService.setSortOption(value);
    this.expenses = sortExpenses(this.expenseService.getExpenses(), value);
  }

  navigateToAddExpense() {
    this.router.navigateByUrl('/add-expense');
  }

  async deleteExpense(expense: Expense) {
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
            this.expenseService.removeExpense(expense);
            await this.loadExpenses();
          },
        },
      ],
    });

    await alert.present();
  }
}
