import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { PersonasService } from '../../services/personas.service';

@Component({
  selector: 'app-canjear-pin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
  ],
  templateUrl: './canjear-pin.page.html',
})
export class CanjearPinPage {
  private personasSvc = inject(PersonasService);
  private router = inject(Router);

  pin = '';
  cargando = signal(false);
  error = signal<string | null>(null);

  async canjear(): Promise<void> {
    this.error.set(null);
    this.cargando.set(true);
    try {
      const { personaId } = await this.personasSvc.canjearPin(this.pin);
      await this.router.navigateByUrl(`/personas/${personaId}`);
    } catch {
      this.error.set('PIN inválido o vencido. Pedile a la persona que te comparta uno nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }
}
