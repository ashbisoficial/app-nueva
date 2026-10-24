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
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { leerTextoReceta, parsearMedicamentos } from '../../core/receta-ocr';
import { subirArchivo } from '../../core/storage';
import { ValidacionFormulario, errorArchivo, primerError, reglas } from '../../core/validadores';
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
    IonSpinner,
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
  readonly hoyISO = new Date().toISOString().slice(0, 10);

  readonly v = new ValidacionFormulario({
    tipo: () => reglas.elegir(this.tipo),
    fecha: () => primerError(reglas.requerido(this.fecha), reglas.noFutura(this.fecha)),
    motivo: () => reglas.largoMaximo(this.motivo, 200),
    diagnostico: () => reglas.largoMaximo(this.diagnostico, 200),
    tratamientoIndicado: () => reglas.largoMaximo(this.tratamientoIndicado, 300),
    texto: () => reglas.largoMaximo(this.texto, 2000),
    // Mismo mínimo que exigen las reglas de Firestore (sección 3.3): una entrada nunca va vacía.
    contenido: () =>
      [this.motivo, this.diagnostico, this.tratamientoIndicado, this.texto].some((t) => t.trim()) ||
      this.medicamentosAGuardar().length ||
      this.examenesAGuardar().length
        ? null
        : 'La entrada está vacía: completa al menos el motivo, el diagnóstico, el tratamiento o las notas.',
    medicamentos: () =>
      this.muestraMedicamentos &&
      this.medicamentos.some((m) => [m.nombre, m.dosis, m.frecuencia].some((c) => !c?.trim()))
        ? 'Completa nombre, dosis y frecuencia de cada medicamento, o quita las filas vacías.'
        : null,
    examenes: () =>
      this.muestraExamenes && !this.examenesSeleccionados.length ? 'Marca al menos un examen solicitado.' : null,
    archivo: () => (this.archivo ? errorArchivo(this.archivo) : null),
  });

  private medicamentosAGuardar(): MedicamentoOrden[] {
    return this.muestraMedicamentos ? this.medicamentos : [];
  }

  private examenesAGuardar(): string[] {
    return this.muestraExamenes ? this.examenesSeleccionados : [];
  }

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
    this.v.revalidar('medicamentos');
  }

  /**
   * Leer receta con OCR (gratis, Tesseract.js, 100% en el navegador — ver
   * core/receta-ocr.ts): nunca reemplaza filas existentes ni guarda solo,
   * solo agrega lo que detectó para que la persona revise y corrija. Como
   * la letra manuscrita de médico suele leerse mal, siempre deja ver el
   * texto crudo reconocido además de las filas que haya podido armar.
   */
  analizandoReceta = signal(false);
  textoRecetaDetectado = signal<string | null>(null);
  errorReceta = signal<string | null>(null);

  async analizarFotoReceta(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const foto = input.files?.[0] ?? null;
    input.value = '';
    if (!foto) return;

    this.errorReceta.set(null);
    this.textoRecetaDetectado.set(null);
    this.analizandoReceta.set(true);
    try {
      const texto = await leerTextoReceta(foto);
      this.textoRecetaDetectado.set(texto.trim() || null);
      const detectados = parsearMedicamentos(texto);
      if (detectados.length) {
        this.medicamentos = [...this.medicamentos, ...detectados];
        this.v.revalidar('medicamentos');
        this.v.revalidar('contenido');
      }
    } catch {
      this.errorReceta.set('No se pudo leer la foto. Completa los medicamentos a mano.');
    } finally {
      this.analizandoReceta.set(false);
    }
  }

  toggleExamen(nombre: string, marcado: boolean): void {
    if (marcado) {
      this.examenesSeleccionados = [...this.examenesSeleccionados, nombre];
    } else {
      this.examenesSeleccionados = this.examenesSeleccionados.filter((e) => e !== nombre);
    }
    this.v.revalidar('examenes');
    this.v.revalidar('contenido');
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
    this.v.campo('archivo');
  }

  async guardar(): Promise<void> {
    this.error.set(null);
    const usuario = this.auth.usuario();
    if (!usuario) return;
    if (!this.v.todo()) {
      this.error.set('Revisa los campos marcados en rojo.');
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
        motivo: this.motivo.trim() || undefined,
        diagnostico: this.diagnostico.trim() || undefined,
        tratamientoIndicado: this.tratamientoIndicado.trim() || undefined,
        texto: this.texto.trim() || undefined,
        medicamentos: this.medicamentosAGuardar().length ? this.medicamentosAGuardar() : undefined,
        examenesSeleccionados: this.examenesAGuardar().length ? this.examenesAGuardar() : undefined,
        archivoUrl,
        especialidadId: this.especialidadId || undefined,
        autorUid: usuario.uid,
        autorNombre: usuario.displayName ?? usuario.email ?? 'Sin nombre',
      });

      await this.router.navigateByUrl(`/personas/${this.personaId}/historial`);
    } catch {
      // No se muestra el mensaje técnico de Firebase (viene en inglés y no le sirve al usuario).
      this.error.set('No se pudo guardar la entrada. Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }
}
