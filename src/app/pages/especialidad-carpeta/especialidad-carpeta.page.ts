import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { CitasService } from '../../services/citas.service';
import { DocumentosService } from '../../services/documentos.service';
import { EspecialidadesService } from '../../services/especialidades.service';
import { ExamenesService } from '../../services/examenes.service';
import { HistorialService } from '../../services/historial.service';

@Component({
  selector: 'app-especialidad-carpeta',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
  ],
  templateUrl: './especialidad-carpeta.page.html',
})
export class EspecialidadCarpetaPage {
  private route = inject(ActivatedRoute);
  private especialidadesSvc = inject(EspecialidadesService);
  private historialSvc = inject(HistorialService);
  private documentosSvc = inject(DocumentosService);
  private citasSvc = inject(CitasService);
  private examenesSvc = inject(ExamenesService);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';
  especialidadId = this.route.snapshot.paramMap.get('especialidadId') ?? '';

  especialidad = toSignal(this.especialidadesSvc.item$(this.personaId, this.especialidadId));
  entradas = toSignal(this.historialSvc.porEspecialidad$(this.personaId, this.especialidadId), { initialValue: [] });
  documentos = toSignal(this.documentosSvc.porEspecialidad$(this.personaId, this.especialidadId), {
    initialValue: [],
  });
  citas = toSignal(this.citasSvc.porEspecialidad$(this.personaId, this.especialidadId), { initialValue: [] });
  examenes = toSignal(this.examenesSvc.porEspecialidad$(this.personaId, this.especialidadId), { initialValue: [] });
}
