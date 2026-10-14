import { Injectable } from '@angular/core';
import {
  DocumentData,
  UpdateData,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  or,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Observable } from 'rxjs';
import { db, functions } from '../core/firebase';
import { docData$ } from '../core/firestore-collection';
import { generarPin6, generarToken } from '../core/random';
import type { Persona } from '../models';

@Injectable({ providedIn: 'root' })
export class PersonasService {
  /** Personas propias más las que esta cuenta canjeó por PIN (sección 6). */
  misPersonas$(uid: string): Observable<Persona[]> {
    const q = query(
      collection(db, 'personas'),
      or(where('uidTitular', '==', uid), where('uidsConAcceso', 'array-contains', uid))
    );
    return new Observable<Persona[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (snap) => subscriber.next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Persona)),
        (error) => subscriber.error(error)
      );
      return unsubscribe;
    });
  }

  persona$(personaId: string): Observable<Persona | undefined> {
    return docData$<Persona>(`personas/${personaId}`);
  }

  async obtener(personaId: string): Promise<Persona | undefined> {
    const snap = await getDoc(doc(db, 'personas', personaId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Persona) : undefined;
  }

  async crear(uidTitular: string, datos: Omit<Persona, 'id' | 'uidTitular'>): Promise<string> {
    const ref = await addDoc(collection(db, 'personas'), { ...datos, uidTitular });
    return ref.id;
  }

  async actualizar(personaId: string, cambios: Partial<Persona>): Promise<void> {
    await updateDoc(doc(db, 'personas', personaId), cambios as UpdateData<DocumentData>);
  }

  async eliminar(personaId: string): Promise<void> {
    await deleteDoc(doc(db, 'personas', personaId));
  }

  /** Genera (o regenera) el token permanente usado por la ficha pública /ficha-publica/:token */
  async asegurarTokenFicha(personaId: string): Promise<string> {
    return this.asegurarToken(personaId, 'qrFichaToken');
  }

  async buscarPorTokenFicha(token: string): Promise<Persona | undefined> {
    return this.buscarPorToken('qrFichaToken', token);
  }

  /** Genera (o regenera) el token permanente usado por el QR de pérdida /ficha-perdida/:token (sección 4.6) */
  async asegurarTokenPerdida(personaId: string): Promise<string> {
    return this.asegurarToken(personaId, 'qrPerdidaToken');
  }

  async buscarPorTokenPerdida(token: string): Promise<Persona | undefined> {
    return this.buscarPorToken('qrPerdidaToken', token);
  }

  private async asegurarToken(personaId: string, campo: 'qrFichaToken' | 'qrPerdidaToken'): Promise<string> {
    const persona = await this.obtener(personaId);
    if (persona?.[campo]) return persona[campo]!;
    const token = generarToken(24);
    await this.actualizar(personaId, { [campo]: token });
    return token;
  }

  private async buscarPorToken(
    campo: 'qrFichaToken' | 'qrPerdidaToken',
    token: string
  ): Promise<Persona | undefined> {
    const q = query(collection(db, 'personas'), where(campo, '==', token));
    const snap = await getDocs(q);
    if (snap.empty) return undefined;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Persona;
  }

  /** Genera un PIN de 6 dígitos para compartir el perfil (sección 6 del spec). */
  async generarPinCompartido(personaId: string, modo: 'lectura' | 'escritura' = 'lectura'): Promise<string> {
    const pin = generarPin6();
    await updateDoc(doc(db, 'personas', personaId), {
      pinAccesoCompartido: pin,
      pinGeneradoEn: serverTimestamp(),
      modoAccesoCompartido: modo,
    });
    return pin;
  }

  /**
   * Canjea un PIN de acceso compartido. La validación y el otorgamiento de
   * acceso corren en una Cloud Function con el Admin SDK (nunca confiar esto
   * solo al cliente — sección 7 del spec).
   */
  async canjearPin(pin: string): Promise<{ personaId: string; personaNombre: string }> {
    const llamada = httpsCallable<{ pin: string }, { personaId: string; personaNombre: string }>(
      functions,
      'canjearPin'
    );
    const resultado = await llamada({ pin });
    return resultado.data;
  }
}
