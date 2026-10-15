import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';

export const firebaseApp = initializeApp(environment.firebase);
export const auth = getAuth(firebaseApp);
// ignoreUndefinedProperties: los formularios (ej. persona-form) mandan `undefined`
// para campos opcionales vacíos en vez de omitir la clave — sin esto, Firestore
// rechaza el write entero con "Unsupported field value: undefined".
export const db = initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp);
