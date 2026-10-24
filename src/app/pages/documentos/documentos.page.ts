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
import { fotosAPdf } from '../../core/foto-a-pdf';
import { ValidacionFormulario, errorArchivo, primerError, reglas } from '../../core/validadores';
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
  /** Fotos de un "escaneo" de varias páginas (sección 4.1): se combinan en un único PDF recién al guardar. */
  fotos: File[] = [];
  subiendo = signal(false);
  error = signal<string | null>(null);

  readonly v = new ValidacionFormulario({
    archivo: () => {
      if (this.fotos.length) return this.fotos.map((f) => errorArchivo(f, { permitePdf: false })).find((e) => e) ?? null;
      return this.archivo ? errorArchivo(this.archivo) : 'Elige la foto o el PDF del documento.';
    },
    nombre: () => primerError(reglas.requerido(this.nombre), reglas.largoMaximo(this.nombre, 100)),
    categoria: () => reglas.elegir(this.categoria),
    notas: () => reglas.largoMaximo(this.notas, 500),
  });

  constructor() {
    // Acceso directo desde el Home (sección 8): llega con ?subir=1 para abrir
    // la cámara de una, sin tener que tocar el botón "+" de esta pantalla.
    if (this.route.snapshot.queryParamMap.get('subir')) {
      this.abrirForm();
    }
  }

  abrirForm(): void {
    this.v.limpiar();
    this.error.set(null);
    this.nombre = '';
    this.categoria = 'otro';
    this.especialidadId = '';
    this.notas = '';
    this.archivo = null;
    for (const url of this.urlsObjeto.values()) URL.revokeObjectURL(url);
    this.urlsObjeto.clear();
    this.fotos = [];
    this.error.set(null);
    this.mostrarForm.set(true);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const elegido = input.files?.[0] ?? null;
    // Permite elegir el mismo archivo de nuevo (ej. sacar otra foto con la
    // cámara y volver a tocar "Agregar otra página") sin que el navegador
    // ignore el evento por no haber "cambiado" el valor del input.
    input.value = '';
    if (!elegido) return;

    if (elegido.type === 'application/pdf') {
      this.archivo = elegido;
      this.fotos = [];
      if (!this.nombre) this.nombre = elegido.name.replace(/\.[^.]+$/, '');
    } else {
      // Una foto nunca reemplaza a la anterior: se agrega como otra página
      // del mismo "escaneo" (ver fotosAPdf en guardar()).
      this.archivo = null;
      this.fotos = [...this.fotos, elegido];
      if (!this.nombre) this.nombre = 'Documento escaneado';
    }
    this.v.campo('archivo');
    this.v.revalidar('nombre');
  }

  quitarFoto(indice: number): void {
    const [quitada] = this.fotos.splice(indice, 1);
    this.fotos = [...this.fotos];
    if (quitada) this.urlsObjeto.get(quitada) && URL.revokeObjectURL(this.urlsObjeto.get(quitada)!);
    this.urlsObjeto.delete(quitada);
    this.v.campo('archivo');
  }

  /** Miniatura de cada página elegida — un object URL por archivo, creado una sola vez y liberado al quitarla. */
  private readonly urlsObjeto = new Map<File, string>();
  urlObjeto(archivo: File): string {
    let url = this.urlsObjeto.get(archivo);
    if (!url) {
      url = URL.createObjectURL(archivo);
      this.urlsObjeto.set(archivo, url);
    }
    return url;
  }

  async guardar(): Promise<void> {
    this.error.set(null);
    if (!this.v.todo() || (!this.archivo && !this.fotos.length)) return;
    this.subiendo.set(true);
    try {
      const archivoFinal = this.fotos.length ? await fotosAPdf(this.fotos, this.nombre.trim() || 'documento') : this.archivo!;
      const archivoUrl = await this.documentosSvc.subirArchivo(this.personaId, archivoFinal, archivoFinal.name);
      await this.documentosSvc.crear(this.personaId, {
        nombre: this.nombre.trim(),
        categoria: this.categoria,
        archivoUrl,
        subidoEn: new Date().toISOString(),
        notas: this.notas || undefined,
        especialidadId: this.especialidadId || undefined,
      });
      this.mostrarForm.set(false);
    } catch {
      this.error.set('No se pudo subir el documento. Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.subiendo.set(false);
    }
  }
}
