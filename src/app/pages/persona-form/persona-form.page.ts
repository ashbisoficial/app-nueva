import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';
import { deleteField } from 'firebase/firestore';
import { AuthService } from '../../core/auth.service';
import { formatearRut } from '../../core/rut';
import { subirArchivo } from '../../core/storage';
import type { Persona, RelacionPersona } from '../../models';
import { PersonasService } from '../../services/personas.service';

@Component({
  selector: 'app-persona-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonToggle,
  ],
  templateUrl: './persona-form.page.html',
  styleUrl: './persona-form.page.scss',
})
export class PersonaFormPage implements OnInit {
  personaId: string | null = null;
  guardando = signal(false);
  error = signal<string | null>(null);

  /** Sección 6.2: solo se ofrece "Yo mismo/a" si la cuenta todavía no tiene una. */
  puedeElegirYoMismo = signal(false);
  relacion: RelacionPersona | '' = '';
  relacionExistente: RelacionPersona | null = null;
  rutExistente = '';

  nombres = '';
  apellidos = '';
  fechaNacimiento = '';
  sexo = '';
  direccion = '';
  comuna = '';

  grupoSanguineo = '';
  alergiasTexto = '';
  enfermedadesTexto = '';
  medicamentosTexto = '';
  pesoKg: number | null = null;
  estaturaCm: number | null = null;
  dispositivosMedicosTexto = '';
  donanteOrganos = false;
  notasEmergencia = '';

  prevision = '';
  medicoTratante = '';
  telefonoMedicoTratante = '';

  contactoEmergencia = '';
  telefonoEmergencia = '';

  rutDependiente = '';
  documentoRespaldo: File | null = null;

  fotoArchivo: File | null = null;
  fotoPreviewUrl = signal<string | null>(null);
  fotoExistenteUrl = signal<string | null>(null);
  quitarFotoExistente = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private personasSvc: PersonasService
  ) {}

  async ngOnInit(): Promise<void> {
    this.personaId = this.route.snapshot.paramMap.get('id');
    if (this.personaId) {
      const persona = await this.personasSvc.obtener(this.personaId);
      if (!persona) return;
      this.relacionExistente = persona.relacion;
      this.rutExistente = formatearRut(persona.rut);
      // Compatibilidad: una Persona creada antes de separar nombres/apellidos
      // solo tiene el `nombre` legado — se precarga completo en "Nombres"
      // para que quien edite lo pueda separar, en vez de perderlo.
      this.nombres = persona.nombres || persona.nombre || '';
      this.apellidos = persona.apellidos ?? '';
      this.fechaNacimiento = persona.fechaNacimiento;
      this.sexo = persona.sexo;
      this.direccion = persona.direccion ?? '';
      this.comuna = persona.comuna ?? '';
      this.grupoSanguineo = persona.grupoSanguineo ?? '';
      this.contactoEmergencia = persona.contactoEmergencia ?? '';
      this.telefonoEmergencia = persona.telefonoEmergencia ?? '';
      this.alergiasTexto = (persona.alergias ?? []).join(', ');
      this.enfermedadesTexto = (persona.enfermedadesCronicas ?? []).join(', ');
      this.medicamentosTexto = (persona.medicamentosPermanentes ?? []).join(', ');
      this.pesoKg = persona.pesoKg ?? null;
      this.estaturaCm = persona.estaturaCm ?? null;
      this.dispositivosMedicosTexto = (persona.dispositivosMedicos ?? []).join(', ');
      this.donanteOrganos = persona.donanteOrganos ?? false;
      this.notasEmergencia = persona.notasEmergencia ?? '';
      this.prevision = persona.prevision ?? '';
      this.medicoTratante = persona.medicoTratante ?? '';
      this.telefonoMedicoTratante = persona.telefonoMedicoTratante ?? '';
      this.fotoExistenteUrl.set(persona.fotoUrl ?? null);
      return;
    }

    const uid = this.auth.usuario()?.uid;
    if (!uid) return;
    const tiene = await this.personasSvc.tieneYoMismo(uid);
    this.puedeElegirYoMismo.set(!tiene);
    this.relacion = tiene ? 'menor_a_cargo' : 'yo_mismo';
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.documentoRespaldo = input.files?.[0] ?? null;
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.fotoArchivo = archivo;
    this.quitarFotoExistente = false;
    this.fotoPreviewUrl.set(archivo ? URL.createObjectURL(archivo) : null);
  }

  quitarFoto(): void {
    this.fotoArchivo = null;
    this.fotoPreviewUrl.set(null);
    this.quitarFotoExistente = true;
  }

  etiquetaDocumento(): string {
    return this.relacion === 'menor_a_cargo'
      ? 'Certificado de nacimiento'
      : 'Carnet + documento de tutela/poder';
  }

  etiquetaRelacion(relacion: RelacionPersona | null): string {
    if (relacion === 'yo_mismo') return 'Yo mismo/a';
    if (relacion === 'menor_a_cargo') return 'Menor de edad a cargo';
    if (relacion === 'adulto_mayor_a_cargo') return 'Adulto mayor/convaleciente a cargo';
    return '';
  }

  /** Sube la foto nueva (si se eligió una) o borra la existente (si se pidió quitarla). */
  private async guardarFoto(id: string): Promise<void> {
    if (this.fotoArchivo) {
      const ruta = `personas/${id}/perfil/foto_${Date.now()}_${this.fotoArchivo.name}`;
      const fotoUrl = await subirArchivo(ruta, this.fotoArchivo);
      await this.personasSvc.actualizar(id, { fotoUrl });
    } else if (this.quitarFotoExistente) {
      await this.personasSvc.actualizar(id, { fotoUrl: deleteField() } as unknown as Partial<Persona>);
    }
  }

  private aLista(texto: string): string[] {
    return texto
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  async guardar(): Promise<void> {
    this.error.set(null);
    this.guardando.set(true);
    try {
      const datos = {
        nombres: this.nombres.trim(),
        apellidos: this.apellidos.trim(),
        fechaNacimiento: this.fechaNacimiento,
        sexo: this.sexo,
        direccion: this.direccion || undefined,
        comuna: this.comuna || undefined,
        grupoSanguineo: this.grupoSanguineo || undefined,
        contactoEmergencia: this.contactoEmergencia || undefined,
        telefonoEmergencia: this.telefonoEmergencia || undefined,
        alergias: this.aLista(this.alergiasTexto),
        enfermedadesCronicas: this.aLista(this.enfermedadesTexto),
        medicamentosPermanentes: this.aLista(this.medicamentosTexto),
        pesoKg: this.pesoKg ?? undefined,
        estaturaCm: this.estaturaCm ?? undefined,
        dispositivosMedicos: this.aLista(this.dispositivosMedicosTexto),
        donanteOrganos: this.donanteOrganos,
        notasEmergencia: this.notasEmergencia || undefined,
        prevision: this.prevision || undefined,
        medicoTratante: this.medicoTratante || undefined,
        telefonoMedicoTratante: this.telefonoMedicoTratante || undefined,
      };

      if (this.personaId) {
        await this.personasSvc.actualizar(this.personaId, datos);
        await this.guardarFoto(this.personaId);
        await this.router.navigateByUrl(`/personas/${this.personaId}`);
        return;
      }

      const uid = this.auth.usuario()?.uid;
      if (!uid) return;

      let id: string;
      if (this.relacion === 'yo_mismo') {
        const usuario = await this.auth.obtenerUsuario(uid);
        if (!usuario?.rut) {
          this.error.set('Tu cuenta todavía no tiene un RUT registrado.');
          return;
        }
        id = await this.personasSvc.crearTitular(uid, datos, usuario.rut);
        await this.guardarFoto(id);
      } else {
        if (!this.documentoRespaldo) {
          this.error.set(`Falta subir: ${this.etiquetaDocumento()}.`);
          return;
        }
        id = await this.personasSvc.crearDependiente(
          uid,
          this.relacion as 'menor_a_cargo' | 'adulto_mayor_a_cargo',
          datos,
          this.rutDependiente
        );
        const ruta = `personas/${id}/perfil/respaldo_${Date.now()}_${this.documentoRespaldo.name}`;
        const url = await subirArchivo(ruta, this.documentoRespaldo);
        await this.personasSvc.actualizar(id, { documentoRespaldoUrl: url } as Partial<Persona>);
        await this.guardarFoto(id);
      }

      await this.router.navigateByUrl(`/personas/${id}`);
    } catch (e) {
      const codigo = (e as Error).message;
      if (codigo === 'rut-invalido') {
        this.error.set('Ese RUT no es válido. Revisa los números y el dígito verificador.');
      } else if (codigo === 'rut-duplicado') {
        this.error.set('Ese RUT ya está registrado (como cuenta o como otra persona a cargo).');
      } else {
        this.error.set('No se pudo guardar. Intenta de nuevo.');
      }
    } finally {
      this.guardando.set(false);
    }
  }
}
