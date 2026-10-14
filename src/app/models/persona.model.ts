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
