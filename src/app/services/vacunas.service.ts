import { Injectable } from '@angular/core';
import { orderBy, where } from 'firebase/firestore';
import { SubcoleccionService } from '../core/subcoleccion.service';
import type { Vacuna } from '../models';

@Injectable({ providedIn: 'root' })
export class VacunasService extends SubcoleccionService<Vacuna> {
  protected nombreColeccion = 'vacunas';

  override lista$(personaId: string) {
    return super.lista$(personaId, orderBy('fechaAplicacion', 'desc'));
  }

  /** Vacunas de toda la cuenta cuya proximaFecha cae en la fecha ISO (yyyy-MM-dd) dada. */
  proximasDeLaCuenta$(uid: string, fechaISO: string) {
    return this.deLaCuenta$(where('creadoPor', '==', uid), where('proximaFecha', '==', fechaISO));
  }
}
