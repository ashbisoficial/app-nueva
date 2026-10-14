import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  AlertController,
  IonBackButton,
  IonBadge,
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
import { MedicamentosActivosService } from '../../services/medicamentos-activos.service';
import { RecordatoriosLocalesService } from '../../services/recordatorios-locales.service';

@Component({
  selector: 'app-medicamentos',
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
    IonBadge,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonModal,
    IonInput,
  ],
  templateUrl: './medicamentos.page.html',
})
export class MedicamentosPage {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private medicamentosSvc = inject(MedicamentosActivosService);
  private recordatoriosSvc = inject(RecordatoriosLocalesService);
  private alertCtrl = inject(AlertController);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';

  medicamentos = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.medicamentosSvc.lista$(params.get('id') ?? ''))),
    { initialValue: [] }
  );

  mostrarForm = signal(false);
  nombre = '';
  dosis = '';
  viaAdministracion = '';
  frecuencia = '';
  fechaInicio = new Date().toISOString().slice(0, 10);
  fechaFin = '';
  horariosTexto = '';
  notas = '';

  tratamientoActivo(fechaFin?: string): boolean {
    if (!fechaFin) return true;
    return fechaFin >= new Date().toISOString().slice(0, 10);
  }

  tomadoHoy(ultimaTomaFecha?: string): boolean {
    return ultimaTomaFecha === new Date().toISOString().slice(0, 10);
  }

  async marcarTomado(id: string): Promise<void> {
    await this.medicamentosSvc.marcarTomado(this.personaId, id);
  }

  abrirForm(): void {
    this.nombre = '';
    this.dosis = '';
    this.viaAdministracion = '';
    this.frecuencia = '';
    this.fechaInicio = new Date().toISOString().slice(0, 10);
    this.fechaFin = '';
    this.horariosTexto = '';
    this.notas = '';
    this.mostrarForm.set(true);
  }

  async guardar(): Promise<void> {
    const uid = this.auth.usuario()?.uid;
    if (!uid || !this.nombre) return;

    const horarios = this.horariosTexto
      .split(',')
      .map((h) => h.trim())
      .filter((h) => /^\d{1,2}:\d{2}$/.test(h));

    const id = await this.medicamentosSvc.crear(this.personaId, {
      nombre: this.nombre,
      dosis: this.dosis,
      viaAdministracion: this.viaAdministracion || undefined,
      frecuencia: this.frecuencia,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin || undefined,
      horariosRecordatorio: horarios.length ? horarios : undefined,
      notas: this.notas || undefined,
      creadoPor: uid,
    });

    if (horarios.length) {
      await this.recordatoriosSvc.programarMedicamento(id, this.nombre, horarios);
    }

    this.mostrarForm.set(false);
  }

  async darDeBaja(id: string, cantidadHorarios: number): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Dar de baja tratamiento',
      message: 'Se cancelarán los recordatorios pendientes de este medicamento. ¿Continuar?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Dar de baja',
          role: 'destructive',
          handler: async () => {
            await this.medicamentosSvc.actualizar(this.personaId, id, {
              fechaFin: new Date().toISOString().slice(0, 10),
            });
            await this.recordatoriosSvc.cancelarMedicamento(id, cantidadHorarios);
          },
        },
      ],
    });
    await alert.present();
  }
}
