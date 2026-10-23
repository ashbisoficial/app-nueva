import { Component, computed, effect, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { AuthService } from './core/auth.service';
import { BiometriaService } from './core/biometria.service';
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
  private biometriaSvc = inject(BiometriaService);

  readonly mostrarBloqueo = computed(
    () =>
      !!this.auth.usuario() &&
      this.bloqueoSvc.pinConfigurado() &&
      !this.bloqueoSvc.desbloqueado() &&
      // Las fichas públicas de los QR no muestran nada privado: no se bloquean
      // (además se ven como vista previa dentro de la app, en un iframe).
      !/^\/ficha-(publica|perdida)\//.test(window.location.pathname)
  );

  constructor() {
    // Aplica lo guardado en este dispositivo de una, sin esperar la red.
    this.themeSvc.inicializarLocal();
    this.notificacionesSvc.inicializarLocal();
    void this.biometriaSvc.inicializar();

    // Una vez logueado, lo guardado en la cuenta manda (sigue a la persona entre dispositivos).
    effect(() => {
      const usuario = this.auth.usuario();
      if (!usuario) return;
      void this.auth.obtenerUsuario(usuario.uid).then((datos) => {
        this.themeSvc.sincronizarConUsuario(datos?.temaColor, datos?.tamanoFuente, datos?.modoColor);
        this.notificacionesSvc.sincronizarConUsuario(datos?.notificacionesLocales);
      });
    });
  }
}
