import { Observable } from 'rxjs';
import {
  DocumentData,
  FirestoreError,
  QueryConstraint,
  collection,
  doc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from './firebase';

/** Suscripción en vivo a una colección/subcolección, mapeando cada doc a {id, ...data}. */
export function collectionData$<T>(path: string, ...constraints: QueryConstraint[]): Observable<T[]> {
  const ref = collection(db, path);
  const q = constraints.length ? query(ref, ...constraints) : query(ref);
  return new Observable<T[]>((subscriber) => {
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        subscriber.next(items);
      },
      (error: FirestoreError) => subscriber.error(error)
    );
    return unsubscribe;
  });
}

/** Suscripción en vivo a un documento puntual. */
export function docData$<T>(path: string): Observable<T | undefined> {
  const ref = doc(db, path);
  return new Observable<T | undefined>((subscriber) => {
    const unsubscribe = onSnapshot(
      ref,
      (snap) => subscriber.next(snap.exists() ? ({ id: snap.id, ...(snap.data() as DocumentData) } as T) : undefined),
      (error: FirestoreError) => subscriber.error(error)
    );
    return unsubscribe;
  });
}
