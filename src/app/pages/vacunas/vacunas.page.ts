import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { VacunasService } from '../../services/vacunas.service';

@Component({
  selector: 'app-vacunas',
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
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonModal,
    IonInput,
  ],
  templateUrl: './vacunas.page.html',
})
export class VacunasPage {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private vacunasSvc = inject(VacunasService);
  private alertCtrl = inject(AlertController);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';

  vacunas = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.vacunasSvc.lista$(params.get('id') ?? ''))),
    { initialValue: [] }
  );

  mostrarForm = signal(false);
  tipo = '';
  fechaAplicacion = new Date().toISOString().slice(0, 10);
  proximaFecha = '';
  notas = '';

  abrirForm(): void {
    this.tipo = '';
    this.fechaAplicacion = new Date().toISOString().slice(0, 10);
    this.proximaFecha = '';
    this.notas = '';
    this.mostrarForm.set(true);
  }

  async guardar(): Promise<void> {
    const uid = this.auth.usuario()?.uid;
    if (!uid || !this.tipo) return;
    await this.vacunasSvc.crear(this.personaId, {
      tipo: this.tipo,
      fechaAplicacion: this.fechaAplicacion,
      proximaFecha: this.proximaFecha || undefined,
      notas: this.notas || undefined,
      creadoPor: uid,
    });
    this.mostrarForm.set(false);
  }

  async confirmarEliminar(id: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar vacuna',
      message: '¿Eliminar este registro de vacuna?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.vacunasSvc.eliminar(this.personaId, id) },
      ],
    });
    await alert.present();
  }
}
