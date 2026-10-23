import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { subirArchivo } from '../../core/storage';
import { EXAMENES_COMUNES, TIPOS_ENTRADA, type MedicamentoOrden, type TipoEntrada } from '../../models';
import { EspecialidadesService } from '../../services/especialidades.service';
import { HistorialService } from '../../services/historial.service';

@Component({
  selector: 'app-historial-nueva',
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
    IonListHeader,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonCheckbox,
  ],
  templateUrl: './historial-nueva.page.html',
})
export class HistorialNuevaPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private historialSvc = inject(HistorialService);
  private especialidadesSvc = inject(EspecialidadesService);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';
  tipos = TIPOS_ENTRADA;
  examenesComunes = EXAMENES_COMUNES;

  especialidades = toSignal(this.especialidadesSvc.activas$(this.personaId), { initialValue: [] });

  tipo: TipoEntrada = 'consulta';
  fecha = new Date().toISOString().slice(0, 10);
  especialidadId = '';
  motivo = '';
  diagnostico = '';
  tratamientoIndicado = '';
  texto = '';
  medicamentos: MedicamentoOrden[] = [];
  examenesSeleccionados: string[] = [];
  archivo: File | null = null;

  guardando = signal(false);
  error = signal<string | null>(null);

  get muestraMedicamentos(): boolean {
    return this.tipo === 'receta' || this.tipo === 'indicaciones_alta';
  }

  get muestraExamenes(): boolean {
    return this.tipo === 'solicitud_examen';
  }

  agregarMedicamento(): void {
    this.medicamentos.push({ nombre: '', dosis: '', frecuencia: '' });
  }

  quitarMedicamento(i: number): void {
    this.medicamentos.splice(i, 1);
  }

  toggleExamen(nombre: string, marcado: boolean): void {
    if (marcado) {
      this.examenesSeleccionados = [...this.examenesSeleccionados, nombre];
    } else {
      this.examenesSeleccionados = this.examenesSeleccionados.filter((e) => e !== nombre);
    }
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
  }

  /** Descarta filas de medicamento que quedaron en blanco (solo se tocó "Agregar medicamento" sin llenar nada). */
  private get medicamentosCompletos(): MedicamentoOrden[] {
    return this.medicamentos.filter((m) => m.nombre.trim() && m.dosis.trim() && m.frecuencia.trim());
  }

  /** Mismo mínimo que exige firestore.rules para esta colección (sección 3.3 del spec). */
  private get entradaVacia(): boolean {
    return (
      !this.motivo.trim() &&
      !this.diagnostico.trim() &&
      !this.tratamientoIndicado.trim() &&
      !this.texto.trim() &&
      !(this.muestraMedicamentos && this.medicamentosCompletos.length) &&
      !(this.muestraExamenes && this.examenesSeleccionados.length)
    );
  }

  async guardar(): Promise<void> {
    this.error.set(null);
    const usuario = this.auth.usuario();
    if (!usuario) return;
    if (this.muestraMedicamentos && this.medicamentos.length && !this.medicamentosCompletos.length) {
      this.error.set('Completa nombre, dosis y frecuencia de cada medicamento (o quítalo si no corresponde).');
      return;
    }
    if (this.entradaVacia) {
      this.error.set('Completa al menos un campo (motivo, diagnóstico, tratamiento, notas, medicamentos o exámenes).');
      return;
    }

    this.guardando.set(true);
    try {
      let archivoUrl: string | undefined;
      if (this.archivo) {
        const path = `personas/${this.personaId}/historial/${Date.now()}_${this.archivo.name}`;
        archivoUrl = await subirArchivo(path, this.archivo);
      }

      await this.historialSvc.crear(this.personaId, {
        tipo: this.tipo,
        fecha: this.fecha,
        motivo: this.motivo || undefined,
        diagnostico: this.diagnostico || undefined,
        tratamientoIndicado: this.tratamientoIndicado || undefined,
        texto: this.texto || undefined,
        medicamentos: this.muestraMedicamentos && this.medicamentosCompletos.length ? this.medicamentosCompletos : undefined,
        examenesSeleccionados:
          this.muestraExamenes && this.examenesSeleccionados.length ? this.examenesSeleccionados : undefined,
        archivoUrl,
        especialidadId: this.especialidadId || undefined,
        autorUid: usuario.uid,
        autorNombre: usuario.displayName ?? usuario.email ?? 'Sin nombre',
      });

      await this.router.navigateByUrl(`/personas/${this.personaId}/historial`);
    } catch (e) {
      this.error.set((e as Error).message ?? 'No se pudo guardar la entrada.');
    } finally {
      this.guardando.set(false);
    }
  }
}
