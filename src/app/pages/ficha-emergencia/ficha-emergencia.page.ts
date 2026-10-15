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
  }

  async generarPdf(): Promise<void> {
    const persona = this.persona();
    const qr = this.qrDataUrl();
    if (!persona || !qr) return;
    await this.guardarSeleccion();
    generarPdfCarnet(persona, this.seleccionados(), qr);
  }

  verComoExtrano(): void {
    window.open(this.urlPublica(), '_blank');
  }
}
