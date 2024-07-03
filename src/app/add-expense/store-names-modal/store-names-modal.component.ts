import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { StorageService } from 'src/app/service/storage.service';

@Component({
  selector: 'app-store-names-modal',
  templateUrl: './store-names-modal.component.html',
  styleUrls: ['./store-names-modal.component.scss'],
})
export class StoreNamesModalComponent implements OnInit {
  locations: string[] = [];
  newStoreName!: string;
  isInputInvalid = false;
  isModalOpen = true;

  constructor(
    private modalController: ModalController,
    private storageService: StorageService
  ) {}

  async ngOnInit() {
    await this.loadStoreNames();
  }

  // ngOnDestroy() {
  //   // this.modalController.onDidDismiss().then((data) => {
  //   //   if (data.data) {
  //   //     this.locations = data.data;
  //   //   }
  //   // });
  // }

  async loadStoreNames() {
    const storedLocations = await this.storageService.getItem('locations');
    this.locations = storedLocations ? JSON.parse(storedLocations) : ['Penny', 'Rewe', 'Lidl', 'Donaya', 'Aldi', 'DM', 'Rossmann', 'Other'];
  }

  async addStoreName() {
    if (this.newStoreName && !this.locations.includes(this.newStoreName)) {
      this.locations.push(this.newStoreName);
      await this.storageService.setItem('locations', JSON.stringify(this.locations));
      this.newStoreName = '';
      this.isInputInvalid = false; // reset the invalid state
    } else {
      this.isInputInvalid = true; // set the invalid state
    }
  }

  async removeStoreName(index: number) {
    this.locations.splice(index, 1);
    await this.storageService.setItem('locations', JSON.stringify(this.locations));
  }

  dismissModal() {
    this.modalController.dismiss(this.locations);
  }
}
