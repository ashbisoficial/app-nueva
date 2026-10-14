export interface Persona {
  id: string;
  uidTitular: string;
  nombre: string;
  fechaNacimiento: string;
  sexo: string;
  fotoUrl?: string;

  grupoSanguineo?: string;
  alergias?: string[];
  enfermedadesCronicas?: string[];
  medicamentosPermanentes?: string[];

  contactoEmergencia?: string;
  telefonoEmergencia?: string;

  qrFichaToken?: string;
  qrFichaCamposPublicos?: CampoFichaPublica[];

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
