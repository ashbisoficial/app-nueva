import { Injectable } from '@angular/core';
import {
  DocumentData,
  UpdateData,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  or,
  query,
  serverTimestamp,
  setDoc,
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
import type { PinAcceso, Persona, RelacionPersona } from '../models';

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
    return (await this.idYoMismo(uidTitular)) !== null;
  }

  /**
   * Id de la Persona "yo mismo/a" de la cuenta, o null si todavía no la creó.
   * Se consulta en vez de leer usuarios/{uid}.personaYoMismoId porque las
   * cuentas anteriores a ese campo no lo tienen.
   */
  async idYoMismo(uidTitular: string): Promise<string | null> {
    const q = query(
      collection(db, 'personas'),
      where('uidTitular', '==', uidTitular),
      where('relacion', '==', 'yo_mismo')
    );
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].id;
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
    return this.fichaPublica(token, 'emergencia');
  }

  /** Genera (o regenera) el token permanente usado por el QR de pérdida /ficha-perdida/:token (sección 4.6) */
  async asegurarTokenPerdida(personaId: string): Promise<string> {
    return this.asegurarToken(personaId, 'qrPerdidaToken');
  }

  async buscarPorTokenPerdida(token: string): Promise<Persona | undefined> {
    return this.fichaPublica(token, 'perdida');
  }

  /**
   * Vista pública de un QR, sin login (Cloud Function fichaPublica): devuelve
   * solo los campos marcados como públicos — nunca el documento completo.
   */
  private async fichaPublica(token: string, tipo: 'emergencia' | 'perdida'): Promise<Persona | undefined> {
    const llamada = httpsCallable<{ token: string; tipo: string }, { persona: Persona | null }>(functions, 'fichaPublica');
    const { data } = await llamada({ token, tipo });
    return data.persona ?? undefined;
  }

  private async asegurarToken(personaId: string, campo: 'qrFichaToken' | 'qrPerdidaToken'): Promise<string> {
    const persona = await this.obtener(personaId);
    if (persona?.[campo]) return persona[campo]!;
    const token = generarToken(24);
    await this.actualizar(personaId, { [campo]: token });
    return token;
  }

  /** PIN vigente de una Persona (el titular solo tiene uno a la vez), o null. */
  async pinVigente(personaId: string, uidTitular: string): Promise<PinAcceso | null> {
    const snap = await getDocs(
      query(collection(db, 'pinesAcceso'), where('personaId', '==', personaId), where('uidTitular', '==', uidTitular))
    );
    const ahora = Date.now();
    const vigentes = snap.docs
      .map((d) => this.aPin(d.id, d.data()))
      .filter((p) => p.expiraEn.getTime() > ahora && p.usos < p.usosMax);
    return vigentes[0] ?? null;
  }

  /**
   * Genera un PIN nuevo con vencimiento y límite de usos (pedido explícito,
   * por seguridad) y revoca los anteriores de esa Persona. El id del doc es
   * el PIN: si choca con uno vigente de otra cuenta, las reglas rechazan el
   * create y se prueba con otro número.
   */
  async crearPin(
    personaId: string,
    uidTitular: string,
    opciones: { modo: 'lectura' | 'escritura'; horas: number; usosMax: number }
  ): Promise<PinAcceso> {
    const anteriores = await getDocs(
      query(collection(db, 'pinesAcceso'), where('personaId', '==', personaId), where('uidTitular', '==', uidTitular))
    );
    await Promise.all(anteriores.docs.map((d) => deleteDoc(d.ref)));

    const expiraEn = new Date(Date.now() + opciones.horas * 60 * 60 * 1000);
    for (let intento = 0; intento < 4; intento++) {
      const pin = generarPin6();
      try {
        await setDoc(doc(db, 'pinesAcceso', pin), {
          personaId,
          uidTitular,
          modo: opciones.modo,
          usosMax: opciones.usosMax,
          usos: 0,
          expiraEn: Timestamp.fromDate(expiraEn),
          creadoEn: serverTimestamp(),
        });
        return { pin, personaId, uidTitular, modo: opciones.modo, usosMax: opciones.usosMax, usos: 0, expiraEn };
      } catch {
        // PIN ya en uso por otra Persona: se intenta con otro.
      }
    }
    throw new Error('pin-no-generado');
  }

  async revocarPin(pin: string): Promise<void> {
    await deleteDoc(doc(db, 'pinesAcceso', pin));
  }

  private aPin(pin: string, d: DocumentData): PinAcceso {
    const expira = d['expiraEn'];
    return {
      pin,
      personaId: d['personaId'],
      uidTitular: d['uidTitular'],
      modo: d['modo'],
      usosMax: d['usosMax'] ?? 1,
      usos: d['usos'] ?? 0,
      expiraEn: expira instanceof Timestamp ? expira.toDate() : new Date(0),
    };
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
