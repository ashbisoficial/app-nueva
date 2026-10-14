import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon, IonItem, IonLabel, IonList, IonSpinner } from '@ionic/angular';
import type { CampoFichaPublica, Persona } from '../../models';
import { PersonasService } from '../../services/personas.service';

const ETIQUETAS: Record<CampoFichaPublica, string> = {
  nombre: 'Nombre',
  fechaNacimiento: 'Fecha de nacimiento',
  grupoSanguineo: 'Grupo sanguíneo',
  alergias: 'Alergias',
  enfermedadesCronicas: 'Enfermedades crónicas',
  medicamentosPermanentes: 'Medicación permanente',
  contactoEmergencia: 'Contacto de emergencia',
  telefonoEmergencia: 'Teléfono de emergencia',
};

interface CampoMostrado {
  etiqueta: string;
  valor: string;
}

@Component({
  selector: 'app-ficha-publica',
  standalone: true,
  imports: [CommonModule, IonContent, IonList, IonItem, IonLabel, IonIcon, IonSpinner],
  templateUrl: './ficha-publica.page.html',
  styleUrl: './ficha-publica.page.scss',
})
export class FichaPublicaPage {
  private route = inject(ActivatedRoute);
  private personasSvc = inject(PersonasService);

  cargando = signal(true);
  persona = signal<Persona | null>(null);
  campos = signal<CampoMostrado[]>([]);
  error = signal(false);

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const token = this.route.snapshot.paramMap.get('token') ?? '';
      const persona = await this.personasSvc.buscarPorTokenFicha(token);
      this.persona.set(persona ?? null);

      if (persona?.qrFichaCamposPublicos) {
        this.campos.set(
          persona.qrFichaCamposPublicos.map((campo) => ({
            etiqueta: ETIQUETAS[campo],
            valor: this.valorCampo(persona, campo),
          }))
        );
      }
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  private valorCampo(persona: Persona, campo: CampoFichaPublica): string {
    const v = persona[campo];
    if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
    return v ? String(v) : '—';
  }
}
