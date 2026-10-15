import { Injectable, signal } from '@angular/core';

const CLAVE_HASH = 'serangelia.pinBloqueo';
const MAX_INTENTOS = 5;
const SEGUNDOS_GRACIA_FONDO = 10;

/**
 * PIN de reingreso rápido (pedido explícito del usuario, estilo apps
 * bancarias): una vez que la cuenta ya pasó por el login real (email/
 * contraseña o Google), este PIN solo desbloquea la app en ESTE
 * dispositivo — nunca reemplaza ni repite el login real ni la verificación
 * de identidad de la sección 6.1 (que debe pasar una sola vez, al crear la
 * cuenta). Por eso se guarda únicamente local (hash SHA-256 en
 * localStorage, nunca en Firestore): no necesita viajar entre dispositivos,
 * y guardarlo en el servidor no aportaría nada a su propósito.
 */
@Injectable({ providedIn: 'root' })
export class BloqueoService {
  readonly pinConfigurado = signal(!!localStorage.getItem(CLAVE_HASH));
  readonly desbloqueado = signal(true);
  readonly intentosFallidos = signal(0);

  private ocultoDesde: number | null = null;

  constructor() {
    if (this.pinConfigurado()) this.desbloqueado.set(false);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.ocultoDesde = Date.now();
        return;
      }
      if (!this.ocultoDesde) return;
      const segundosOculto = (Date.now() - this.ocultoDesde) / 1000;
      this.ocultoDesde = null;
      if (segundosOculto >= SEGUNDOS_GRACIA_FONDO && this.pinConfigurado()) {
        this.desbloqueado.set(false);
        this.intentosFallidos.set(0);
      }
    });
  }

  private async hash(pin: string): Promise<string> {
    const datos = new TextEncoder().encode(pin);
    const buffer = await crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async establecerPin(pin: string): Promise<void> {
    localStorage.setItem(CLAVE_HASH, await this.hash(pin));
    this.pinConfigurado.set(true);
    this.desbloqueado.set(true);
    this.intentosFallidos.set(0);
  }

  quitarPin(): void {
    localStorage.removeItem(CLAVE_HASH);
    this.pinConfigurado.set(false);
    this.desbloqueado.set(true);
    this.intentosFallidos.set(0);
  }

  /** true si coincide. Al 5to intento fallido, señaliza con una excepción especial para forzar cierre de sesión. */
  async verificarPin(pin: string): Promise<boolean> {
    const guardado = localStorage.getItem(CLAVE_HASH);
    const correcto = !!guardado && (await this.hash(pin)) === guardado;
    if (correcto) {
      this.desbloqueado.set(true);
      this.intentosFallidos.set(0);
      return true;
    }
    this.intentosFallidos.update((n) => n + 1);
    return false;
  }

  get intentosAgotados(): boolean {
    return this.intentosFallidos() >= MAX_INTENTOS;
  }
}
