import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import type { User } from 'firebase/auth';
import { IonContent, IonIcon } from '@ionic/angular';
import { filter, map, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { SelectorPersonaService } from '../../core/selector-persona.service';
import { HomeService } from '../../services/home.service';
import { PersonasService } from '../../services/personas.service';
import type { Persona } from '../../models';
import { avatarSrc, colorPersona, inicialPersona } from '../../shared/avatar';
import { datosFaltantes } from '../../shared/persona-datos';
import { nombreCompleto } from '../../shared/persona-nombre';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, IonIcon, IonContent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  auth = inject(AuthService);
  private personasSvc = inject(PersonasService);
  private homeSvc = inject(HomeService);
  private selectorPersona = inject(SelectorPersonaService);
  private router = inject(Router);

  private usuario$ = toObservable(this.auth.usuario);
  readonly hoy = new Date();

  personas$ = this.usuario$.pipe(
    filter((u): u is User => !!u),
    switchMap((u) => this.personasSvc.misPersonas$(u.uid))
  );

  eventos$ = this.usuario$.pipe(
    filter((u): u is User => !!u),
    switchMap((u) => this.homeSvc.proximosEventos$(u.uid))
  );

  /** La cuenta todavía no creó su Persona "yo mismo/a" (ej. recién registrada). */
  sinDatosPropios$ = this.personas$.pipe(
    map((personas) => {
      const uid = this.auth.usuario()?.uid;
      return !personas.some((p) => p.relacion === 'yo_mismo' && p.uidTitular === uid);
    })
  );

  faltanDatos(p: Persona): boolean {
    return datosFaltantes(p).length > 0;
  }

  /** Acceso directo: subir un documento en el menor número de toques posible (sección 8 del spec). */
  async subirDocumento(): Promise<void> {
    const uid = this.auth.usuario()?.uid;
    if (!uid) return;
    const personaId = await this.selectorPersona.elegir(uid, '¿De quién es el documento?');
    if (personaId) await this.router.navigate(['/personas', personaId, 'documentos'], { queryParams: { subir: 1 } });
  }

  async verMedicamentos(): Promise<void> {
    const uid = this.auth.usuario()?.uid;
    if (!uid) return;
    const personaId = await this.selectorPersona.elegir(uid, '¿De quién son los medicamentos?');
    if (personaId) await this.router.navigate(['/personas', personaId, 'medicamentos']);
  }

  iconoEvento(tipo: string): string {
    if (tipo === 'cita') return 'calendar-outline';
    if (tipo === 'vacuna') return 'medical-outline';
    return 'medkit-outline';
  }

  /** Insignia de color por tipo de evento (sección "orgánico cálido": color por categoría, nunca borde lateral). */
  claseEvento(tipo: string): string {
    if (tipo === 'cita') return 'evento-badge--cita';
    if (tipo === 'vacuna') return 'evento-badge--vacuna';
    return 'evento-badge--medicamento';
  }

  readonly inicialPersona = inicialPersona;
  readonly colorPersona = colorPersona;
  readonly avatarSrc = avatarSrc;
  readonly nombreCompleto = nombreCompleto;
}
