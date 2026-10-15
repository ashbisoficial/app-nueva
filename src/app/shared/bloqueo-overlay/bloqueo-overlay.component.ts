import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { BloqueoService } from '../../core/bloqueo.service';
import { PinPadComponent } from '../pin-pad/pin-pad.component';

/**
 * Pantalla de bloqueo estilo app bancaria: se muestra encima de todo
 * (montada en app.component.html) cuando hay sesión real activa pero el
 * dispositivo todavía no ingresó el PIN de reingreso rápido. Nunca
 * reemplaza el login real — "Olvidé mi PIN" simplemente cierra la sesión
 * para volver a entrar con el método real (email/contraseña o Google).
 */
@Component({
  selector: 'app-bloqueo-overlay',
  standalone: true,
  imports: [CommonModule, PinPadComponent],
  templateUrl: './bloqueo-overlay.component.html',
  styleUrl: './bloqueo-overlay.component.scss',
})
export class BloqueoOverlayComponent {
  private bloqueoSvc = inject(BloqueoService);
  private auth = inject(AuthService);

  readonly error = signal(false);

  get intentosFallidos() {
    return this.bloqueoSvc.intentosFallidos();
  }

  async onPinCompleto(pin: string): Promise<void> {
    const ok = await this.bloqueoSvc.verificarPin(pin);
    if (ok) {
      this.error.set(false);
      return;
    }
    this.error.set(true);
    setTimeout(() => this.error.set(false), 500);
    if (this.bloqueoSvc.intentosAgotados) {
      await this.olvide();
    }
  }

  async olvide(): Promise<void> {
    this.bloqueoSvc.quitarPin();
    await this.auth.logout();
    window.location.href = '/login';
  }
}
