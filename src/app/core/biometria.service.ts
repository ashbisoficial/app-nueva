import { Injectable, signal } from '@angular/core';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';

const CLAVE_ACTIVA = 'serangelia.biometriaActiva';

/**
 * Desbloqueo biométrico (Face ID / huella / reconocimiento facial u ojo en
 * Android) — un segundo mecanismo de conveniencia local, complementario al
 * PIN de reingreso rápido (core/bloqueo.service.ts), nunca un reemplazo: no
 * aporta nada propio al cierre de sesión real, solo evita escribir el PIN
 * cada vez. Por eso solo puede activarse si ya hay un PIN configurado (el
 * PIN sigue siendo el método de respaldo cuando la biometría falla, se
 * cancela, o el dispositivo simplemente no la soporta — ej. navegador de
 * escritorio, donde `checkBiometry()` siempre reporta `isAvailable: false`).
 *
 * Igual que el PIN, la preferencia se guarda solo en localStorage de este
 * dispositivo — la biometría en sí ya es un dato puramente local del
 * hardware/SO, no tendría sentido guardarla en Firestore.
 */
@Injectable({ providedIn: 'root' })
export class BiometriaService {
  readonly disponible = signal(false);
  readonly tipo = signal<BiometryType>(BiometryType.none);
  readonly activa = signal(localStorage.getItem(CLAVE_ACTIVA) === 'true');

  /**
   * Consulta el hardware del dispositivo al iniciar la app (app.component.ts) y
   * cada vez que vuelve a primer plano — no solo al boot — porque el usuario
   * puede enrolar o quitar una huella/Face ID mientras la app está en segundo
   * plano, y queremos que Configuración lo refleje sin tener que reabrir la app.
   */
  async inicializar(): Promise<void> {
    await this.actualizarEstado();
    try {
      await BiometricAuth.addResumeListener(() => void this.actualizarEstado());
    } catch {
      // Entorno sin @capacitor/app funcional; el chequeo inicial ya corrió.
    }
  }

  private async actualizarEstado(): Promise<void> {
    try {
      const resultado = await BiometricAuth.checkBiometry();
      this.disponible.set(resultado.isAvailable);
      this.tipo.set(resultado.biometryType);
    } catch {
      this.disponible.set(false);
    }
    if (!this.disponible() && this.activa()) {
      // El dispositivo cambió o la app corre ahora en un entorno sin soporte: no dejar
      // una preferencia activa que el resto de la app no pueda honrar.
      this.desactivar();
    }
  }

  get etiqueta(): string {
    switch (this.tipo()) {
      case BiometryType.faceId:
        return 'Face ID';
      case BiometryType.touchId:
        return 'Touch ID';
      case BiometryType.fingerprintAuthentication:
        return 'huella digital';
      case BiometryType.faceAuthentication:
        return 'reconocimiento facial';
      case BiometryType.irisAuthentication:
        return 'reconocimiento de iris';
      default:
        return 'biometría';
    }
  }

  /** true si el SO confirmó la identidad; false ante cualquier error, cancelación o rechazo. */
  async autenticar(reason: string): Promise<boolean> {
    try {
      await BiometricAuth.authenticate({ reason, cancelTitle: 'Usar PIN' });
      return true;
    } catch {
      return false;
    }
  }

  /** Pide confirmar con el sensor antes de activar, para no guardar una preferencia que luego no funcione. */
  async activarConConfirmacion(): Promise<boolean> {
    const ok = await this.autenticar(`Confirma con ${this.etiqueta} para activar el desbloqueo rápido`);
    if (ok) {
      this.activa.set(true);
      localStorage.setItem(CLAVE_ACTIVA, 'true');
    }
    return ok;
  }

  desactivar(): void {
    this.activa.set(false);
    localStorage.removeItem(CLAVE_ACTIVA);
  }
}
