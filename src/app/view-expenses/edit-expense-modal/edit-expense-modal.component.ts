import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DatetimeCustomEvent, IonButton, IonButtons, IonContent, IonDatetime, IonHeader, IonInput, IonItem, IonLabel,
  IonList, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar, ModalController,
} from '@ionic/angular';

import { Expense } from '../../model/expense.model';
import { expenseDateToIso, isoToExpenseDate } from '../../model/expense-list';

/**
 * Edits one expense. Dismisses with role "save" and the updated Expense as
 * data, or role "cancel". Opened via ModalController with componentProps
 * { expense, categories }.
 */
@Component({
  selector: 'app-edit-expense-modal',
  templateUrl: './edit-expense-modal.component.html',
  styleUrls: ['./edit-expense-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput,
    IonSelect, IonSelectOption, IonLabel, IonDatetime, IonText,
  ],
})
export class EditExpenseModalComponent implements OnInit {
  private modalController = inject(ModalController);

  @Input() expense!: Expense;
  @Input() categories: string[] = [];

  name = '';
  category = '';
  isoDate: string | undefined;
  amount: number | null = null;
  categoryOptions: string[] = [];
  errorMessage = '';

  ngOnInit() {
    this.name = this.expense.name;
    this.category = this.expense.category;
    this.isoDate = expenseDateToIso(this.expense.date);
    this.amount = this.expense.amount;
    // Keep the expense's current category selectable even if it was removed from the list.
    this.categoryOptions = this.categories.includes(this.category)
      ? [...this.categories]
      : [...this.categories, this.category];
  }

  onDateChange(event: DatetimeCustomEvent) {
    const value = event.detail.value;
    this.isoDate = typeof value === 'string' ? value.slice(0, 10) : this.isoDate;
  }

  cancel() {
    this.modalController.dismiss(null, 'cancel');
  }

  save() {
    const name = (this.name ?? '').trim();
    const amount = Number(this.amount);
    if (!name || !(amount > 0) || !this.isoDate) {
      this.errorMessage = 'Please enter a name, a date and an amount greater than 0.';
      return;
    }

    const updated: Expense = {
      name,
      category: this.category || 'Uncategorised',
      // Keep the stored text untouched if the date was not changed.
      date: this.isoDate === expenseDateToIso(this.expense.date) ? this.expense.date : isoToExpenseDate(this.isoDate),
      amount,
    };
    this.modalController.dismiss(updated, 'save');
  }
}
