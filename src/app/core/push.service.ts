import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { arrayRemove, arrayUnion, doc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { deleteToken, getMessaging, getToken, isSupported } from 'firebase/messaging';
import { environment } from '../../environments/environment';
import { db, firebaseApp, functions } from './firebase';

/**
 * - no-soportado: el navegador no permite push (ej. Safari de iPhone sin
 *   haber agregado la app a la pantalla de inicio, o la app nativa, que usa
 *   recordatorios locales).
 * - bloqueado: el usuario negó el permiso; solo se puede revertir desde la
 *   configuración del navegador, no desde la app.
 */
export type EstadoPush = 'cargando' | 'no-soportado' | 'bloqueado' | 'inactivo' | 'activo';

const CLAVE_TOKEN = 'serangelia.fcmToken';

/**
 * Notificaciones push web (sección 4.5, capa 2) con Firebase Cloud Messaging.
 * Antes el interruptor de Ajustes estaba deshabilitado ("Próximamente")
 * porque ningún cliente registraba su token, así que la Cloud Function
 * recordatoriosDiarios no tenía a quién mandarle nada. Ahora cada
 * dispositivo que activa las notificaciones guarda su token en
 * usuarios/{uid}.fcmTokens (uno por dispositivo) y la función manda a todos.
 *
 * El service worker es public/firebase-messaging-sw.js. Si
 * environment.vapidKey está vacío se usa la clave VAPID por defecto de
 * Firebase, que funciona igual; se puede generar una propia en Firebase
 * Console → Configuración del proyecto → Cloud Messaging → Certificados push web.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  readonly estado = signal<EstadoPush>('cargando');

  async inicializar(): Promise<void> {
    this.estado.set(await this.calcularEstado());
  }

  private async calcularEstado(): Promise<EstadoPush> {
    if (Capacitor.isNativePlatform()) return 'no-soportado';
    try {
      if (!(await isSupported()) || typeof Notification === 'undefined') return 'no-soportado';
    } catch {
      return 'no-soportado';
    }
    if (Notification.permission === 'denied') return 'bloqueado';
    return Notification.permission === 'granted' && this.tokenGuardado() ? 'activo' : 'inactivo';
  }

  private tokenGuardado(): string | null {
    try {
      return localStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  }

  /** Pide permiso, obtiene el token de este dispositivo y lo agrega a la cuenta. */
  async activar(uid: string): Promise<void> {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      this.estado.set(permiso === 'denied' ? 'bloqueado' : 'inactivo');
      throw new Error(permiso === 'denied' ? 'permiso-bloqueado' : 'permiso-no-otorgado');
    }
    const registro = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const vapidKey = (environment as { vapidKey?: string }).vapidKey;
    const token = await getToken(getMessaging(firebaseApp), {
      serviceWorkerRegistration: registro,
      ...(vapidKey ? { vapidKey } : {}),
    });
    if (!token) throw new Error('sin-token');
    await setDoc(doc(db, 'usuarios', uid), { fcmTokens: arrayUnion(token) }, { merge: true });
    try {
      localStorage.setItem(CLAVE_TOKEN, token);
    } catch {
      // Sin almacenamiento local: igual queda activo en la cuenta.
    }
    this.estado.set('activo');
  }

  /** Deja de recibir avisos en ESTE dispositivo (los demás siguen igual). */
  async desactivar(uid: string): Promise<void> {
    const token = this.tokenGuardado();
    try {
      await deleteToken(getMessaging(firebaseApp));
    } catch {
      // El token ya no existía en FCM: igual se limpia de la cuenta.
    }
    if (token) await setDoc(doc(db, 'usuarios', uid), { fcmTokens: arrayRemove(token) }, { merge: true });
    try {
      localStorage.removeItem(CLAVE_TOKEN);
    } catch {
      // ignorado
    }
    this.estado.set('inactivo');
  }

  async enviarPrueba(): Promise<void> {
    await httpsCallable(functions, 'enviarPushPrueba')({});
  }
}
