import { Injectable } from '@angular/core';
import { orderBy, where } from 'firebase/firestore';
import { SubcoleccionService } from '../core/subcoleccion.service';
import { HistorialService } from './historial.service';
import type { Examen } from '../models';

@Injectable({ providedIn: 'root' })
export class ExamenesService extends SubcoleccionService<Examen> {
  protected nombreColeccion = 'examenes';

  constructor(private historial: HistorialService) {
    super();
  }

  override lista$(personaId: string) {
    return super.lista$(personaId, orderBy('fechaProgramada', 'desc'));
  }

  porEspecialidad$(personaId: string, especialidadId: string) {
    return super.lista$(personaId, where('especialidadId', '==', especialidadId), orderBy('fechaProgramada', 'desc'));
  }

  /**
   * Marca un examen como realizado y lo deja doble-indexado (sección 4.2):
   * actualiza examenes/{id} y agrega una entrada `examen_resultado` al historial.
   */
  async marcarRealizado(
    personaId: string,
    examenId: string,
    datos: { fechaRealizado: string; resultadoUrl?: string },
    autor: { autorUid: string; autorNombre: string }
  ): Promise<void> {
    const examen = await this.obtener(personaId, examenId);
    if (!examen) throw new Error('Examen no encontrado');

    await this.actualizar(personaId, examenId, {
      realizado: true,
      fechaRealizado: datos.fechaRealizado,
      resultadoUrl: datos.resultadoUrl,
    });

    await this.historial.crear(personaId, {
      tipo: 'examen_resultado',
      fecha: datos.fechaRealizado,
      texto: `Resultado de: ${examen.tipo}`,
      archivoUrl: datos.resultadoUrl,
      especialidadId: examen.especialidadId,
      autorUid: autor.autorUid,
      autorNombre: autor.autorNombre,
    });
  }
}
