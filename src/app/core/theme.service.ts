import { Injectable, signal } from '@angular/core';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { TEMAS, TEMA_PREDETERMINADO, type Tema } from './temas';

export type TamanoFuente = 'chico' | 'normal' | 'grande';

const CLAVE_TEMA = 'serangelia.tema';
const CLAVE_TAMANO = 'serangelia.tamanoFuente';

/**
 * Personalización (sección 2.2 del spec): paleta de color + tamaño de letra,
 * aplicados vía atributos en <html> que la colección de variables CSS en
 * theme/variables.css ya sabe leer. Se guarda en localStorage para aplicar
 * sin esperar red, y en Firestore (usuarios/{uid}) para que la preferencia
 * siga a la cuenta entre dispositivos.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly temas: Tema[] = TEMAS;
  readonly temaActual = signal<string>(TEMA_PREDETERMINADO);
  readonly tamanoActual = signal<TamanoFuente>('normal');

  /** Aplica lo guardado en este dispositivo, sin esperar a que resuelva el login. */
  inicializarLocal(): void {
    const tema = localStorage.getItem(CLAVE_TEMA);
    const tamano = localStorage.getItem(CLAVE_TAMANO) as TamanoFuente | null;
    if (tema) this.aplicarTema(tema, false);
    if (tamano) this.aplicarTamano(tamano, false);
  }

  /** Una vez logueado, la preferencia guardada en la cuenta manda sobre la local. */
  sincronizarConUsuario(temaColor?: string, tamanoFuente?: TamanoFuente): void {
    if (temaColor) this.aplicarTema(temaColor, false);
    if (tamanoFuente) this.aplicarTamano(tamanoFuente, false);
  }

  async elegirTema(id: string, uid?: string): Promise<void> {
    this.aplicarTema(id, true);
    if (uid) await this.guardarEnCuenta(uid, { temaColor: id });
  }

  async elegirTamano(tamano: TamanoFuente, uid?: string): Promise<void> {
    this.aplicarTamano(tamano, true);
    if (uid) await this.guardarEnCuenta(uid, { tamanoFuente: tamano });
  }

  private aplicarTema(id: string, guardarLocal: boolean): void {
    const existe = this.temas.some((t) => t.id === id);
    const temaFinal = existe ? id : TEMA_PREDETERMINADO;
    if (temaFinal === TEMA_PREDETERMINADO) {
      document.documentElement.removeAttribute('data-tema');
    } else {
      document.documentElement.setAttribute('data-tema', temaFinal);
    }
    this.temaActual.set(temaFinal);
    if (guardarLocal) localStorage.setItem(CLAVE_TEMA, temaFinal);
  }

  private aplicarTamano(tamano: TamanoFuente, guardarLocal: boolean): void {
    if (tamano === 'normal') {
      document.documentElement.removeAttribute('data-tamano');
    } else {
      document.documentElement.setAttribute('data-tamano', tamano);
    }
    this.tamanoActual.set(tamano);
    if (guardarLocal) localStorage.setItem(CLAVE_TAMANO, tamano);
  }

  private async guardarEnCuenta(uid: string, cambios: Record<string, string>): Promise<void> {
    await setDoc(doc(db, 'usuarios', uid), cambios, { merge: true });
  }
}
