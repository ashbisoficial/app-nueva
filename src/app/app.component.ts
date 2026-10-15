import { Component, effect, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private auth = inject(AuthService);
  private themeSvc = inject(ThemeService);

  constructor() {
    // Aplica lo guardado en este dispositivo de una, sin esperar la red.
    this.themeSvc.inicializarLocal();

    // Una vez logueado, lo guardado en la cuenta manda (sigue a la persona entre dispositivos).
    effect(() => {
      const usuario = this.auth.usuario();
      if (!usuario) return;
      void this.auth.obtenerUsuario(usuario.uid).then((datos) => {
        this.themeSvc.sincronizarConUsuario(datos?.temaColor, datos?.tamanoFuente);
      });
    });
  }
}
