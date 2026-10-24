import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
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
import { cargarLibreriaPlaces } from '../../core/google-maps-loader';
import { formatearRut, validarRut } from '../../core/rut';
import { subirArchivo } from '../../core/storage';
import {
  MENSAJES,
  PATRON_NOMBRE,
  PATRON_TELEFONO,
  ValidacionFormulario,
  errorArchivo,
  primerError,
  reglas,
} from '../../core/validadores';
import type { ContactoEmergencia, Persona, RelacionPersona } from '../../models';
import { PersonasService } from '../../services/personas.service';
import { PARENTESCOS, REGIONES_CHILE, etiquetaRelacion } from '../../shared/persona-datos';

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
export class PersonaFormPage implements OnInit, AfterViewInit {
  @ViewChild('buscadorDireccion') private buscadorDireccionRef?: ElementRef<HTMLDivElement>;
  /** Se muestra solo si el widget de Google logró montarse (sin internet/bloqueado, el formulario sigue 100% editable a mano). */
  buscadorDireccionDisponible = signal(false);

  readonly patronNombre = PATRON_NOMBRE;
  readonly patronTelefono = PATRON_TELEFONO;
  readonly hoyISO = new Date().toISOString().slice(0, 10);
  readonly regiones = REGIONES_CHILE;
  readonly parentescos = PARENTESCOS;
  readonly etiquetaRelacion = etiquetaRelacion;

  personaId: string | null = null;
  /** Viene de completar-registro: primera vez que la cuenta carga sus propios datos. */
  bienvenida = false;
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
  nacionalidad = '';

  telefono = '';
  email = '';

  direccion = '';
  direccionDetalle = '';
  comuna = '';
  region = '';

  grupoSanguineo = '';
  alergiasTexto = '';
  enfermedadesTexto = '';
  medicamentosTexto = '';
  pesoKg: number | null = null;
  estaturaCm: number | null = null;
  dispositivosMedicosTexto = '';
  donanteOrganos = false;
  /** Habilita el módulo "QR de pérdida" en el detalle (pedido explícito: solo si la persona lo necesita). */
  requiereQrPerdida = false;
  notasEmergencia = '';

  prevision = '';
  medicoTratante = '';
  telefonoMedicoTratante = '';

  contactoEmergencia = '';
  contactoEmergenciaParentesco = '';
  telefonoEmergencia = '';
  /** Contactos de emergencia además del principal (hasta maxContactosExtra). */
  contactosExtra: ContactoEmergencia[] = [];
  readonly maxContactosExtra = 4;

  rutDependiente = '';
  documentoRespaldo: File | null = null;

  fotoArchivo: File | null = null;
  fotoPreviewUrl = signal<string | null>(null);
  fotoExistenteUrl = signal<string | null>(null);
  quitarFotoExistente = false;

  /** Reglas por campo (sección 8 del spec: un mensaje claro por campo, no un "dato inválido" genérico). */
  readonly v = new ValidacionFormulario({
    relacion: () => (this.personaId ? null : reglas.elegir(this.relacion)),
    rutDependiente: () => {
      if (this.personaId || !this.relacion || this.relacion === 'yo_mismo') return null;
      return primerError(reglas.requerido(this.rutDependiente), this.rutDependienteInvalido ? MENSAJES.rut : null);
    },
    documentoRespaldo: () => {
      if (this.personaId || !this.relacion || this.relacion === 'yo_mismo') return null;
      if (!this.documentoRespaldo) return `Falta subir: ${this.etiquetaDocumento()}.`;
      return errorArchivo(this.documentoRespaldo);
    },
    foto: () => (this.fotoArchivo ? errorArchivo(this.fotoArchivo, { permitePdf: false }) : null),
    nombres: () => primerError(reglas.requerido(this.nombres), reglas.nombre(this.nombres)),
    apellidos: () => primerError(reglas.requerido(this.apellidos), reglas.nombre(this.apellidos)),
    fechaNacimiento: () => primerError(reglas.requerido(this.fechaNacimiento), reglas.noFutura(this.fechaNacimiento)),
    sexo: () => reglas.elegir(this.sexo),
    nacionalidad: () => reglas.nombre(this.nacionalidad),
    telefono: () =>
      primerError(this.telefonoObligatorio ? reglas.requerido(this.telefono) : null, reglas.telefono(this.telefono)),
    email: () => reglas.correo(this.email),
    direccion: () => reglas.requerido(this.direccion),
    direccionDetalle: () => reglas.largoMaximo(this.direccionDetalle, 60),
    comuna: () => primerError(reglas.requerido(this.comuna), reglas.nombre(this.comuna)),
    region: () => reglas.elegir(this.region),
    contactoEmergencia: () => primerError(reglas.requerido(this.contactoEmergencia), reglas.nombre(this.contactoEmergencia)),
    contactoEmergenciaParentesco: () => reglas.elegir(this.contactoEmergenciaParentesco),
    telefonoEmergencia: () => primerError(reglas.requerido(this.telefonoEmergencia), reglas.telefono(this.telefonoEmergencia)),
    contactosExtra: () =>
      this.contactosExtra.some((_, i) => this.errorContactoExtra(i))
        ? 'Revisa los contactos de emergencia adicionales.'
        : null,
    alergias: () => reglas.largoMaximo(this.alergiasTexto, 500),
    enfermedades: () => reglas.largoMaximo(this.enfermedadesTexto, 500),
    medicamentos: () => reglas.largoMaximo(this.medicamentosTexto, 500),
    pesoKg: () => reglas.rango(this.pesoKg, 0.5, 300, 'kg'),
    estaturaCm: () => reglas.rango(this.estaturaCm, 20, 250, 'cm'),
    dispositivosMedicos: () => reglas.largoMaximo(this.dispositivosMedicosTexto, 500),
    notasEmergencia: () => reglas.largoMaximo(this.notasEmergencia, 1000),
    prevision: () => reglas.largoMaximo(this.prevision, 60),
    medicoTratante: () => reglas.largoMaximo(this.medicoTratante, 80),
    telefonoMedicoTratante: () => reglas.telefono(this.telefonoMedicoTratante),
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private personasSvc: PersonasService,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit(): Promise<void> {
    this.personaId = this.route.snapshot.paramMap.get('id');
    this.bienvenida = this.route.snapshot.queryParamMap.has('bienvenida');
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
      this.nacionalidad = persona.nacionalidad ?? '';
      this.telefono = persona.telefono ?? '';
      this.email = persona.email ?? '';
      this.direccion = persona.direccion ?? '';
      this.direccionDetalle = persona.direccionDetalle ?? '';
      this.comuna = persona.comuna ?? '';
      this.region = persona.region ?? '';
      this.grupoSanguineo = persona.grupoSanguineo ?? '';
      this.contactoEmergencia = persona.contactoEmergencia ?? '';
      this.contactoEmergenciaParentesco = persona.contactoEmergenciaParentesco ?? '';
      this.telefonoEmergencia = persona.telefonoEmergencia ?? '';
      this.contactosExtra = (persona.contactosEmergenciaAdicionales ?? []).map((c) => ({ ...c }));
      this.alergiasTexto = (persona.alergias ?? []).join(', ');
      this.enfermedadesTexto = (persona.enfermedadesCronicas ?? []).join(', ');
      this.medicamentosTexto = (persona.medicamentosPermanentes ?? []).join(', ');
      this.pesoKg = persona.pesoKg ?? null;
      this.estaturaCm = persona.estaturaCm ?? null;
      this.dispositivosMedicosTexto = (persona.dispositivosMedicos ?? []).join(', ');
      this.donanteOrganos = persona.donanteOrganos ?? false;
      this.requiereQrPerdida = persona.requiereQrPerdida ?? false;
      this.notasEmergencia = persona.notasEmergencia ?? '';
      this.prevision = persona.prevision ?? '';
      this.medicoTratante = persona.medicoTratante ?? '';
      this.telefonoMedicoTratante = persona.telefonoMedicoTratante ?? '';
      this.fotoExistenteUrl.set(persona.fotoUrl ?? null);
      return;
    }

    const usuario = this.auth.usuario();
    if (!usuario) return;
    const tiene = await this.personasSvc.tieneYoMismo(usuario.uid);
    this.puedeElegirYoMismo.set(!tiene);
    this.relacion = tiene ? 'menor_a_cargo' : 'yo_mismo';
    this.nacionalidad = 'Chilena';
    if (!tiene) {
      // Precarga lo que ya se sabe de la cuenta para "yo mismo/a"; se puede cambiar.
      this.email = usuario.email ?? '';
      const [nombres = '', ...resto] = (usuario.displayName ?? '').trim().split(/\s+/);
      this.nombres = nombres;
      this.apellidos = resto.join(' ');
    }
  }

  ngAfterViewInit(): void {
    void this.montarBuscadorDireccion();
  }

  /**
   * Buscador de dirección (sección 4.1): un widget de Google Places sobre el
   * campo "Calle y número" que autocompleta calle, comuna y región al elegir
   * una sugerencia. Es puramente un atajo — si el script de Google no carga
   * (sin internet, bloqueador de anuncios, etc.) esto simplemente no
   * aparece y los tres campos se siguen llenando a mano como siempre.
   */
  private async montarBuscadorDireccion(): Promise<void> {
    const contenedor = this.buscadorDireccionRef?.nativeElement;
    if (!contenedor) return;
    try {
      const { PlaceAutocompleteElement } = await cargarLibreriaPlaces();
      const buscador = new PlaceAutocompleteElement({ includedRegionCodes: ['cl'] });
      contenedor.appendChild(buscador);
      buscador.addEventListener('gmp-select', (evento: Event) => {
        void this.onLugarElegido(evento as unknown as { placePrediction: google.maps.places.PlacePrediction });
      });
      this.buscadorDireccionDisponible.set(true);
    } catch {
      // Sin Maps disponible: no se muestra nada, el resto del formulario no depende de esto.
    }
  }

  private async onLugarElegido(evento: { placePrediction: google.maps.places.PlacePrediction }): Promise<void> {
    try {
      const lugar = evento.placePrediction.toPlace();
      await lugar.fetchFields({ fields: ['addressComponents'] });
      this.aplicarComponentesDireccion(lugar.addressComponents ?? []);
    } catch {
      // Detalle no disponible: el usuario completa esos campos a mano, como siempre.
    }
  }

  private aplicarComponentesDireccion(componentes: google.maps.places.AddressComponent[]): void {
    const buscar = (tipos: string[]) =>
      componentes.find((c) => tipos.some((t) => c.types.includes(t)))?.longText ?? '';

    const calle = buscar(['route']);
    const numero = buscar(['street_number']);
    const comuna = buscar(['locality', 'administrative_area_level_3', 'sublocality_level_1']);
    const regionGoogle = buscar(['administrative_area_level_1']);

    if (calle || numero) {
      this.direccion = [calle, numero].filter(Boolean).join(' ');
      this.v.revalidar('direccion');
    }
    // Región primero: Comuna es texto libre y no depende de que la región ya
    // esté puesta, pero así coincide con el orden visual de los campos.
    const regionEncontrada = this.emparejarRegion(regionGoogle);
    if (regionEncontrada) {
      this.region = regionEncontrada;
      this.v.campo('region');
    }
    if (comuna) {
      this.comuna = comuna;
      this.v.revalidar('comuna');
    }
  }

  /** Google devuelve nombres de región con formato propio ("Región Metropolitana de Santiago") — se empareja con REGIONES_CHILE por coincidencia parcial, sin acentos ni mayúsculas. Si no encuentra nada, se deja para que el usuario elija a mano. */
  private emparejarRegion(nombreGoogle: string): string {
    if (!nombreGoogle) return '';
    const limpiar = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\bregion\b(\s+(de|del))?/g, '')
        .trim();
    const objetivo = limpiar(nombreGoogle);
    if (!objetivo) return '';
    return this.regiones.find((r) => limpiar(r).includes(objetivo) || objetivo.includes(limpiar(r))) ?? '';
  }

  agregarContacto(): void {
    if (this.contactosExtra.length < this.maxContactosExtra) {
      this.contactosExtra.push({ nombre: '', parentesco: '', telefono: '' });
    }
  }

  quitarContacto(i: number): void {
    this.contactosExtra.splice(i, 1);
    this.v.revalidar('contactosExtra');
  }

  /** Mismo criterio que el contacto principal: los tres datos, con formato. */
  errorContactoExtra(i: number): string | null {
    const c = this.contactosExtra[i];
    if (!c) return null;
    return primerError(
      reglas.requerido(c.nombre, 'Falta el nombre de este contacto.'),
      reglas.nombre(c.nombre),
      reglas.requerido(c.parentesco, 'Elige el parentesco de este contacto.'),
      reglas.requerido(c.telefono, 'Falta el teléfono de este contacto.'),
      reglas.telefono(c.telefono)
    );
  }

  /** Un menor muchas veces no tiene teléfono propio (ver datosFaltantes()). */
  get telefonoObligatorio(): boolean {
    const relacion = this.personaId ? this.relacionExistente : this.relacion;
    return relacion !== 'menor_a_cargo';
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.documentoRespaldo = input.files?.[0] ?? null;
    this.v.campo('documentoRespaldo');
  }



  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.fotoArchivo = archivo;
    this.quitarFotoExistente = false;
    this.fotoPreviewUrl.set(archivo ? URL.createObjectURL(archivo) : null);
    this.v.campo('foto');
  }

  quitarFoto(): void {
    this.fotoArchivo = null;
    this.fotoPreviewUrl.set(null);
    this.quitarFotoExistente = true;
    this.v.campo('foto');
  }

  etiquetaDocumento(): string {
    return this.relacion === 'menor_a_cargo'
      ? 'Certificado de nacimiento'
      : 'Carnet + documento de tutela/poder';
  }

  /** true solo cuando ya se escribió algo y ese algo no pasa el dígito verificador (no molesta mientras el campo está vacío). */
  get rutDependienteInvalido(): boolean {
    return this.rutDependiente.trim().length > 0 && !validarRut(this.rutDependiente);
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

  /**
   * Sube la foto y (para dependientes) el documento de respaldo. Se llama
   * DESPUÉS de que la Persona ya quedó creada/actualizada: si esto falla acá,
   * los datos principales ya están guardados — no se trata como un fallo
   * total ("no se pudo guardar") ni se deja reintentar guardar() de nuevo,
   * porque eso volvería a crear la Persona (duplicado). Se avisa aparte y se
   * navega igual; la foto/el respaldo se pueden volver a subir desde Editar.
   */
  private async guardarArchivos(id: string): Promise<void> {
    try {
      if (this.relacion !== 'yo_mismo' && this.documentoRespaldo) {
        const ruta = `personas/${id}/perfil/respaldo_${Date.now()}_${this.documentoRespaldo.name}`;
        const url = await subirArchivo(ruta, this.documentoRespaldo);
        await this.personasSvc.actualizar(id, { documentoRespaldoUrl: url } as Partial<Persona>);
      }
      await this.guardarFoto(id);
    } catch {
      const alert = await this.alertCtrl.create({
        header: 'Persona guardada',
        message:
          'Se guardaron los datos, pero no se pudo subir la foto o el documento adjunto. Puedes volver a intentarlo desde "Editar datos personales".',
        buttons: ['Entendido'],
      });
      await alert.present();
      await alert.onDidDismiss();
    }
  }

  async guardar(): Promise<void> {
    this.error.set(null);

    if (!this.v.todo()) {
      this.error.set('Revisa los campos marcados en rojo.');
      return;
    }

    this.guardando.set(true);
    try {
      const datos = {
        nombres: this.nombres.trim(),
        apellidos: this.apellidos.trim(),
        fechaNacimiento: this.fechaNacimiento,
        sexo: this.sexo,
        nacionalidad: this.nacionalidad.trim() || undefined,
        telefono: this.telefono.trim() || undefined,
        email: this.email.trim() || undefined,
        direccion: this.direccion.trim(),
        direccionDetalle: this.direccionDetalle.trim() || undefined,
        comuna: this.comuna.trim(),
        region: this.region,
        grupoSanguineo: this.grupoSanguineo || undefined,
        contactoEmergencia: this.contactoEmergencia.trim(),
        contactoEmergenciaParentesco: this.contactoEmergenciaParentesco,
        telefonoEmergencia: this.telefonoEmergencia.trim(),
        contactosEmergenciaAdicionales: this.contactosExtra.map((c) => ({
          nombre: c.nombre.trim(),
          parentesco: c.parentesco,
          telefono: c.telefono.trim(),
        })),
        alergias: this.aLista(this.alergiasTexto),
        enfermedadesCronicas: this.aLista(this.enfermedadesTexto),
        medicamentosPermanentes: this.aLista(this.medicamentosTexto),
        pesoKg: this.pesoKg ?? undefined,
        estaturaCm: this.estaturaCm ?? undefined,
        dispositivosMedicos: this.aLista(this.dispositivosMedicosTexto),
        donanteOrganos: this.donanteOrganos,
        requiereQrPerdida: this.requiereQrPerdida,
        notasEmergencia: this.notasEmergencia || undefined,
        prevision: this.prevision || undefined,
        medicoTratante: this.medicoTratante || undefined,
        telefonoMedicoTratante: this.telefonoMedicoTratante || undefined,
      };

      if (this.personaId) {
        await this.personasSvc.actualizar(this.personaId, datos);
        await this.guardarArchivos(this.personaId);
        await this.router.navigateByUrl(`/personas/${this.personaId}/datos`);
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
        id = await this.personasSvc.crearDependiente(
          uid,
          this.relacion as 'menor_a_cargo' | 'adulto_mayor_a_cargo',
          datos,
          this.rutDependiente
        );
      }

      await this.guardarArchivos(id);
      await this.router.navigateByUrl(`/personas/${id}`, { replaceUrl: this.bienvenida });
    } catch (e) {
      const codigo = (e as Error).message;
      if (codigo === 'rut-invalido') {
        this.error.set(MENSAJES.rut);
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
