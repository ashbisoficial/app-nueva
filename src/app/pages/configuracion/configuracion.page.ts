import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AlertController, IonButton, IonContent, IonIcon, IonModal, IonToggle } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { BiometriaService } from '../../core/biometria.service';
import { BloqueoService } from '../../core/bloqueo.service';
import { NotificacionesService } from '../../core/notificaciones.service';
import { ThemeService, type ModoColor, type TamanoFuente } from '../../core/theme.service';
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
