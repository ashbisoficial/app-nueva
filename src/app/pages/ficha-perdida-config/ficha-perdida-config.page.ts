import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
  IonListHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { generarPdfPerdida } from '../../core/pdf-carnet';
import { generarQrDataUrl, urlFichaPerdida } from '../../core/qr';
import { subirArchivo } from '../../core/storage';
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
    IonListHeader,
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
    await this.personasSvc.actualizar(this.personaId, {
      qrPerdidaCamposPublicos: this.seleccionados(),
      condicionPerdida: this.condicionPerdida || undefined,
    });
    const persona = this.persona();
    if (persona) {
      this.persona.set({ ...persona, condicionPerdida: this.condicionPerdida });
    }
  }

  async onFotoSeleccionada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    this.subiendoFoto.set(true);
    try {
      const path = `personas/${this.personaId}/perfil/foto_${Date.now()}_${archivo.name}`;
      const fotoUrl = await subirArchivo(path, archivo);
      await this.personasSvc.actualizar(this.personaId, { fotoUrl });
      const persona = this.persona();
      if (persona) this.persona.set({ ...persona, fotoUrl });
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

  verComoExtrano(): void {
    window.open(this.urlPublica(), '_blank');
  }
}
