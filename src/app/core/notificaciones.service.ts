import { Injectable, signal } from '@angular/core';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const CLAVE_LOCALES = 'serangelia.notificacionesLocales';

/**
 * Preferencia de recordatorios locales (sección 4.5, capa 1) — mismo patrón
 * que ThemeService: se aplica de inmediato desde localStorage (sin esperar
 * red) y se sincroniza con la cuenta en Firestore para seguir entre
 * dispositivos. RecordatoriosLocalesService consulta `localesActivas()`
 * antes de programar un nuevo recordatorio.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  readonly localesActivas = signal(true);

  inicializarLocal(): void {
    const valor = localStorage.getItem(CLAVE_LOCALES);
    if (valor !== null) this.localesActivas.set(valor === 'true');
  }

  sincronizarConUsuario(notificacionesLocales?: boolean): void {
    if (notificacionesLocales !== undefined) this.localesActivas.set(notificacionesLocales);
  }

  async elegirLocalesActivas(activas: boolean, uid?: string): Promise<void> {
    this.localesActivas.set(activas);
    localStorage.setItem(CLAVE_LOCALES, String(activas));
    if (uid) await setDoc(doc(db, 'usuarios', uid), { notificacionesLocales: activas }, { merge: true });
  }
}
