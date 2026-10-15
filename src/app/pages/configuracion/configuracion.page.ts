import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AlertController, IonContent, IonIcon, IonToggle } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { NotificacionesService } from '../../core/notificaciones.service';
import { ThemeService, type TamanoFuente } from '../../core/theme.service';
import { FlorIconoComponent } from '../../shared/flor-icono/flor-icono.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, RouterLink, IonIcon, IonToggle, IonContent, FlorIconoComponent],
  templateUrl: './configuracion.page.html',
  styleUrl: './configuracion.page.scss',
})
export class ConfiguracionPage {
  auth = inject(AuthService);
  themeSvc = inject(ThemeService);
  notificacionesSvc = inject(NotificacionesService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  readonly tamanos: { valor: TamanoFuente; etiqueta: string }[] = [
    { valor: 'chico', etiqueta: 'A' },
    { valor: 'normal', etiqueta: 'A' },
    { valor: 'grande', etiqueta: 'A' },
  ];

  async elegirTema(id: string): Promise<void> {
    await this.themeSvc.elegirTema(id, this.auth.uidActual);
  }

  async elegirTamano(tamano: TamanoFuente): Promise<void> {
    await this.themeSvc.elegirTamano(tamano, this.auth.uidActual);
  }

  async elegirNotificacionesLocales(activas: boolean): Promise<void> {
    await this.notificacionesSvc.elegirLocalesActivas(activas, this.auth.uidActual);
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
