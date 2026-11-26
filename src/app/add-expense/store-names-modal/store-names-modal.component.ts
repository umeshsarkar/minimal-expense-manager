import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonList, IonText, IonTitle,
  IonToolbar, ModalController,
} from '@ionic/angular';
import { StorageService } from '../../service/storage.service';

@Component({
    selector: 'app-store-names-modal',
    templateUrl: './store-names-modal.component.html',
    styleUrls: ['./store-names-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
      FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonList,
      IonItem, IonInput, IonText,
    ],
})
export class StoreNamesModalComponent implements OnInit {
  private modalController = inject(ModalController);
  private storageService = inject(StorageService);

  categoryList: string[] = [];
  newCategory!: string;
  isInputInvalid = false;
  isModalOpen = true;

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
