import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TIPOS_ENTRADA } from '../../models';
import { HistorialService } from '../../services/historial.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    IonFab,
    IonFabButton,
  ],
  templateUrl: './historial.page.html',
  styleUrl: './historial.page.scss',
})
export class HistorialPage {
  private route = inject(ActivatedRoute);
  private historialSvc = inject(HistorialService);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';

  entradas = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.historialSvc.timeline$(params.get('id') ?? '')))
  );

  etiquetaTipo(tipo: string): string {
    return TIPOS_ENTRADA.find((t) => t.value === tipo)?.label ?? tipo;
  }

  resumen(e: { motivo?: string; diagnostico?: string; texto?: string }): string {
    return e.motivo || e.diagnostico || e.texto || '';
  }
}
