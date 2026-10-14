import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { CATEGORIAS_DOCUMENTO, type CategoriaDocumento } from '../../models';
import { DocumentosService } from '../../services/documentos.service';
import { EspecialidadesService } from '../../services/especialidades.service';

@Component({
  selector: 'app-documentos',
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
    IonModal,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
  ],
  templateUrl: './documentos.page.html',
})
export class DocumentosPage {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private documentosSvc = inject(DocumentosService);
  private especialidadesSvc = inject(EspecialidadesService);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';
  categorias = CATEGORIAS_DOCUMENTO;

  documentos = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.documentosSvc.lista$(params.get('id') ?? ''))),
    { initialValue: [] }
  );

  especialidades = toSignal(this.especialidadesSvc.activas$(this.personaId), { initialValue: [] });

  filtroCategoria = signal<CategoriaDocumento | 'todas'>('todas');

  onFiltroChange(valor: string | number | undefined): void {
    this.filtroCategoria.set((valor as CategoriaDocumento | 'todas') ?? 'todas');
  }

  documentosFiltrados = computed(() => {
    const filtro = this.filtroCategoria();
    const lista = this.documentos();
    return filtro === 'todas' ? lista : lista.filter((d) => d.categoria === filtro);
  });

  mostrarForm = signal(false);
  nombre = '';
  categoria: CategoriaDocumento = 'otro';
  especialidadId = '';
  notas = '';
  archivo: File | null = null;
  subiendo = signal(false);

  constructor() {
    // Acceso directo desde el Home (sección 8): llega con ?subir=1 para abrir
    // la cámara de una, sin tener que tocar el botón "+" de esta pantalla.
    if (this.route.snapshot.queryParamMap.get('subir')) {
      this.abrirForm();
    }
  }

  abrirForm(): void {
    this.nombre = '';
    this.categoria = 'otro';
    this.especialidadId = '';
    this.notas = '';
    this.archivo = null;
    this.mostrarForm.set(true);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
    if (this.archivo && !this.nombre) {
      this.nombre = this.archivo.name;
    }
  }

  async guardar(): Promise<void> {
    if (!this.archivo || !this.nombre) return;
    this.subiendo.set(true);
    try {
      const archivoUrl = await this.documentosSvc.subirArchivo(this.personaId, this.archivo, this.archivo.name);
      await this.documentosSvc.crear(this.personaId, {
        nombre: this.nombre,
        categoria: this.categoria,
        archivoUrl,
        subidoEn: new Date().toISOString(),
        notas: this.notas || undefined,
        especialidadId: this.especialidadId || undefined,
      });
      this.mostrarForm.set(false);
    } finally {
      this.subiendo.set(false);
    }
  }
}
