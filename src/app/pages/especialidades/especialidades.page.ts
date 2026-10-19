import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
import { ValidacionFormulario, primerError, reglas } from '../../core/validadores';
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

  /** Búsqueda rápida (sección 4.7): encontrar una especialidad puntual sin
   *  tener que escanear toda la lista, útil apenas crece más allá de unas
   *  pocas (ej. varios tratamientos crónicos a la vez). */
  busqueda = signal('');
  especialidadesFiltradas = computed(() => {
    const texto = this.normalizar(this.busqueda());
    if (!texto) return this.especialidades();
    return this.especialidades().filter((e) => this.normalizar(e.nombre).includes(texto));
  });

  private normalizar(texto: string): string {
    return texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  mostrarForm = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);
  nombre = '';
  notas = '';

  readonly v = new ValidacionFormulario({
    nombre: () =>
      primerError(
        reglas.requerido(this.nombre),
        reglas.largoMaximo(this.nombre, 80),
        this.especialidades().some((e) => this.normalizar(e.nombre) === this.normalizar(this.nombre))
          ? 'Ya existe una especialidad con ese nombre.'
          : null
      ),
    notas: () => reglas.largoMaximo(this.notas, 500),
  });

  abrirForm(): void {
    this.v.limpiar();
    this.error.set(null);
    this.nombre = '';
    this.notas = '';
    this.mostrarForm.set(true);
  }

  async guardar(): Promise<void> {
    this.error.set(null);
    const uid = this.auth.usuario()?.uid;
    if (!uid || !this.v.todo()) return;
    this.guardando.set(true);
    try {
      await this.especialidadesSvc.crear(this.personaId, {
        nombre: this.nombre.trim(),
        notas: this.notas.trim() || undefined,
        activa: true,
        creadoPor: uid,
        creadoEn: new Date().toISOString(),
      });
      this.mostrarForm.set(false);
    } catch {
      this.error.set('No se pudo guardar la especialidad. Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }
}
