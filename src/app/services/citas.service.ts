import { Injectable } from '@angular/core';
import { orderBy, where } from 'firebase/firestore';
import { SubcoleccionService } from '../core/subcoleccion.service';
import type { Cita } from '../models';

@Injectable({ providedIn: 'root' })
export class CitasService extends SubcoleccionService<Cita> {
  protected nombreColeccion = 'citas';

  override lista$(personaId: string) {
    return super.lista$(personaId, orderBy('fechaInicio', 'asc'));
  }

  /** Agenda compartida: todas las citas de todas las Personas de la cuenta (sección 4.3). */
  deLaCuentaOrdenadas$(uid: string) {
    return this.deLaCuenta$(where('creadoPor', '==', uid), orderBy('fechaInicio', 'asc'));
  }

  /** Citas de toda la cuenta cuya fechaInicio cae en la fecha ISO dada (para el recordatorio diario). */
  delDiaDeLaCuenta$(uid: string, fechaISO: string) {
    return this.deLaCuenta$(where('creadoPor', '==', uid), where('fechaInicio', '>=', `${fechaISO}T00:00`), where('fechaInicio', '<=', `${fechaISO}T23:59`));
  }

  porEspecialidad$(personaId: string, especialidadId: string) {
    return super.lista$(personaId, where('especialidadId', '==', especialidadId), orderBy('fechaInicio', 'asc'));
  }
}
