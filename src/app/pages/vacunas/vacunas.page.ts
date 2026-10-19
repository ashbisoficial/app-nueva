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
import { MENSAJES, ValidacionFormulario, primerError, reglas } from '../../core/validadores';
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

  readonly hoyISO = new Date().toISOString().slice(0, 10);
  mostrarForm = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);
  tipo = '';
  fechaAplicacion = new Date().toISOString().slice(0, 10);
  proximaFecha = '';
  notas = '';

  readonly v = new ValidacionFormulario({
    tipo: () => primerError(reglas.requerido(this.tipo), reglas.largoMaximo(this.tipo, 80)),
    fechaAplicacion: () => primerError(reglas.requerido(this.fechaAplicacion), reglas.noFutura(this.fechaAplicacion)),
    proximaFecha: () =>
      this.proximaFecha && this.fechaAplicacion && this.proximaFecha <= this.fechaAplicacion
        ? MENSAJES.fechaPosterior('la fecha de aplicación')
        : null,
    notas: () => reglas.largoMaximo(this.notas, 500),
  });

  abrirForm(): void {
    this.v.limpiar();
    this.error.set(null);
    this.tipo = '';
    this.fechaAplicacion = new Date().toISOString().slice(0, 10);
    this.proximaFecha = '';
    this.notas = '';
    this.mostrarForm.set(true);
  }

  async guardar(): Promise<void> {
    this.error.set(null);
    const uid = this.auth.usuario()?.uid;
    if (!uid || !this.v.todo()) return;
    this.guardando.set(true);
    try {
      await this.vacunasSvc.crear(this.personaId, {
        tipo: this.tipo.trim(),
        fechaAplicacion: this.fechaAplicacion,
        proximaFecha: this.proximaFecha || undefined,
        notas: this.notas.trim() || undefined,
        creadoPor: uid,
      });
      this.mostrarForm.set(false);
    } catch {
      this.error.set('No se pudo guardar la vacuna. Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.guardando.set(false);
    }
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
