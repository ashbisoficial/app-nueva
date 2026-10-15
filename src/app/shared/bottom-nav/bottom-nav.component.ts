import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular';

/**
 * Barra de navegación inferior (propuesta visual "orgánico cálido"),
 * compartida por las pantallas principales: Inicio / Agenda / Personas /
 * Ajustes. No reemplaza el routing por ion-tabs — son links normales con
 * routerLinkActive, así cada pantalla sigue siendo una ruta independiente.
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IonIcon],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {}
