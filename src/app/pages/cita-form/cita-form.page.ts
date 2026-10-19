import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { descargarIcs } from '../../core/ics';
import { MENSAJES, ValidacionFormulario, primerError, reglas } from '../../core/validadores';
import { TIPOS_CITA, type TipoCita } from '../../models';
import { CitasService } from '../../services/citas.service';
import { EspecialidadesService } from '../../services/especialidades.service';
import { PersonasService } from '../../services/personas.service';
import { RecordatoriosLocalesService } from '../../services/recordatorios-locales.service';
import { nombreCompleto } from '../../shared/persona-nombre';

@Component({
  selector: 'app-cita-form',
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
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
  ],
  templateUrl: './cita-form.page.html',
})
export class CitaFormPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private citasSvc = inject(CitasService);
  private personasSvc = inject(PersonasService);
  private recordatoriosSvc = inject(RecordatoriosLocalesService);
  private alertCtrl = inject(AlertController);
  private especialidadesSvc = inject(EspecialidadesService);

  personaId = this.route.snapshot.paramMap.get('personaId') ?? '';
  citaId = this.route.snapshot.paramMap.get('citaId');

  especialidades = toSignal(this.especialidadesSvc.activas$(this.personaId), { initialValue: [] });

  titulo = '';
  tipo: TipoCita = 'control';
  fechaInicio = new Date().toISOString().slice(0, 16);
  fechaFin = '';
  lugar = '';
  notas = '';
  especialidadId = '';

  guardando = signal(false);
  error = signal<string | null>(null);

  readonly v = new ValidacionFormulario({
    titulo: () => primerError(reglas.requerido(this.titulo), reglas.largoMaximo(this.titulo, 100)),
    tipo: () => reglas.elegir(this.tipo),
    fechaInicio: () => reglas.requerido(this.fechaInicio),
    fechaFin: () =>
      this.fechaFin && this.fechaInicio && this.fechaFin <= this.fechaInicio
        ? MENSAJES.fechaPosterior('la fecha de inicio')
        : null,
    lugar: () => reglas.largoMaximo(this.lugar, 120),
    notas: () => reglas.largoMaximo(this.notas, 1000),
  });

  async ngOnInit(): Promise<void> {
    if (!this.citaId) return;
    const cita = await this.citasSvc.obtener(this.personaId, this.citaId);
    if (!cita) return;
    this.titulo = cita.titulo;
    this.tipo = cita.tipo ?? 'control';
    this.fechaInicio = cita.fechaInicio?.slice(0, 16) ?? this.fechaInicio;
    this.fechaFin = cita.fechaFin?.slice(0, 16) ?? '';
    this.lugar = cita.lugar ?? '';
    this.notas = cita.notas ?? '';
    this.especialidadId = cita.especialidadId ?? '';
  }

  get tipos() {
    return TIPOS_CITA;
  }

  async guardar(): Promise<void> {
    this.error.set(null);
    const uid = this.auth.usuario()?.uid;
    if (!uid) return;
    if (!this.v.todo()) {
      this.error.set('Revisa los campos marcados en rojo.');
      return;
    }

    this.guardando.set(true);
    try {
      const persona = await this.personasSvc.obtener(this.personaId);

      const datos = {
        titulo: this.titulo.trim(),
        tipo: this.tipo,
        fechaInicio: this.fechaInicio,
        fechaFin: this.fechaFin || undefined,
        lugar: this.lugar || undefined,
        notas: this.notas || undefined,
        especialidadId: this.especialidadId || undefined,
        creadoPor: uid,
        personaId: this.personaId,
        personaNombre: persona ? nombreCompleto(persona) : '',
      };

      if (this.citaId) {
        await this.citasSvc.actualizar(this.personaId, this.citaId, datos);
        await this.recordatoriosSvc.cancelarCita(this.citaId);
        await this.recordatoriosSvc.programarCita(this.citaId, this.titulo, this.fechaInicio);
      } else {
        const id = await this.citasSvc.crear(this.personaId, datos);
        await this.recordatoriosSvc.programarCita(id, this.titulo, this.fechaInicio);
      }

      await this.router.navigateByUrl('/agenda');
    } catch {
      this.error.set('No se pudo guardar la cita. Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  exportarIcs(): void {
    descargarIcs(
      { titulo: this.titulo, fechaInicio: this.fechaInicio, fechaFin: this.fechaFin, lugar: this.lugar, notas: this.notas },
      `${this.titulo || 'cita'}.ics`
    );
  }

  async eliminar(): Promise<void> {
    if (!this.citaId) return;
    const alert = await this.alertCtrl.create({
      header: 'Eliminar cita',
      message: '¿Eliminar esta cita?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.citasSvc.eliminar(this.personaId, this.citaId!);
            await this.recordatoriosSvc.cancelarCita(this.citaId!);
            await this.router.navigateByUrl('/agenda');
          },
        },
      ],
    });
    await alert.present();
  }
}
