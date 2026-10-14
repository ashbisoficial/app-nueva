import { Injectable } from '@angular/core';
import { where } from 'firebase/firestore';
import { Observable, combineLatest, map } from 'rxjs';
import type { Cita, MedicamentoActivo, Vacuna } from '../models';
import { CitasService } from './citas.service';
import { MedicamentosActivosService } from './medicamentos-activos.service';
import { VacunasService } from './vacunas.service';

export interface EventoProximo {
  fecha: string;
  tipo: 'cita' | 'vacuna' | 'medicamento-fin';
  titulo: string;
  personaId: string;
  personaNombre?: string;
}

/** Agrega citas/vacunas/medicamentos de TODAS las personas de la cuenta para el Home (sección 8). */
@Injectable({ providedIn: 'root' })
export class HomeService {
  constructor(
    private citasSvc: CitasService,
    private vacunasSvc: VacunasService,
    private medicamentosSvc: MedicamentosActivosService
  ) {}

  proximosEventos$(uid: string, diasAdelante = 14): Observable<EventoProximo[]> {
    const hoyISO = new Date().toISOString().slice(0, 10);
    const limiteISO = new Date(Date.now() + diasAdelante * 86400000).toISOString().slice(0, 10);

    const citas$ = this.citasSvc.deLaCuenta$(where('creadoPor', '==', uid));
    const vacunas$ = this.vacunasSvc.deLaCuenta$(where('creadoPor', '==', uid));
    const medicamentos$ = this.medicamentosSvc.deLaCuenta$(where('creadoPor', '==', uid));

    return combineLatest([citas$, vacunas$, medicamentos$]).pipe(
      map(([citas, vacunas, medicamentos]) => {
        const eventos: EventoProximo[] = [];

        for (const c of citas as (Cita & { personaId: string })[]) {
          const fechaSolo = c.fechaInicio?.slice(0, 10);
          if (fechaSolo && fechaSolo >= hoyISO && fechaSolo <= limiteISO) {
            eventos.push({
              fecha: c.fechaInicio,
              tipo: 'cita',
              titulo: c.titulo,
              personaId: c.personaId,
              personaNombre: c.personaNombre,
            });
          }
        }

        for (const v of vacunas as (Vacuna & { personaId: string })[]) {
          if (v.proximaFecha && v.proximaFecha >= hoyISO && v.proximaFecha <= limiteISO) {
            eventos.push({
              fecha: v.proximaFecha,
              tipo: 'vacuna',
              titulo: `Vacuna: ${v.tipo}`,
              personaId: v.personaId,
            });
          }
        }

        for (const m of medicamentos as (MedicamentoActivo & { personaId: string })[]) {
          if (m.fechaFin && m.fechaFin >= hoyISO && m.fechaFin <= limiteISO) {
            eventos.push({
              fecha: m.fechaFin,
              tipo: 'medicamento-fin',
              titulo: `Termina tratamiento: ${m.nombre}`,
              personaId: m.personaId,
            });
          }
        }

        return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
      })
    );
  }
}
