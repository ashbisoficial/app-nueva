/** Sección 6.2 del spec: qué es esta Persona respecto de la cuenta que la administra. */
export type RelacionPersona = 'yo_mismo' | 'menor_a_cargo' | 'adulto_mayor_a_cargo';

export interface Persona {
  id: string;
  uidTitular: string;
  nombre: string;
  fechaNacimiento: string;
  sexo: string;
  fotoUrl?: string;

  relacion: RelacionPersona;
  /**
   * Para 'yo_mismo': copia de usuarios/{uid}.rut, no editable distinto acá.
   * Para los dependientes: RUT propio, obligatorio, único (rutsRegistrados,
   * sección 6.2) — validado solo en formato, nunca verificado contra un
   * registro real.
   */
  rut: string;
  /** Solo dependientes: certificado de nacimiento (menor) o carnet + tutela (adulto mayor). */
  documentoRespaldoUrl?: string;

  grupoSanguineo?: string;
  alergias?: string[];
  enfermedadesCronicas?: string[];
  medicamentosPermanentes?: string[];

  contactoEmergencia?: string;
  telefonoEmergencia?: string;

  // Carnet de emergencia (dato médico, para un médico)
  qrFichaToken?: string;
  qrFichaCamposPublicos?: CampoFichaPublica[];

  // QR de pérdida (dato de contacto, para quien encuentra a la persona)
  qrPerdidaToken?: string;
  qrPerdidaCamposPublicos?: CampoFichaPerdida[];
  /** Frase corta para quien encuentre a la persona, ej. "Tiene Alzheimer, por favor llamar a su familiar". */
  condicionPerdida?: string;

  pinAccesoCompartido?: string;
  pinGeneradoEn?: unknown;
  modoAccesoCompartido?: 'lectura' | 'escritura';
  /** uids que canjearon el PIN y tienen acceso a este perfil sin ser el titular (sección 6). */
  uidsConAcceso?: string[];
}

export type CampoFichaPublica =
  | 'nombre'
  | 'fechaNacimiento'
  | 'grupoSanguineo'
  | 'alergias'
  | 'enfermedadesCronicas'
  | 'medicamentosPermanentes'
  | 'contactoEmergencia'
  | 'telefonoEmergencia';

export type CampoFichaPerdida = 'nombre' | 'fotoUrl' | 'condicionPerdida' | 'contactoEmergencia' | 'telefonoEmergencia';
