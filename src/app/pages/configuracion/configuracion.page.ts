import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
  ],
  templateUrl: './configuracion.page.html',
})
export class ConfiguracionPage {
  auth = inject(AuthService);
  private router = inject(Router);

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
