import { Injectable } from '@angular/core';
import { orderBy, where } from 'firebase/firestore';
import { SubcoleccionService } from '../core/subcoleccion.service';
import type { MedicamentoActivo } from '../models';

@Injectable({ providedIn: 'root' })
export class MedicamentosActivosService extends SubcoleccionService<MedicamentoActivo> {
  protected nombreColeccion = 'medicamentosActivos';

  override lista$(personaId: string) {
    return super.lista$(personaId, orderBy('fechaInicio', 'desc'));
  }

  /** Tratamientos de toda la cuenta cuya fechaFin cae en la fecha ISO dada (para avisar "se termina"). */
  porTerminarDeLaCuenta$(uid: string, fechaFinISO: string) {
    return this.deLaCuenta$(where('creadoPor', '==', uid), where('fechaFin', '==', fechaFinISO));
  }
}
