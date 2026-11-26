import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  AlertController, IonBackButton, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonItem,
  IonItemDivider, IonItemGroup, IonLabel, IonList, IonNote, IonSearchbar, IonSelect, IonSelectOption, IonTitle,
  IonToolbar, ModalController, SearchbarCustomEvent, SelectCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, funnelOutline, swapVerticalOutline, trashOutline } from 'ionicons/icons';

import { ExpenseService } from '../service/expense.service';
import { StorageService } from '../service/storage.service';
import { Expense } from '../model/expense.model';
import { parseStoredCategories } from '../model/categories';
import {
  EXPENSE_SORT_OPTIONS, ExpenseFilter, ExpenseGroup, ExpenseSortOption, expenseCategories, filterExpenses,
  groupByMonth, isDateSort, isExpenseSortOption, isFiltered, NO_FILTER, sortExpenses, sumExpenses,
} from '../model/expense-list';
import { EditExpenseModalComponent } from './edit-expense-modal/edit-expense-modal.component';

/** ion-select value meaning "no category filter" (ion-select can't use null as an option value). */
export const ALL_CATEGORIES = '__all__';

@Component({
    selector: 'app-view-expenses',
    templateUrl: './view-expenses.page.html',
    styleUrls: ['./view-expenses.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
      IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonLabel, IonList,
      IonIcon, IonFooter, IonButton, IonSelect, IonSelectOption, IonSearchbar, IonItemGroup, IonItemDivider,
      IonNote, DecimalPipe,
    ],
})
export class ViewExpensesPage implements OnInit {
  private expenseService = inject(ExpenseService);
  private storageService = inject(StorageService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);

  constructor() {
    addIcons({ addCircleOutline, funnelOutline, swapVerticalOutline, trashOutline });
  }

  readonly sortOptions = EXPENSE_SORT_OPTIONS;
  readonly allCategories = ALL_CATEGORIES;
  sortOption: ExpenseSortOption = this.expenseService.getSortOption();
  filter: ExpenseFilter = { ...NO_FILTER };

  /** Number of saved expenses (before filtering). */
  savedCount = 0;
  /** Categories used by the saved expenses, for the filter. */
  categories: string[] = [];
  /** Expenses currently shown: filtered and sorted. */
  expenses: Expense[] = [];
  /** `expenses` split into month groups (one unlabeled group for amount sorts). */
  groups: ExpenseGroup[] = [];
  /** Total of the expenses currently shown. */
  totalExpense = 0;
  /** Total of all saved expenses. */
  overallTotal = 0;

  get filtered(): boolean {
    return isFiltered(this.filter);
  }

  async ngOnInit() {
    this.refresh();
  }

  async ionViewWillEnter() {
    this.refresh();
  }

  private refresh() {
    const saved = this.expenseService.getExpenses();
    this.savedCount = saved.length;
    this.categories = expenseCategories(saved);
    // Drop a category filter whose last expense was deleted or edited away.
    if (this.filter.category !== null && !this.categories.includes(this.filter.category)) {
      this.filter = { ...this.filter, category: null };
    }

    this.expenses = sortExpenses(filterExpenses(saved, this.filter), this.sortOption);
    this.groups = isDateSort(this.sortOption)
      ? groupByMonth(this.expenses)
      : [{ key: 'all', label: null, expenses: this.expenses, total: sumExpenses(this.expenses) }];
    this.totalExpense = sumExpenses(this.expenses);
    this.overallTotal = this.expenseService.getTotalExpense();
  }

  onSortChange(event: SelectCustomEvent) {
    const value = event.detail.value;
    if (!isExpenseSortOption(value) || value === this.sortOption) {
      return;
    }
    this.sortOption = value;
    this.expenseService.setSortOption(value);
    this.refresh();
  }

  onCategoryChange(event: SelectCustomEvent) {
    const value = event.detail.value;
    this.filter = { ...this.filter, category: value === ALL_CATEGORIES || !value ? null : String(value) };
    this.refresh();
  }

  onSearch(event: SearchbarCustomEvent) {
    this.filter = { ...this.filter, query: event.detail.value ?? '' };
    this.refresh();
  }

  clearFilters() {
    this.filter = { ...NO_FILTER };
    this.refresh();
  }

  navigateToAddExpense() {
    this.router.navigateByUrl('/add-expense');
  }

  async editExpense(expense: Expense) {
    const storedCategories = await this.storageService.getItem('category');
    const modal = await this.modalController.create({
      component: EditExpenseModalComponent,
      componentProps: { expense, categories: parseStoredCategories(storedCategories) },
    });
    await modal.present();

    const { data, role } = await modal.onDidDismiss<Expense>();
    if (role === 'save' && data) {
      this.expenseService.updateExpense(expense, data);
      this.refresh();
    }
  }

  async deleteExpense(expense: Expense, event?: Event) {
    // The trash button sits inside the tappable (edit) row.
    event?.stopPropagation();
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
            this.refresh();
          },
        },
      ],
    });

    await alert.present();
  }
}
