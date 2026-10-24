import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { CompartirPinComponent } from '../../shared/compartir-pin/compartir-pin.component';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { calcularEdad } from '../../core/edad';
import { formatearRut } from '../../core/rut';
import type { Persona } from '../../models';
import { PersonasService } from '../../services/personas.service';
import { avatarSrc, inicialPersona } from '../../shared/avatar';
import { datosFaltantes, etiquetaRelacion, etiquetaSexo } from '../../shared/persona-datos';
import { nombreCompleto } from '../../shared/persona-nombre';

interface Dato {
  etiqueta: string;
  valor: string;
  /** Si es un teléfono, se puede tocar para llamar. */
  tel?: string;
}

interface SeccionDatos {
  titulo: string;
  icono: string;
  datos: Dato[];
}

/**
 * "Datos personales" de una Persona: todo lo que no es historial clínico
 * (identificación, contacto, vivienda, emergencia, salud urgente, previsión)
 * en una sola vista de lectura, más las acciones de administración del
 * perfil (editar, compartir por PIN, eliminar). Se entra desde el engranaje
 * del detalle de la Persona, y para "yo mismo/a" también desde Ajustes.
 */
@Component({
  selector: 'app-persona-datos',
  standalone: true,
  imports: [CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonIcon, IonContent],
  templateUrl: './persona-datos.page.html',
  styleUrl: './persona-datos.page.scss',
})
export class PersonaDatosPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private personasSvc = inject(PersonasService);
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';

  persona = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.personasSvc.persona$(params.get('id') ?? '')))
  );

  /** Solo el titular administra el PIN y puede eliminar (firestore.rules). */
  esTitular = computed(() => this.persona()?.uidTitular === this.auth.usuario()?.uid);

  faltantes = computed(() => {
    const p = this.persona();
    return p ? datosFaltantes(p) : [];
  });

  secciones = computed<SeccionDatos[]>(() => {
    const p = this.persona();
    return p ? this.armarSecciones(p) : [];
  });

  readonly nombreCompleto = nombreCompleto;
  readonly inicialPersona = inicialPersona;
  readonly avatarSrc = avatarSrc;
  readonly etiquetaRelacion = etiquetaRelacion;

  private armarSecciones(p: Persona): SeccionDatos[] {
    const edad = calcularEdad(p.fechaNacimiento);
    const nacimiento = p.fechaNacimiento
      ? `${p.fechaNacimiento}${edad !== null ? ` (${edad} ${edad === 1 ? 'año' : 'años'})` : ''}`
      : '';
    const lista = (l?: string[]) => (l ?? []).join(', ');
    const vivienda = [p.direccion, p.direccionDetalle].filter((v) => !!v?.trim()).join(', ');

    return [
      {
        titulo: 'Identificación',
        icono: 'person-outline',
        datos: [
          { etiqueta: 'RUT', valor: p.rut ? formatearRut(p.rut) : '' },
          { etiqueta: 'Nacimiento', valor: nacimiento },
          { etiqueta: 'Sexo', valor: etiquetaSexo(p.sexo) },
          { etiqueta: 'Nacionalidad', valor: p.nacionalidad ?? '' },
        ],
      },
      {
        titulo: 'Contacto',
        icono: 'call-outline',
        datos: [
          { etiqueta: 'Teléfono', valor: p.telefono ?? '', tel: p.telefono },
          { etiqueta: 'Correo', valor: p.email ?? '' },
        ],
      },
      {
        titulo: 'Vivienda',
        icono: 'home-outline',
        datos: [
          { etiqueta: 'Dirección', valor: vivienda },
          { etiqueta: 'Comuna', valor: p.comuna ?? '' },
          { etiqueta: 'Región', valor: p.region ?? '' },
        ],
      },
      {
        titulo: 'Contacto de emergencia',
        icono: 'alert-circle-outline',
        datos: [
          { etiqueta: 'Nombre', valor: p.contactoEmergencia ?? '' },
          { etiqueta: 'Parentesco', valor: p.contactoEmergenciaParentesco ?? '' },
          { etiqueta: 'Teléfono', valor: p.telefonoEmergencia ?? '', tel: p.telefonoEmergencia },
          ...(p.contactosEmergenciaAdicionales ?? []).map((c, i) => ({
            etiqueta: `Contacto ${i + 2}`,
            valor: `${c.nombre}${c.parentesco ? ` (${c.parentesco})` : ''} · ${c.telefono}`,
            tel: c.telefono,
          })),
        ],
      },
      {
        titulo: 'Salud urgente',
        icono: 'medical-outline',
        datos: [
          { etiqueta: 'Grupo sanguíneo', valor: p.grupoSanguineo ?? '' },
          { etiqueta: 'Alergias', valor: lista(p.alergias) },
          { etiqueta: 'Enfermedades crónicas', valor: lista(p.enfermedadesCronicas) },
          { etiqueta: 'Medicamentos permanentes', valor: lista(p.medicamentosPermanentes) },
          { etiqueta: 'Peso', valor: p.pesoKg ? `${p.pesoKg} kg` : '' },
          { etiqueta: 'Estatura', valor: p.estaturaCm ? `${p.estaturaCm} cm` : '' },
          { etiqueta: 'Dispositivos médicos', valor: lista(p.dispositivosMedicos) },
          { etiqueta: 'Donante de órganos', valor: p.donanteOrganos ? 'Sí' : 'No' },
          { etiqueta: 'Otras notas', valor: p.notasEmergencia ?? '' },
        ],
      },
      {
        titulo: 'Previsión y médico tratante',
        icono: 'business-outline',
        datos: [
          { etiqueta: 'Previsión', valor: p.prevision ?? '' },
          { etiqueta: 'Médico tratante', valor: p.medicoTratante ?? '' },
          { etiqueta: 'Teléfono del médico', valor: p.telefonoMedicoTratante ?? '', tel: p.telefonoMedicoTratante },
        ],
      },
    ];
  }

  async compartirPorPin(): Promise<void> {
    const p = this.persona();
    const modal = await this.modalCtrl.create({
      component: CompartirPinComponent,
      componentProps: { personaId: this.personaId, personaNombre: p ? nombreCompleto(p) : '' },
    });
    await modal.present();
  }

  async confirmarEliminar(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar persona',
      message: 'Se va a eliminar este perfil y dejará de verse en la cuenta. ¿Continuar?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.personasSvc.eliminar(this.personaId);
            await this.router.navigateByUrl('/personas');
          },
        },
      ],
    });
    await alert.present();
  }
}
