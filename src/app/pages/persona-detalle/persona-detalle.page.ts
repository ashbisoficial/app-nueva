import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { switchMap } from 'rxjs';
import { calcularEdad } from '../../core/edad';
import { PersonasService } from '../../services/personas.service';
import { inicialPersona } from '../../shared/avatar';
import { datosFaltantes, etiquetaRelacion } from '../../shared/persona-datos';
import { nombreCompleto } from '../../shared/persona-nombre';

/**
 * Detalle de una Persona: arriba solo lo que importa en una urgencia (datos
 * de salud críticos + contacto de emergencia a un toque de llamar), y abajo
 * los módulos. Todos los datos personales y la administración del perfil
 * (compartir por PIN, eliminar) viven en persona-datos, detrás del engranaje.
 */
@Component({
  selector: 'app-persona-detalle',
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
  ],
  templateUrl: './persona-detalle.page.html',
  styleUrl: './persona-detalle.page.scss',
})
export class PersonaDetallePage {
  private route = inject(ActivatedRoute);
  private personasSvc = inject(PersonasService);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';

  persona = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.personasSvc.persona$(params.get('id') ?? '')))
  );

  faltantes = computed(() => {
    const p = this.persona();
    return p ? datosFaltantes(p) : [];
  });

  readonly modulos = [
    { label: 'Historial clínico', ruta: 'historial', icono: 'document-text-outline' },
    { label: 'Vacunas', ruta: 'vacunas', icono: 'medical-outline' },
    { label: 'Medicamentos activos', ruta: 'medicamentos', icono: 'medkit-outline' },
    { label: 'Exámenes', ruta: 'examenes', icono: 'flask-outline' },
    { label: 'Documentos', ruta: 'documentos', icono: 'folder-outline' },
    { label: 'Especialidades', ruta: 'especialidades', icono: 'pricetag-outline' },
    { label: 'Carnet de emergencia', ruta: 'ficha', icono: 'qr-code-outline' },
    { label: 'QR de pérdida', ruta: 'ficha-perdida', icono: 'alert-circle-outline' },
  ];

  readonly nombreCompleto = nombreCompleto;
  readonly calcularEdad = calcularEdad;
  readonly inicialPersona = inicialPersona;
  readonly etiquetaRelacion = etiquetaRelacion;
}
