import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { StorageService } from 'src/app/service/storage.service';

@Component({
  selector: 'app-store-names-modal',
  templateUrl: './store-names-modal.component.html',
  styleUrls: ['./store-names-modal.component.scss'],
})
export class StoreNamesModalComponent implements OnInit {
  categoryList: string[] = [];
  newCategory!: string;
  isInputInvalid = false;
  isModalOpen = true;

  constructor(
    private modalController: ModalController,
    private storageService: StorageService
  ) {}

  async ngOnInit() {
    await this.loadCategoryList();
  }

  async loadCategoryList() {
    const storedLocations = await this.storageService.getItem('category');
    this.categoryList = storedLocations ? JSON.parse(storedLocations) : ['Food', 'Internet', 'Transport', 'Car'];
  }

  async addStoreName() {
    if (this.newCategory && !this.categoryList.includes(this.newCategory)) {
      this.categoryList.push(this.newCategory);
      await this.storageService.setItem('category', JSON.stringify(this.categoryList));
      this.newCategory = '';
      this.isInputInvalid = false;
    } else {
      this.isInputInvalid = true;
    }
  }

  async removeStoreName(index: number) {
    this.categoryList.splice(index, 1);
    await this.storageService.setItem('category', JSON.stringify(this.categoryList));
  }

  dismissModal() {
    this.modalController.dismiss(this.categoryList);
  }
}
