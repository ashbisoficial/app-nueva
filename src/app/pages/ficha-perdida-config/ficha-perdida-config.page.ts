import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { generarPdfPerdida } from '../../core/pdf-carnet';
import { generarQrDataUrl, urlFichaPerdida } from '../../core/qr';
import { subirArchivo } from '../../core/storage';
import { ValidacionFormulario, errorArchivo, reglas } from '../../core/validadores';
import type { CampoFichaPerdida, Persona } from '../../models';
import { PersonasService } from '../../services/personas.service';

const TODOS_LOS_CAMPOS: { value: CampoFichaPerdida; label: string }[] = [
  { value: 'fotoUrl', label: 'Foto' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'condicionPerdida', label: 'Condición relevante' },
  { value: 'contactoEmergencia', label: 'Contacto de emergencia' },
  { value: 'telefonoEmergencia', label: 'Teléfono de emergencia' },
];

@Component({
  selector: 'app-ficha-perdida-config',
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
    IonCheckbox,
    IonInput,
    IonSpinner,
  ],
  templateUrl: './ficha-perdida-config.page.html',
  styleUrl: './ficha-perdida-config.page.scss',
})
export class FichaPerdidaConfigPage {
  private route = inject(ActivatedRoute);
  private personasSvc = inject(PersonasService);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';
  campos = TODOS_LOS_CAMPOS;

  persona = signal<Persona | null>(null);
  seleccionados = signal<CampoFichaPerdida[]>(['fotoUrl', 'nombre', 'condicionPerdida', 'contactoEmergencia', 'telefonoEmergencia']);
  condicionPerdida = '';
  private fotoElegida: File | null = null;
  private errorSubidaFoto: string | null = null;

  readonly v = new ValidacionFormulario({
    condicion: () => reglas.largoMaximo(this.condicionPerdida, 140),
    foto: () => this.errorSubidaFoto ?? (this.fotoElegida ? errorArchivo(this.fotoElegida, { permitePdf: false }) : null),
  });
  qrDataUrl = signal<string | null>(null);
  urlPublica = signal<string>('');
  cargando = signal(true);
  subiendoFoto = signal(false);
  error = signal(false);

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const persona = await this.personasSvc.obtener(this.personaId);
      if (!persona) return;

      if (persona.qrPerdidaCamposPublicos?.length) {
        this.seleccionados.set(persona.qrPerdidaCamposPublicos);
      } else {
        // Igual que en el carnet: persistir la selección por defecto para que el QR muestre algo desde el inicio.
        await this.personasSvc.actualizar(this.personaId, { qrPerdidaCamposPublicos: this.seleccionados() });
      }
      this.condicionPerdida = persona.condicionPerdida ?? '';

      const token = await this.personasSvc.asegurarTokenPerdida(this.personaId);
      const url = urlFichaPerdida(token);
      this.urlPublica.set(url);
      this.qrDataUrl.set(await generarQrDataUrl(url));
      this.persona.set({ ...persona, qrPerdidaToken: token });
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  estaSeleccionado(campo: CampoFichaPerdida): boolean {
    return this.seleccionados().includes(campo);
  }

  toggleCampo(campo: CampoFichaPerdida, marcado: boolean): void {
    this.seleccionados.set(
      marcado ? [...this.seleccionados(), campo] : this.seleccionados().filter((c) => c !== campo)
    );
  }

  async guardar(): Promise<void> {
    this.v.campo('condicion');
    if (this.v.error('condicion')) return;
    await this.personasSvc.actualizar(this.personaId, {
      qrPerdidaCamposPublicos: this.seleccionados(),
      condicionPerdida: this.condicionPerdida.trim() || undefined,
    });
    const persona = this.persona();
    if (persona) {
      this.persona.set({ ...persona, condicionPerdida: this.condicionPerdida });
    }
    this.refrescarVista();
  }

  async onFotoSeleccionada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    this.fotoElegida = archivo;
    this.errorSubidaFoto = null;
    this.v.campo('foto');
    if (this.v.error('foto')) return;

    this.subiendoFoto.set(true);
    try {
      const path = `personas/${this.personaId}/perfil/foto_${Date.now()}_${archivo.name}`;
      const fotoUrl = await subirArchivo(path, archivo);
      await this.personasSvc.actualizar(this.personaId, { fotoUrl });
      const persona = this.persona();
      if (persona) this.persona.set({ ...persona, fotoUrl });
      this.refrescarVista();
    } catch {
      this.errorSubidaFoto = 'No se pudo subir la foto. Revisa tu conexión e intenta de nuevo.';
      this.v.campo('foto');
    } finally {
      this.subiendoFoto.set(false);
    }
  }

  async generarPdf(): Promise<void> {
    const persona = this.persona();
    const qr = this.qrDataUrl();
    if (!persona || !qr) return;
    await this.guardar();
    await generarPdfPerdida(persona, qr);
  }

  private sanitizer = inject(DomSanitizer);
  /** Se incrementa al guardar para recargar la vista previa con los datos nuevos. */
  private versionVista = signal(0);
  enlaceCopiado = signal(false);

  /** La misma página pública que abre quien escanea el QR, embebida como vista previa. */
  vistaPrevia = computed<SafeResourceUrl | null>(() => {
    const url = this.urlPublica();
    if (!url) return null;
    const ruta = new URL(url).pathname;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`${ruta}?vista=${this.versionVista()}`);
  });

  protected refrescarVista(): void {
    this.versionVista.update((v) => v + 1);
  }

  async copiarEnlace(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.urlPublica());
      this.enlaceCopiado.set(true);
      setTimeout(() => this.enlaceCopiado.set(false), 2000);
    } catch {
      window.prompt('Copia este enlace:', this.urlPublica());
    }
  }
}
