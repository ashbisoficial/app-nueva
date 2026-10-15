import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavPrincipalComponent } from '../shared/nav-principal/nav-principal.component';

/**
 * Envoltorio de todas las rutas autenticadas (salvo completar-registro):
 * aloja la navegación principal responsiva una sola vez en vez de
 * repetirla por pantalla (antes era un <app-bottom-nav> pegado al final
 * de cada una de las 4 páginas raíz). Pedido explícito del usuario:
 * mobile tipo Instagram (barra inferior) / escritorio con panel lateral.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NavPrincipalComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {}
