import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { IonIcon } from '@ionic/angular';

/** Las 4 pantallas raíz de la navegación principal (Inicio/Agenda/Personas/Ajustes). */
const RUTAS_RAIZ = ['/', '/agenda', '/personas', '/configuracion'];

/**
 * Navegación principal responsiva (pedido explícito del usuario): en
 * mobile se comporta como la barra inferior de Instagram — solo visible
 * en las 4 pantallas raíz, las pantallas "empujadas" (detalle, formularios)
 * son pantalla completa. En escritorio (≥900px) se convierte en un panel
 * lateral izquierdo, siempre visible en cualquier pantalla de la app.
 */
@Component({
  selector: 'app-nav-principal',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IonIcon],
  templateUrl: './nav-principal.component.html',
  styleUrl: './nav-principal.component.scss',
})
export class NavPrincipalComponent {
  private router = inject(Router);

  enRutaRaiz = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => RUTAS_RAIZ.includes(e.urlAfterRedirects.split('?')[0]))
    ),
    { initialValue: RUTAS_RAIZ.includes(this.router.url.split('?')[0]) }
  );
}
