import { Observable } from 'rxjs';
import {
  DocumentData,
  QueryConstraint,
  UpdateData,
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { collectionData$, docData$ } from './firestore-collection';

/**
 * Base para servicios de subcolecciones `personas/{personaId}/<nombreColeccion>/{itemId}`.
 * Cada Persona de la cuenta tiene su propia instancia de la subcolección.
 */
export abstract class SubcoleccionService<T extends { id?: string }> {
  protected abstract nombreColeccion: string;

  protected rutaColeccion(personaId: string): string {
    return `personas/${personaId}/${this.nombreColeccion}`;
  }

  lista$(personaId: string, ...constraints: QueryConstraint[]): Observable<T[]> {
    return collectionData$<T>(this.rutaColeccion(personaId), ...constraints);
  }

  item$(personaId: string, itemId: string): Observable<T | undefined> {
    return docData$<T>(`${this.rutaColeccion(personaId)}/${itemId}`);
  }

  async obtener(personaId: string, itemId: string): Promise<T | undefined> {
    const snap = await getDoc(doc(db, this.rutaColeccion(personaId), itemId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : undefined;
  }

  async crear(personaId: string, datos: Omit<T, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, this.rutaColeccion(personaId)), datos);
    return ref.id;
  }

  async actualizar(personaId: string, itemId: string, cambios: Partial<T>): Promise<void> {
    await updateDoc(doc(db, this.rutaColeccion(personaId), itemId), cambios as UpdateData<DocumentData>);
  }

  async eliminar(personaId: string, itemId: string): Promise<void> {
    await deleteDoc(doc(db, this.rutaColeccion(personaId), itemId));
  }

  /**
   * Barre la subcolección de TODAS las personas en una sola consulta (collectionGroup),
   * filtrando por los constraints dados (ej. where('creadoPor','==',uid)).
   * Clave para agregados de toda la cuenta (home, calendario, recordatorios) sin
   * iterar persona por persona — ver sección 4.5 del spec.
   */
  deLaCuenta$(...constraints: QueryConstraint[]): Observable<(T & { personaId: string })[]> {
    const ref = collectionGroup(db, this.nombreColeccion);
    const q = constraints.length ? query(ref, ...constraints) : query(ref);
    return new Observable<(T & { personaId: string })[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (snap) =>
          subscriber.next(
            snap.docs.map(
              (d) =>
                ({ ...d.data(), id: d.id, personaId: d.ref.parent.parent?.id ?? '' }) as T & {
                  personaId: string;
                }
            )
          ),
        (error) => subscriber.error(error)
      );
      return unsubscribe;
    });
  }
}
