import { Injectable } from '@angular/core';
import {
  DocumentData,
  UpdateData,
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
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Observable } from 'rxjs';
import { normalizarRut, validarRut } from '../core/rut';
import { db, functions } from '../core/firebase';
import { docData$ } from '../core/firestore-collection';
import { generarPin6, generarToken } from '../core/random';
import type { Persona, RelacionPersona } from '../models';

type DatosPersonaNueva = Omit<Persona, 'id' | 'uidTitular' | 'relacion' | 'rut'>;

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

  /** true si esta cuenta ya tiene su Persona "yo mismo/a" (solo puede haber una, sección 6.2). */
  async tieneYoMismo(uidTitular: string): Promise<boolean> {
    const q = query(
      collection(db, 'personas'),
      where('uidTitular', '==', uidTitular),
      where('relacion', '==', 'yo_mismo')
    );
    const snap = await getDocs(q);
    return !snap.empty;
  }

  persona$(personaId: string): Observable<Persona | undefined> {
    return docData$<Persona>(`personas/${personaId}`);
  }

  async obtener(personaId: string): Promise<Persona | undefined> {
    const snap = await getDoc(doc(db, 'personas', personaId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Persona) : undefined;
  }

  /**
   * Crea la Persona "yo mismo/a" del titular (sección 6.2): el RUT es el
   * mismo que ya quedó reclamado en usuarios/{uid}.rut al completar el
   * registro — no se vuelve a reclamar acá, solo se denormaliza en la
   * Persona para que el resto de la app (ficha de emergencia, etc.) lo lea
   * desde un solo lugar.
   *
   * Junto con la Persona, el mismo batch marca usuarios/{uid}.personaYoMismoId:
   * la UI ya evita ofrecer "Yo mismo/a" si tieneYoMismo() es true (ver
   * ngOnInit de persona-form), pero esto además lo hace imposible de burlar
   * a nivel de reglas — ver el comentario en firestore.rules sobre la
   * regla de creación de `personas/{personaId}`.
   */
  async crearTitular(uidTitular: string, datos: DatosPersonaNueva, rutTitular: string): Promise<string> {
    const ref = doc(collection(db, 'personas'));
    const batch = writeBatch(db);
    batch.set(ref, { ...datos, uidTitular, relacion: 'yo_mismo' as const, rut: rutTitular });
    batch.update(doc(db, 'usuarios', uidTitular), { personaYoMismoId: ref.id });
    await batch.commit();
    return ref.id;
  }

  /**
   * Crea una Persona dependiente (menor de edad o adulto mayor/convaleciente
   * a cargo, sección 6.2): a diferencia de "yo mismo/a", esta sí reclama un
   * RUT nuevo en rutsRegistrados — mismo índice que usan las cuentas, mismo
   * patrón atómico que AuthService.reclamarRut (create-only, batch), así
   * que el mismo RUT no se puede usar dos veces ni como cuenta ni como
   * dependiente de otra persona.
   */
  async crearDependiente(
    uidTitular: string,
    relacion: Extract<RelacionPersona, 'menor_a_cargo' | 'adulto_mayor_a_cargo'>,
    datos: DatosPersonaNueva,
    rut: string
  ): Promise<string> {
    const rutNormalizado = normalizarRut(rut);
    if (!validarRut(rutNormalizado)) throw new Error('rut-invalido');

    const personaRef = doc(collection(db, 'personas'));
    const batch = writeBatch(db);
    batch.set(doc(db, 'rutsRegistrados', rutNormalizado), {
      tipo: 'dependiente',
      personaId: personaRef.id,
      uidTitular,
      reclamadoEn: serverTimestamp(),
    });
    batch.set(personaRef, { ...datos, uidTitular, relacion, rut: rutNormalizado });

    try {
      await batch.commit();
    } catch {
      throw new Error('rut-duplicado');
    }
    return personaRef.id;
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
