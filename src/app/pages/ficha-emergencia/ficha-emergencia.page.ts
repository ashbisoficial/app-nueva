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
  IonItem,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { generarQrDataUrl, urlFichaPublica } from '../../core/qr';
import { generarPdfCarnet } from '../../core/pdf-carnet';
import type { CampoFichaPublica, Persona } from '../../models';
import { PersonasService } from '../../services/personas.service';

const TODOS_LOS_CAMPOS: { value: CampoFichaPublica; label: string }[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'fechaNacimiento', label: 'Fecha de nacimiento' },
  { value: 'grupoSanguineo', label: 'Grupo sanguíneo' },
  { value: 'alergias', label: 'Alergias' },
  { value: 'enfermedadesCronicas', label: 'Enfermedades crónicas' },
  { value: 'medicamentosPermanentes', label: 'Medicación permanente' },
  { value: 'pesoKg', label: 'Peso' },
  { value: 'estaturaCm', label: 'Estatura' },
  { value: 'dispositivosMedicos', label: 'Dispositivos médicos' },
  { value: 'donanteOrganos', label: 'Donante de órganos' },
  { value: 'prevision', label: 'Previsión de salud' },
  { value: 'medicoTratante', label: 'Médico tratante' },
  { value: 'telefonoMedicoTratante', label: 'Teléfono del médico tratante' },
  { value: 'notasEmergencia', label: 'Otras notas' },
  { value: 'contactoEmergencia', label: 'Contacto de emergencia' },
  { value: 'telefonoEmergencia', label: 'Teléfono de emergencia' },
];

@Component({
  selector: 'app-ficha-emergencia',
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
    IonSpinner,
  ],
  templateUrl: './ficha-emergencia.page.html',
  styleUrl: './ficha-emergencia.page.scss',
})
export class FichaEmergenciaPage {
  private route = inject(ActivatedRoute);
  private personasSvc = inject(PersonasService);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';
  campos = TODOS_LOS_CAMPOS;

  persona = signal<Persona | null>(null);
  seleccionados = signal<CampoFichaPublica[]>(['nombre', 'grupoSanguineo', 'alergias', 'contactoEmergencia', 'telefonoEmergencia']);
  qrDataUrl = signal<string | null>(null);
  urlPublica = signal<string>('');
  cargando = signal(true);
  error = signal(false);

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const persona = await this.personasSvc.obtener(this.personaId);
      if (!persona) return;

      if (persona.qrFichaCamposPublicos?.length) {
        this.seleccionados.set(persona.qrFichaCamposPublicos);
      } else {
        // Sin esto, la selección por defecto solo existía en pantalla: hasta que
        // alguien tocara una casilla, el QR público no mostraba ningún dato.
        await this.personasSvc.actualizar(this.personaId, { qrFichaCamposPublicos: this.seleccionados() });
      }
      const token = await this.personasSvc.asegurarTokenFicha(this.personaId);
      const url = urlFichaPublica(token);
      this.urlPublica.set(url);
      this.qrDataUrl.set(await generarQrDataUrl(url));
      this.persona.set({ ...persona, qrFichaToken: token });
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  estaSeleccionado(campo: CampoFichaPublica): boolean {
    return this.seleccionados().includes(campo);
  }

  toggleCampo(campo: CampoFichaPublica, marcado: boolean): void {
    this.seleccionados.set(
      marcado ? [...this.seleccionados(), campo] : this.seleccionados().filter((c) => c !== campo)
    );
  }

  async guardarSeleccion(): Promise<void> {
    await this.personasSvc.actualizar(this.personaId, { qrFichaCamposPublicos: this.seleccionados() });
    this.refrescarVista();
  }

  async generarPdf(): Promise<void> {
    const persona = this.persona();
    const qr = this.qrDataUrl();
    if (!persona || !qr) return;
    await this.guardarSeleccion();
    generarPdfCarnet(persona, this.seleccionados(), qr);
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
