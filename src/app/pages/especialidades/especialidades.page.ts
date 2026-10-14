import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { EspecialidadesService } from '../../services/especialidades.service';

@Component({
  selector: 'app-especialidades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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
    IonModal,
    IonInput,
  ],
  templateUrl: './especialidades.page.html',
})
export class EspecialidadesPage {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private especialidadesSvc = inject(EspecialidadesService);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';

  especialidades = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.especialidadesSvc.activas$(params.get('id') ?? ''))),
    { initialValue: [] }
  );

  mostrarForm = signal(false);
  nombre = '';
  notas = '';

  abrirForm(): void {
    this.nombre = '';
    this.notas = '';
    this.mostrarForm.set(true);
  }

  async guardar(): Promise<void> {
    const uid = this.auth.usuario()?.uid;
    if (!uid || !this.nombre) return;
    await this.especialidadesSvc.crear(this.personaId, {
      nombre: this.nombre,
      notas: this.notas || undefined,
      activa: true,
      creadoPor: uid,
      creadoEn: new Date().toISOString(),
    });
    this.mostrarForm.set(false);
  }
}
