import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
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
export class AppShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // Una sesión que ya estaba abierta no pasa por el login: si a la cuenta le
    // falta el RUT o aceptar la versión vigente de los textos legales, se la
    // manda a completar-registro antes de usar la app.
    const uid = this.auth.uidActual;
    if (uid) {
      void this.auth.obtenerUsuario(uid).then((u) => {
        if (AuthService.registroIncompleto(u)) void this.router.navigateByUrl('/completar-registro');
      });
    }
  }
}
