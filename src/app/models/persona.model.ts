/** Sección 6.2 del spec: qué es esta Persona respecto de la cuenta que la administra. */
export type RelacionPersona = 'yo_mismo' | 'menor_a_cargo' | 'adulto_mayor_a_cargo';

export interface Persona {
  id: string;
  uidTitular: string;
  nombres: string;
  apellidos: string;
  /**
   * @deprecated Campo legado de antes de separar nombres/apellidos (un solo
   * input "Nombre completo"). Ya no se escribe, pero se mantiene en el tipo
   * porque los documentos creados antes de este cambio todavía lo tienen —
   * ver nombreCompleto() en shared/persona-nombre.ts, que resuelve a este
   * valor si nombres/apellidos vienen vacíos.
   */
  nombre?: string;
  fechaNacimiento: string;
  sexo: string;
  nacionalidad?: string;
  fotoUrl?: string;

  // Contacto propio de la Persona (no el de emergencia). Obligatorio salvo
  // para un menor a cargo — ver datosFaltantes() en shared/persona-datos.ts.
  telefono?: string;
  email?: string;

  // Vivienda. Obligatorios en Personas nuevas (dirección, comuna, región);
  // opcionales en el tipo porque las creadas antes no los tienen.
  direccion?: string;
  /** Depto., casa, block — lo que no entra en "calle y número". */
  direccionDetalle?: string;
  comuna?: string;
  region?: string;

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
  /** Peso en kilos — relevante sobre todo para dosificar un medicamento en una urgencia (ej. a un menor). */
  pesoKg?: number;
  estaturaCm?: number;
  /** Marcapasos, prótesis o cualquier implante metálico — relevante antes de una resonancia o cirugía de urgencia. */
  dispositivosMedicos?: string[];
  donanteOrganos?: boolean;
  /** Previsión de salud (ej. "Fonasa", "Isapre Banmédica"), para saber a qué institución corresponde llevarla. */
  prevision?: string;
  medicoTratante?: string;
  telefonoMedicoTratante?: string;
  /** Cualquier otro dato relevante en una urgencia que no entra en un campo de arriba. */
  notasEmergencia?: string;

  contactoEmergencia?: string;
  /** Qué es el contacto de emergencia de esta Persona (ej. "Hija", "Vecino"). */
  contactoEmergenciaParentesco?: string;
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

/**
 * Campos que se pueden marcar como públicos en el carnet de emergencia (opt-in,
 * sección 4.6). Deliberadamente NO incluye `direccion` ni `comuna`: exponer la
 * dirección de alguien en una ficha pública sin login es un riesgo de
 * seguridad que no aporta nada a un médico de urgencia (principio de
 * minimización de datos expuestos, sección 7).
 */
export type CampoFichaPublica =
  | 'nombre'
  | 'fechaNacimiento'
  | 'grupoSanguineo'
  | 'alergias'
  | 'enfermedadesCronicas'
  | 'medicamentosPermanentes'
  | 'pesoKg'
  | 'estaturaCm'
  | 'dispositivosMedicos'
  | 'donanteOrganos'
  | 'prevision'
  | 'medicoTratante'
  | 'telefonoMedicoTratante'
  | 'notasEmergencia'
  | 'contactoEmergencia'
  | 'telefonoEmergencia';

export type CampoFichaPerdida = 'nombre' | 'fotoUrl' | 'condicionPerdida' | 'contactoEmergencia' | 'telefonoEmergencia';
