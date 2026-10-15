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
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
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
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
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

  nombre = '';
  fechaNacimiento = '';
  sexo = '';
  grupoSanguineo = '';
  contactoEmergencia = '';
  telefonoEmergencia = '';
  alergiasTexto = '';
  enfermedadesTexto = '';
  medicamentosTexto = '';

  rutDependiente = '';
  documentoRespaldo: File | null = null;

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
      this.nombre = persona.nombre;
      this.fechaNacimiento = persona.fechaNacimiento;
      this.sexo = persona.sexo;
      this.grupoSanguineo = persona.grupoSanguineo ?? '';
      this.contactoEmergencia = persona.contactoEmergencia ?? '';
      this.telefonoEmergencia = persona.telefonoEmergencia ?? '';
      this.alergiasTexto = (persona.alergias ?? []).join(', ');
      this.enfermedadesTexto = (persona.enfermedadesCronicas ?? []).join(', ');
      this.medicamentosTexto = (persona.medicamentosPermanentes ?? []).join(', ');
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
        nombre: this.nombre.trim(),
        fechaNacimiento: this.fechaNacimiento,
        sexo: this.sexo,
        grupoSanguineo: this.grupoSanguineo || undefined,
        contactoEmergencia: this.contactoEmergencia || undefined,
        telefonoEmergencia: this.telefonoEmergencia || undefined,
        alergias: this.aLista(this.alergiasTexto),
        enfermedadesCronicas: this.aLista(this.enfermedadesTexto),
        medicamentosPermanentes: this.aLista(this.medicamentosTexto),
      };

      if (this.personaId) {
        await this.personasSvc.actualizar(this.personaId, datos);
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
