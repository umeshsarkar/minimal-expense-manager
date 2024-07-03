import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { RouterModule } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { StoreNamesModalComponent } from './add-expense/store-names-modal/store-names-modal.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [AppComponent,
    StoreNamesModalComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    RouterModule.forRoot([]),
    FormsModule,
  ],
  providers: [
    Storage,
    { provide: IonicRouteStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private storage: Storage) {
    this.init();
  }

  private async init() {
    await this.storage.create();
  }
}
