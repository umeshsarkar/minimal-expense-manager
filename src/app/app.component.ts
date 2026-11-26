import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, closeOutline, createOutline, eyeOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    // Standalone Ionic needs icons registered before <ion-icon name="..."> can render them.
    addIcons({ addCircleOutline, closeOutline, createOutline, eyeOutline, trashOutline });
  }
}
