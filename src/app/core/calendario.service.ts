import { Injectable } from '@angular/core';
import { deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { generarToken } from './random';

/**
 * Suscripción de calendario (sección 4.3): en vez de OAuth con Google
 * (requiere verificación de la app por Google para un permiso sensible como
 * Calendar), la cuenta tiene un enlace secreto a un feed .ics que sirve la
 * Cloud Function calendarioIcs (/calendario/{token}.ics). Google Calendar,
 * Apple Calendar y Outlook pueden "suscribirse" a ese enlace y lo vuelven a
 * leer solos cada algunas horas — sin tener que exportar cita por cita.
 */
@Injectable({ providedIn: 'root' })
export class CalendarioService {
  async tokenActual(uid: string): Promise<string | null> {
    const snap = await getDoc(doc(db, 'usuarios', uid));
    return (snap.data()?.['calendarioToken'] as string | undefined) ?? null;
  }

  async obtenerOCrearToken(uid: string): Promise<string> {
    const actual = await this.tokenActual(uid);
    if (actual) return actual;
    const token = generarToken(32);
    await setDoc(doc(db, 'usuarios', uid), { calendarioToken: token }, { merge: true });
    return token;
  }

  /** Borra el token: el enlace deja de funcionar en todos los calendarios suscritos. */
  async desconectar(uid: string): Promise<void> {
    await updateDoc(doc(db, 'usuarios', uid), { calendarioToken: deleteField() });
  }

  urlFeed(token: string): string {
    return `${window.location.origin}/calendario/${token}.ics`;
  }

  /** Abre Google Calendar con la suscripción lista para confirmar ("Agregar"). */
  urlGoogle(token: string): string {
    const webcal = this.urlFeed(token).replace(/^https?:/, 'webcal:');
    return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`;
  }
}
