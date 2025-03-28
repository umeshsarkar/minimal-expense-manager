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
  name!: string;
  date: any;
  category: string | null = null;
  amount!: number;
  isDatePickerOpen: boolean = false;
  categoryList: string[] = [];

  constructor(
    private expenseService: ExpenseService,
    private router: Router,
    private toastController: ToastController,
    private storageService: StorageService,
    private modalController: ModalController
  ) {
    this.setCurrentDate();
    this.loadCategoryList();
  }

  async ngOnInit() {
    await this.loadCategoryList();
  }

  setCurrentDate() {
    const now = new Date();
    this.date = now.toLocaleDateString('de');
  }

  async addExpense() {
    if (!this.category) {
      this.category = 'Uncategorised';
    }

    if (this.name && this.date && this.category && this.amount > 0) {
      const newExpense: Expense = {
        name: this.name,
        date: this.date,
        category: this.category,
        amount: this.amount,
      };
      await this.expenseService.addExpense(newExpense);

      // Clear the form fields
      this.name = '';
      this.setCurrentDate();
      this.category = null;
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

  async loadCategoryList() {
    const storedCategoryList = await this.storageService.getItem('category');
    this.categoryList = storedCategoryList
      ? JSON.parse(storedCategoryList)
      : ['Food', 'Internet', 'Transport', 'Car'];
  }

  async openStoreNamesModal() {
    const modal = await this.modalController.create({
      component: StoreNamesModalComponent,
      showBackdrop: true,
      cssClass: 'modal-element',
    });

    modal.onDidDismiss().then(() => this.loadCategoryList());

    await modal.present();
  }
}
