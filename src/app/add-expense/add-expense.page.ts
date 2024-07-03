import { Component, OnInit } from '@angular/core';
import { ExpenseService } from '../service/expense.service';
import { Expense } from '../model/expense.model';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { StorageService } from '../service/storage.service';
import { StoreNamesModalComponent } from './store-names-modal/store-names-modal.component';

@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.page.html',
  styleUrls: ['./add-expense.page.scss'],
})
export class AddExpensePage implements OnInit {
  date: any;
  location: string | null = null;
  amount!: number;
  isDatePickerOpen: boolean = false;
  locations: string[] = [];

  constructor(
    private expenseService: ExpenseService,
    private router: Router,
    private toastController: ToastController,
    private storageService: StorageService,
    private modalController: ModalController
  ) {
    this.setCurrentDate();
    this.loadStoreNames();
  }

  async ngOnInit(){
    await this.loadStoreNames();
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

  async loadStoreNames() {
    const storedLocations = await this.storageService.getItem('locations');
    this.locations = storedLocations ? JSON.parse(storedLocations) : ['Penny', 'Rewe', 'Lidl', 'Donaya', 'Aldi', 'DM', 'Rossmann', 'Other'];
  }

  async openStoreNamesModal() {
    const modal = await this.modalController.create({
      component: StoreNamesModalComponent,
      showBackdrop: true,
      cssClass: 'modal-element',
    });

    modal.onDidDismiss().then(() => this.loadStoreNames());

    await modal.present();
  }
}
