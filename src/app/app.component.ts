import { Component, computed, effect, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { AuthService } from './core/auth.service';
import { BloqueoService } from './core/bloqueo.service';
import { NotificacionesService } from './core/notificaciones.service';
import { ThemeService } from './core/theme.service';
import { BloqueoOverlayComponent } from './shared/bloqueo-overlay/bloqueo-overlay.component';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, BloqueoOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private auth = inject(AuthService);
  private themeSvc = inject(ThemeService);
  private notificacionesSvc = inject(NotificacionesService);
  private bloqueoSvc = inject(BloqueoService);

  readonly mostrarBloqueo = computed(
    () => !!this.auth.usuario() && this.bloqueoSvc.pinConfigurado() && !this.bloqueoSvc.desbloqueado()
  );

  constructor() {
    // Aplica lo guardado en este dispositivo de una, sin esperar la red.
    this.themeSvc.inicializarLocal();
    this.notificacionesSvc.inicializarLocal();

    // Una vez logueado, lo guardado en la cuenta manda (sigue a la persona entre dispositivos).
    effect(() => {
      const usuario = this.auth.usuario();
      if (!usuario) return;
      void this.auth.obtenerUsuario(usuario.uid).then((datos) => {
        this.themeSvc.sincronizarConUsuario(datos?.temaColor, datos?.tamanoFuente);
        this.notificacionesSvc.sincronizarConUsuario(datos?.notificacionesLocales);
      });
    });
  }
}
