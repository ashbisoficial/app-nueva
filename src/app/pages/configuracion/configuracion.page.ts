import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AlertController, IonButton, IonContent, IonIcon, IonModal, IonToggle } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import type { Usuario } from '../../models';
import { BiometriaService } from '../../core/biometria.service';
import { BloqueoService } from '../../core/bloqueo.service';
import { NotificacionesService } from '../../core/notificaciones.service';
import { ThemeService, type ModoColor, type TamanoFuente } from '../../core/theme.service';
import { PersonasService } from '../../services/personas.service';
import { Capacitor } from '@capacitor/core';
import { CalendarioService } from '../../core/calendario.service';
import { PushService } from '../../core/push.service';
import { FlorIconoComponent } from '../../shared/flor-icono/flor-icono.component';
import { PinPadComponent } from '../../shared/pin-pad/pin-pad.component';

type PasoPin = 'verificar-actual' | 'crear' | 'confirmar';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonIcon,
    IonToggle,
    IonModal,
    IonButton,
    IonContent,
    FlorIconoComponent,
    PinPadComponent,
  ],
  templateUrl: './configuracion.page.html',
  styleUrl: './configuracion.page.scss',
})
export class ConfiguracionPage {
  auth = inject(AuthService);
  themeSvc = inject(ThemeService);
  notificacionesSvc = inject(NotificacionesService);
  bloqueoSvc = inject(BloqueoService);
  biometriaSvc = inject(BiometriaService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  private personasSvc = inject(PersonasService);
  pushSvc = inject(PushService);
  calendarioSvc = inject(CalendarioService);

  /** Los recordatorios locales solo funcionan en la app instalada; en la web se usan avisos push. */
  readonly esNativo = Capacitor.isNativePlatform();
  readonly procesandoPush = signal(false);
  readonly mensajePush = signal<string | null>(null);
  readonly calendarioToken = signal<string | null>(null);
  readonly mensajeCalendario = signal<string | null>(null);

  /** Persona "yo mismo/a" de la cuenta: undefined mientras carga, null si todavía no existe. */
  readonly idYoMismo = signal<string | null | undefined>(undefined);

  /** Verificación real del titular (sección 6.1) — en vivo: si el webhook de Didit la actualiza mientras esta pantalla está abierta, se refleja sola. */
  readonly usuarioDoc = signal<Usuario | undefined>(undefined);
  readonly verificando = signal(false);
  readonly errorVerificacion = signal<string | null>(null);

  constructor() {
    void this.pushSvc.inicializar();
    const uid = this.auth.uidActual;
    if (uid) {
      this.calendarioSvc
        .tokenActual(uid)
        .then((t) => this.calendarioToken.set(t))
        .catch(() => this.calendarioToken.set(null));
      this.personasSvc
        .idYoMismo(uid)
        .then((id) => this.idYoMismo.set(id))
        .catch(() => this.idYoMismo.set(null));
      this.auth
        .usuarioDoc$(uid)
        .pipe(takeUntilDestroyed())
        .subscribe((u) => this.usuarioDoc.set(u));
    }
  }

  async verificarIdentidad(): Promise<void> {
    this.errorVerificacion.set(null);
    this.verificando.set(true);
    try {
      const url = await this.auth.crearSesionVerificacionIdentidad();
      window.location.href = url;
    } catch (error) {
      // Un error "functions/..." viene de crearSesionVerificacion y ya trae un
      // mensaje en español pensado para mostrarse tal cual (ej. el límite de
      // intentos o la espera entre uno y el siguiente) — distinto a un fallo
      // de red genérico, donde sí conviene el mensaje fijo de siempre.
      const deLaFuncion = error as { code?: string; message?: string };
      this.errorVerificacion.set(
        deLaFuncion?.code?.startsWith('functions/') && deLaFuncion.message
          ? deLaFuncion.message
          : 'No se pudo iniciar la verificación. Intenta de nuevo.'
      );
      this.verificando.set(false);
    }
  }

  readonly modalPinAbierto = signal(false);
  readonly pasoPin = signal<PasoPin>('crear');
  readonly errorPin = signal(false);
  private pinNuevoTemporal = '';

  readonly tamanos: { valor: TamanoFuente; etiqueta: string }[] = [
    { valor: 'chico', etiqueta: 'A' },
    { valor: 'normal', etiqueta: 'A' },
    { valor: 'grande', etiqueta: 'A' },
  ];

  readonly modos: { valor: ModoColor; etiqueta: string; icono: string }[] = [
    { valor: 'claro', etiqueta: 'Claro', icono: 'sunny-outline' },
    { valor: 'oscuro', etiqueta: 'Oscuro', icono: 'moon-outline' },
    { valor: 'sistema', etiqueta: 'Sistema', icono: 'phone-portrait-outline' },
  ];

  async elegirTema(id: string): Promise<void> {
    await this.themeSvc.elegirTema(id, this.auth.uidActual);
  }

  async elegirTamano(tamano: TamanoFuente): Promise<void> {
    await this.themeSvc.elegirTamano(tamano, this.auth.uidActual);
  }

  async elegirModo(modo: ModoColor): Promise<void> {
    await this.themeSvc.elegirModo(modo, this.auth.uidActual);
  }

  async elegirNotificacionesLocales(activas: boolean): Promise<void> {
    await this.notificacionesSvc.elegirLocalesActivas(activas, this.auth.uidActual);
  }

  async elegirPush(activar: boolean): Promise<void> {
    const uid = this.auth.uidActual;
    if (!uid || activar === (this.pushSvc.estado() === 'activo')) return;
    this.mensajePush.set(null);
    this.procesandoPush.set(true);
    try {
      if (activar) {
        await this.pushSvc.activar(uid);
        this.mensajePush.set('Listo: este dispositivo va a recibir los avisos. Puedes enviar una prueba.');
      } else {
        await this.pushSvc.desactivar(uid);
      }
    } catch (e) {
      const codigo = (e as Error).message;
      if (codigo === 'permiso-no-otorgado') {
        this.mensajePush.set('No se activaron: hay que tocar "Permitir" cuando el navegador lo pregunte.');
      } else if (codigo !== 'permiso-bloqueado') {
        this.mensajePush.set('No se pudieron activar las notificaciones en este dispositivo. Intenta de nuevo.');
      }
    } finally {
      this.procesandoPush.set(false);
    }
  }

  async probarPush(): Promise<void> {
    this.mensajePush.set(null);
    try {
      await this.pushSvc.enviarPrueba();
      this.mensajePush.set('Notificación de prueba enviada. Debería llegarte en unos segundos.');
    } catch {
      this.mensajePush.set('No se pudo enviar la prueba. Desactiva y vuelve a activar los avisos.');
    }
  }

  async conectarCalendario(): Promise<void> {
    const uid = this.auth.uidActual;
    if (!uid) return;
    // La pestaña se abre antes de esperar a la red: si se abre después de un
    // await, el navegador la puede bloquear por no venir directo de un toque.
    const ventana = window.open('', '_blank');
    try {
      const token = await this.calendarioSvc.obtenerOCrearToken(uid);
      this.calendarioToken.set(token);
      if (ventana) ventana.location.href = this.calendarioSvc.urlGoogle(token);
      this.mensajeCalendario.set('En Google Calendar, confirma con "Agregar" para terminar de conectarlo.');
    } catch {
      ventana?.close();
      this.mensajeCalendario.set('No se pudo conectar el calendario. Revisa tu conexión e intenta de nuevo.');
    }
  }

  async copiarEnlaceCalendario(token: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.calendarioSvc.urlFeed(token));
      this.mensajeCalendario.set('Enlace copiado. En tu app de calendario, busca "Suscribirse a calendario" o "Agregar desde URL".');
    } catch {
      this.mensajeCalendario.set(this.calendarioSvc.urlFeed(token));
    }
  }

  async desconectarCalendario(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Desconectar calendario',
      message:
        'El enlace dejará de funcionar y los eventos de Serangelia se dejarán de actualizar. En Google Calendar puedes borrar después el calendario "Serangelia".',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desconectar',
          role: 'destructive',
          handler: async () => {
            const uid = this.auth.uidActual;
            if (!uid) return;
            await this.calendarioSvc.desconectar(uid);
            this.calendarioToken.set(null);
            this.mensajeCalendario.set(null);
          },
        },
      ],
    });
    await alert.present();
  }

  async elegirBiometria(activar: boolean): Promise<void> {
    if (activar) {
      await this.biometriaSvc.activarConConfirmacion();
    } else {
      this.biometriaSvc.desactivar();
    }
  }

  abrirCrearPin(): void {
    this.pinNuevoTemporal = '';
    this.errorPin.set(false);
    this.pasoPin.set('crear');
    this.modalPinAbierto.set(true);
  }

  abrirCambiarPin(): void {
    this.pinNuevoTemporal = '';
    this.errorPin.set(false);
    this.pasoPin.set('verificar-actual');
    this.modalPinAbierto.set(true);
  }

  async quitarPin(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Quitar PIN',
      message: 'Vas a tener que iniciar sesión completa cada vez que abras la app en este dispositivo. ¿Continuar?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Quitar PIN',
          role: 'destructive',
          handler: () => {
            this.bloqueoSvc.quitarPin();
            this.biometriaSvc.desactivar();
          },
        },
      ],
    });
    await alert.present();
  }

  async onPinIngresado(pin: string): Promise<void> {
    if (this.pasoPin() === 'verificar-actual') {
      const ok = await this.bloqueoSvc.verificarPin(pin);
      if (!ok) {
        this.errorPin.set(true);
        setTimeout(() => this.errorPin.set(false), 500);
        return;
      }
      this.pasoPin.set('crear');
      return;
    }

    if (this.pasoPin() === 'crear') {
      this.pinNuevoTemporal = pin;
      this.pasoPin.set('confirmar');
      return;
    }

    // confirmar
    if (pin !== this.pinNuevoTemporal) {
      this.errorPin.set(true);
      setTimeout(() => this.errorPin.set(false), 500);
      this.pasoPin.set('crear');
      this.pinNuevoTemporal = '';
      return;
    }
    await this.bloqueoSvc.establecerPin(pin);
    this.modalPinAbierto.set(false);
  }

  async confirmarLogout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Seguro que quieres cerrar sesión en este dispositivo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Cerrar sesión', role: 'destructive', handler: () => this.logout() },
      ],
    });
    await alert.present();
  }

  private async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
