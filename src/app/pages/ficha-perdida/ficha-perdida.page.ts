import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import type { Persona } from '../../models';
import { PersonasService } from '../../services/personas.service';
import { nombreCompleto } from '../../shared/persona-nombre';

@Component({
  selector: 'app-ficha-perdida',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
  templateUrl: './ficha-perdida.page.html',
  styleUrl: './ficha-perdida.page.scss',
})
export class FichaPerdidaPage {
  private route = inject(ActivatedRoute);
  private personasSvc = inject(PersonasService);

  cargando = signal(true);
  persona = signal<Persona | null>(null);
  error = signal(false);

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const token = this.route.snapshot.paramMap.get('token') ?? '';
      const persona = await this.personasSvc.buscarPorTokenPerdida(token);
      this.persona.set(persona ?? null);
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  muestraCampo(campo: string): boolean {
    return this.persona()?.qrPerdidaCamposPublicos?.includes(campo as never) ?? false;
  }

  readonly nombreCompleto = nombreCompleto;

  llamar(telefono: string): void {
    window.location.href = `tel:${telefono}`;
  }
}
