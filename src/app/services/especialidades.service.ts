import { Injectable } from '@angular/core';
import { orderBy, where } from 'firebase/firestore';
import { SubcoleccionService } from '../core/subcoleccion.service';
import type { Especialidad } from '../models';

@Injectable({ providedIn: 'root' })
export class EspecialidadesService extends SubcoleccionService<Especialidad> {
  protected nombreColeccion = 'especialidades';

  activas$(personaId: string) {
    return this.lista$(personaId, where('activa', '==', true), orderBy('nombre'));
  }
}
