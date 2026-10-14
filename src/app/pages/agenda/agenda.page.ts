import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import type { User } from 'firebase/auth';
import { where } from 'firebase/firestore';
import { filter, switchMap } from 'rxjs';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { SelectorPersonaService } from '../../core/selector-persona.service';
import { TIPOS_CITA } from '../../models';
import { CitasService } from '../../services/citas.service';
import { MedicamentosActivosService } from '../../services/medicamentos-activos.service';
import { VacunasService } from '../../services/vacunas.service';

interface EventoDia {
  tipo: 'cita' | 'vacuna' | 'medicamento-fin';
  color: string;
  titulo: string;
  personaId: string;
  personaNombre?: string;
  citaId?: string;
}

interface CeldaMes {
  iso: string | null;
  numero: number | null;
  esHoy: boolean;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
  ],
  templateUrl: './agenda.page.html',
  styleUrl: './agenda.page.scss',
})
export class AgendaPage {
  private auth = inject(AuthService);
  private citasSvc = inject(CitasService);
  private vacunasSvc = inject(VacunasService);
  private medicamentosSvc = inject(MedicamentosActivosService);
  private selectorPersona = inject(SelectorPersonaService);
  private router = inject(Router);

  private usuario$ = toObservable(this.auth.usuario).pipe(filter((u): u is User => !!u));

  citas = toSignal(
    this.usuario$.pipe(switchMap((u) => this.citasSvc.deLaCuenta$(where('creadoPor', '==', u.uid)))),
    { initialValue: [] }
  );
  vacunas = toSignal(
    this.usuario$.pipe(switchMap((u) => this.vacunasSvc.deLaCuenta$(where('creadoPor', '==', u.uid)))),
    { initialValue: [] }
  );
  medicamentos = toSignal(
    this.usuario$.pipe(switchMap((u) => this.medicamentosSvc.deLaCuenta$(where('creadoPor', '==', u.uid)))),
    { initialValue: [] }
  );

  mesActual = signal(this.inicioDeMes(new Date()));
  diaSeleccionado = signal(new Date().toISOString().slice(0, 10));

  tituloMes = computed(() =>
    this.mesActual().toLocaleDateString('es', { month: 'long', year: 'numeric' })
  );

  eventosPorFecha = computed(() => {
    const mapa = new Map<string, EventoDia[]>();
    const agregar = (fecha: string, ev: EventoDia) => {
      const lista = mapa.get(fecha) ?? [];
      lista.push(ev);
      mapa.set(fecha, lista);
    };

    for (const c of this.citas()) {
      const fecha = c.fechaInicio?.slice(0, 10);
      if (!fecha) continue;
      const color = TIPOS_CITA.find((t) => t.value === c.tipo)?.color ?? '#4f8cff';
      agregar(fecha, {
        tipo: 'cita',
        color,
        titulo: c.titulo,
        personaId: c.personaId,
        personaNombre: c.personaNombre,
        citaId: c.id,
      });
    }
    for (const v of this.vacunas()) {
      if (!v.proximaFecha) continue;
      agregar(v.proximaFecha, {
        tipo: 'vacuna',
        color: '#10b981',
        titulo: `Vacuna: ${v.tipo}`,
        personaId: v.personaId,
      });
    }
    for (const m of this.medicamentos()) {
      if (!m.fechaFin) continue;
      agregar(m.fechaFin, {
        tipo: 'medicamento-fin',
        color: '#f59e0b',
        titulo: `Termina: ${m.nombre}`,
        personaId: m.personaId,
      });
    }
    return mapa;
  });

  celdas = computed<CeldaMes[]>(() => {
    const mes = this.mesActual();
    const year = mes.getFullYear();
    const month = mes.getMonth();
    const primerDiaSemana = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = lunes
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    const hoyISO = new Date().toISOString().slice(0, 10);

    const celdas: CeldaMes[] = [];
    for (let i = 0; i < primerDiaSemana; i++) {
      celdas.push({ iso: null, numero: null, esHoy: false });
    }
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      celdas.push({ iso, numero: dia, esHoy: iso === hoyISO });
    }
    while (celdas.length % 7 !== 0) {
      celdas.push({ iso: null, numero: null, esHoy: false });
    }
    return celdas;
  });

  eventosDelDiaSeleccionado = computed(() => this.eventosPorFecha().get(this.diaSeleccionado()) ?? []);

  eventosDe(iso: string | null): EventoDia[] {
    if (!iso) return [];
    return this.eventosPorFecha().get(iso) ?? [];
  }

  mesAnterior(): void {
    const m = this.mesActual();
    this.mesActual.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  mesSiguiente(): void {
    const m = this.mesActual();
    this.mesActual.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  seleccionarDia(iso: string | null): void {
    if (iso) this.diaSeleccionado.set(iso);
  }

  private inicioDeMes(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  async nuevaCita(): Promise<void> {
    const uid = this.auth.usuario()?.uid;
    if (!uid) return;
    const personaId = await this.selectorPersona.elegir(uid, '¿Para quién es la cita?');
    if (personaId) await this.router.navigate(['/agenda', personaId, 'nueva']);
  }
}
