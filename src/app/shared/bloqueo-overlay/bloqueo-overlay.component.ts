import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { BiometriaService } from '../../core/biometria.service';
import { BloqueoService } from '../../core/bloqueo.service';
import { PinPadComponent } from '../pin-pad/pin-pad.component';

/**
 * Pantalla de bloqueo estilo app bancaria: se muestra encima de todo
 * (montada en app.component.html) cuando hay sesión real activa pero el
 * dispositivo todavía no ingresó el PIN de reingreso rápido. Nunca
 * reemplaza el login real — "Olvidé mi PIN" simplemente cierra la sesión
 * para volver a entrar con el método real (email/contraseña o Google).
 *
 * Si hay desbloqueo biométrico activo (core/biometria.service.ts), se
 * ofrece como atajo sobre el mismo PIN: se intenta automáticamente al
 * mostrarse esta pantalla, con un botón para reintentar a mano si se
 * cancela — el teclado de PIN de abajo sigue siempre disponible como
 * respaldo.
 */
@Component({
  selector: 'app-bloqueo-overlay',
  standalone: true,
  imports: [CommonModule, IonIcon, PinPadComponent],
  templateUrl: './bloqueo-overlay.component.html',
  styleUrl: './bloqueo-overlay.component.scss',
})
export class BloqueoOverlayComponent implements OnInit {
  private bloqueoSvc = inject(BloqueoService);
  private auth = inject(AuthService);
  biometriaSvc = inject(BiometriaService);

  readonly error = signal(false);
  readonly intentandoBiometria = signal(false);

  get intentosFallidos() {
    return this.bloqueoSvc.intentosFallidos();
  }

  ngOnInit(): void {
    if (this.biometriaSvc.activa() && this.biometriaSvc.disponible()) {
      void this.intentarBiometria();
    }
  }

  async intentarBiometria(): Promise<void> {
    this.intentandoBiometria.set(true);
    const ok = await this.biometriaSvc.autenticar(`Desbloquea Serangelia con ${this.biometriaSvc.etiqueta}`);
    this.intentandoBiometria.set(false);
    if (ok) this.bloqueoSvc.desbloquearPorBiometria();
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
    this.biometriaSvc.desactivar();
    await this.auth.logout();
    window.location.href = '/login';
  }
}
