import { Component } from '@angular/core';
import { ExpenseService } from '../service/expense.service';
import { Expense } from '../model/expense.model';
import { Router } from '@angular/router';
import { Location } from '../model/location.enum';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.page.html',
  styleUrls: ['./add-expense.page.scss'],
})
export class AddExpensePage {
  date: any;
  location: Location | null = null;
  amount!: number;
  isDatePickerOpen: boolean = false;
  locations = Object.values(Location);

  constructor(private expenseService: ExpenseService, private router: Router, private toastController: ToastController) {
    this.setCurrentDate();
  }

  setCurrentDate() {
    const now = new Date();
    this.date = now.toLocaleDateString('de');
  }

  async addExpense() {
    if (this.date && this.location && this.amount > 0) {
      const newExpense: Expense = {
        date: this.date,
        location: this.location,
        amount: this.amount,
      };
      await this.expenseService.addExpense(newExpense);

      // Clear the form fields
      this.setCurrentDate();
      this.location = null;
      this.amount = 0;

      this.presentToast('Expense is added');
    } else {
      alert('Please fill in all fields with valid data');
    }
  }

  async presentToast(toastMessage: string) {
    const toast = await this.toastController.create({
      message: toastMessage,
      duration: 1000,
      position: 'bottom',
    });

    await toast.present();
  }

  navigateToViewExpenses() {
    this.router.navigateByUrl('/view-expenses');
  }

  openDatePicker() {
    this.isDatePickerOpen = true;
  }

  closeDatePicker() {
    this.isDatePickerOpen = false;
  }

  onDateSelected(event: any) {
    const selectedDate = new Date(event.detail.value);
    this.date = selectedDate.toLocaleDateString('de');
    this.closeDatePicker();
  }
}
