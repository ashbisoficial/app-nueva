import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';

export const firebaseApp = initializeApp(environment.firebase);
export const auth = getAuth(firebaseApp);
// ignoreUndefinedProperties: los formularios (ej. persona-form) mandan `undefined`
// para campos opcionales vacíos en vez de omitir la clave — sin esto, Firestore
// rechaza el write entero con "Unsupported field value: undefined".
export const db = initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp);

/**
 * Emuladores locales (puertos de firebase.json), solo en desarrollo y solo si
 * se piden explícitamente con localStorage 'serangelia.emuladores' = '1' —
 * así `ng serve` sigue apuntando al proyecto real por defecto, y el build de
 * producción (environment.production = true) nunca entra acá.
 */
function pidioEmuladores(): boolean {
  try {
    return localStorage.getItem('serangelia.emuladores') === '1';
  } catch {
    return false;
  }
}

if (!environment.production && pidioEmuladores()) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}
