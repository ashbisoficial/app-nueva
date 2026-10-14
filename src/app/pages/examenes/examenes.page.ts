import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  IonBackButton,
  IonBadge,
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
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { subirArchivo } from '../../core/storage';
import { EXAMENES_COMUNES } from '../../models';
import { ExamenesService } from '../../services/examenes.service';

@Component({
  selector: 'app-examenes',
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
    IonModal,
    IonInput,
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './examenes.page.html',
})
export class ExamenesPage {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private examenesSvc = inject(ExamenesService);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';
  examenesComunes = EXAMENES_COMUNES;

  examenes = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.examenesSvc.lista$(params.get('id') ?? ''))),
    { initialValue: [] }
  );

  mostrarForm = signal(false);
  tipo = '';
  fechaProgramada = new Date().toISOString().slice(0, 10);
  lugar = '';
  notas = '';

  marcandoId = signal<string | null>(null);
  fechaRealizado = new Date().toISOString().slice(0, 10);
  archivoResultado: File | null = null;

  abrirForm(): void {
    this.tipo = '';
    this.fechaProgramada = new Date().toISOString().slice(0, 10);
    this.lugar = '';
    this.notas = '';
    this.mostrarForm.set(true);
  }

  async guardar(): Promise<void> {
    const uid = this.auth.usuario()?.uid;
    if (!uid || !this.tipo) return;
    await this.examenesSvc.crear(this.personaId, {
      tipo: this.tipo,
      fechaProgramada: this.fechaProgramada || undefined,
      realizado: false,
      lugar: this.lugar || undefined,
      notas: this.notas || undefined,
      creadoPor: uid,
    });
    this.mostrarForm.set(false);
  }

  abrirMarcarRealizado(id: string): void {
    this.fechaRealizado = new Date().toISOString().slice(0, 10);
    this.archivoResultado = null;
    this.marcandoId.set(id);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoResultado = input.files?.[0] ?? null;
  }

  async confirmarRealizado(): Promise<void> {
    const id = this.marcandoId();
    const usuario = this.auth.usuario();
    if (!id || !usuario) return;

    let resultadoUrl: string | undefined;
    if (this.archivoResultado) {
      const path = `personas/${this.personaId}/examenes/${Date.now()}_${this.archivoResultado.name}`;
      resultadoUrl = await subirArchivo(path, this.archivoResultado);
    }

    await this.examenesSvc.marcarRealizado(
      this.personaId,
      id,
      { fechaRealizado: this.fechaRealizado, resultadoUrl },
      { autorUid: usuario.uid, autorNombre: usuario.displayName ?? usuario.email ?? 'Sin nombre' }
    );

    this.marcandoId.set(null);
  }
}
