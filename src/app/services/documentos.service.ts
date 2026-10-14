import { Injectable } from '@angular/core';
import { orderBy, where } from 'firebase/firestore';
import { subirArchivo } from '../core/storage';
import { SubcoleccionService } from '../core/subcoleccion.service';
import type { Documento } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentosService extends SubcoleccionService<Documento> {
  protected nombreColeccion = 'documentos';

  override lista$(personaId: string) {
    return super.lista$(personaId, orderBy('subidoEn', 'desc'));
  }

  porEspecialidad$(personaId: string, especialidadId: string) {
    return super.lista$(personaId, where('especialidadId', '==', especialidadId), orderBy('subidoEn', 'desc'));
  }

  /** Sube el archivo a Storage (personas/{id}/documentos/...) y devuelve su URL de descarga. */
  async subirArchivo(personaId: string, archivo: Blob, nombreArchivo: string): Promise<string> {
    const path = `personas/${personaId}/documentos/${Date.now()}_${nombreArchivo}`;
    return subirArchivo(path, archivo);
  }
}
