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
import { MENSAJES, ValidacionFormulario, primerError, reglas } from '../../core/validadores';
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
  guardando = signal(false);
  error = signal<string | null>(null);
  nombre = '';
  dosis = '';
  viaAdministracion = '';
  frecuencia = '';
  fechaInicio = new Date().toISOString().slice(0, 10);
  fechaFin = '';
  horariosTexto = '';
  notas = '';

  readonly v = new ValidacionFormulario({
    nombre: () => primerError(reglas.requerido(this.nombre), reglas.largoMaximo(this.nombre, 80)),
    dosis: () => primerError(reglas.requerido(this.dosis), reglas.largoMaximo(this.dosis, 60)),
    via: () => reglas.largoMaximo(this.viaAdministracion, 40),
    frecuencia: () => primerError(reglas.requerido(this.frecuencia), reglas.largoMaximo(this.frecuencia, 60)),
    fechaInicio: () => reglas.requerido(this.fechaInicio),
    fechaFin: () =>
      this.fechaFin && this.fechaInicio && this.fechaFin < this.fechaInicio
        ? 'No puede ser anterior a la fecha de inicio.'
        : null,
    horarios: () => (this.horariosInvalidos().length ? `${MENSAJES.hora} Revisa: ${this.horariosInvalidos().join(', ')}.` : null),
    notas: () => reglas.largoMaximo(this.notas, 500),
  });

  private partesHorarios(): string[] {
    return this.horariosTexto
      .split(',')
      .map((h) => h.trim())
      .filter((h) => h.length > 0);
  }

  /** Antes los horarios mal escritos se descartaban en silencio; ahora se avisa cuáles. */
  private horariosInvalidos(): string[] {
    return this.partesHorarios().filter((h) => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(h);
      return !m || Number(m[1]) > 23 || Number(m[2]) > 59;
    });
  }

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
    this.v.limpiar();
    this.error.set(null);
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
    this.error.set(null);
    const uid = this.auth.usuario()?.uid;
    if (!uid || !this.v.todo()) return;

    // Se normaliza a HH:MM ("8:00" → "08:00") para que los recordatorios ordenen bien.
    const horarios = this.partesHorarios().map((h) => h.padStart(5, '0'));

    this.guardando.set(true);
    try {
      const id = await this.medicamentosSvc.crear(this.personaId, {
        nombre: this.nombre.trim(),
        dosis: this.dosis.trim(),
        viaAdministracion: this.viaAdministracion.trim() || undefined,
        frecuencia: this.frecuencia.trim(),
        fechaInicio: this.fechaInicio,
        fechaFin: this.fechaFin || undefined,
        horariosRecordatorio: horarios.length ? horarios : undefined,
        notas: this.notas.trim() || undefined,
        creadoPor: uid,
      });

      if (horarios.length) {
        await this.recordatoriosSvc.programarMedicamento(id, this.nombre.trim(), horarios);
      }

      this.mostrarForm.set(false);
    } catch {
      this.error.set('No se pudo guardar el tratamiento. Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.guardando.set(false);
    }
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
