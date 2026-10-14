import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/** Sube un archivo a Storage en la ruta dada y devuelve su URL de descarga pública. */
export async function subirArchivo(ruta: string, archivo: Blob): Promise<string> {
  const storageRef = ref(storage, ruta);
  await uploadBytes(storageRef, archivo);
  return getDownloadURL(storageRef);
}
