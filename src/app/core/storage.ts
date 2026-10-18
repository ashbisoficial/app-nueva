import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

const ESPERAS_REINTENTO_MS = [600, 1200, 2400];

function esPermisoDenegado(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'storage/unauthorized';
}

/**
 * Sube un archivo a Storage en la ruta dada y devuelve su URL de descarga pública.
 *
 * Reintenta ante `storage/unauthorized`: las reglas de Storage de esta app
 * validan acceso leyendo el documento de Firestore de la Persona dueña
 * (`storage.rules` → `personaDoc()`), y esa lectura cruzada Storage→Firestore
 * es de consistencia eventual (documentado por Firebase) — justo después de
 * crear una Persona nueva, la subida de su foto puede chocar con un 403
 * aunque el documento ya exista, porque la regla todavía no lo ve. Un
 * reintento corto resuelve el caso real sin ocultar un error de permisos
 * genuino (que seguiría fallando tras los reintentos).
 */
export async function subirArchivo(ruta: string, archivo: Blob): Promise<string> {
  const storageRef = ref(storage, ruta);
  for (let intento = 0; intento <= ESPERAS_REINTENTO_MS.length; intento++) {
    try {
      await uploadBytes(storageRef, archivo);
      return getDownloadURL(storageRef);
    } catch (error) {
      const quedanReintentos = intento < ESPERAS_REINTENTO_MS.length;
      if (!esPermisoDenegado(error) || !quedanReintentos) throw error;
      await new Promise((resolve) => setTimeout(resolve, ESPERAS_REINTENTO_MS[intento]));
    }
  }
  throw new Error('subirArchivo: inalcanzable');
}
