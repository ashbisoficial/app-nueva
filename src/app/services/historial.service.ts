import { Injectable } from '@angular/core';
import { orderBy, serverTimestamp, where } from 'firebase/firestore';
import { SubcoleccionService } from '../core/subcoleccion.service';
import { entradaTieneContenido, type Entrada } from '../models';

/**
 * Historial clínico: append-only (sección 3.3 del spec). Solo expone crear() y
 * lectura; actualizar/eliminar quedan deshabilitados incluso desde el propio
 * cliente, como refuerzo de lo que ya bloquean las reglas de Firestore.
 */
@Injectable({ providedIn: 'root' })
export class HistorialService extends SubcoleccionService<Entrada> {
  protected nombreColeccion = 'historialMedico';

  timeline$(personaId: string) {
    return this.lista$(personaId, orderBy('fecha', 'desc'));
  }

  porEspecialidad$(personaId: string, especialidadId: string) {
    return this.lista$(personaId, where('especialidadId', '==', especialidadId), orderBy('fecha', 'desc'));
  }

  override async crear(
    personaId: string,
    datos: Omit<Entrada, 'id' | 'autorUid' | 'autorNombre' | 'createdAt'> & {
      autorUid: string;
      autorNombre: string;
    }
  ): Promise<string> {
    if (!entradaTieneContenido(datos)) {
      throw new Error(
        'La entrada necesita al menos un campo con contenido (motivo, diagnóstico, tratamiento, notas, medicamentos o exámenes).'
      );
    }
    return super.crear(personaId, { ...datos, createdAt: serverTimestamp() });
  }

  override actualizar(): Promise<void> {
    throw new Error('El historial clínico es append-only: una entrada nunca se edita.');
  }

  override eliminar(): Promise<void> {
    throw new Error('El historial clínico es append-only: una entrada nunca se borra.');
  }
}
