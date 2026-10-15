import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { ThemeService, type TamanoFuente } from '../../core/theme.service';
import { BottomNavComponent } from '../../shared/bottom-nav/bottom-nav.component';
import { FlorIconoComponent } from '../../shared/flor-icono/flor-icono.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, IonIcon, IonContent, BottomNavComponent, FlorIconoComponent],
  templateUrl: './configuracion.page.html',
  styleUrl: './configuracion.page.scss',
})
export class ConfiguracionPage {
  auth = inject(AuthService);
  themeSvc = inject(ThemeService);
  private router = inject(Router);

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

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
