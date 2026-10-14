export type TipoEntrada =
  | 'consulta'
  | 'receta'
  | 'vacunacion'
  | 'examen_resultado'
  | 'cirugia'
  | 'indicaciones_alta'
  | 'solicitud_examen'
  | 'otro';

export const TIPOS_ENTRADA: { value: TipoEntrada; label: string }[] = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'receta', label: 'Receta' },
  { value: 'vacunacion', label: 'Vacunación' },
  { value: 'examen_resultado', label: 'Resultado de examen' },
  { value: 'cirugia', label: 'Cirugía' },
  { value: 'indicaciones_alta', label: 'Indicaciones de alta' },
  { value: 'solicitud_examen', label: 'Solicitud de examen' },
  { value: 'otro', label: 'Otro' },
];

export interface MedicamentoOrden {
  nombre: string;
  dosis: string;
  via?: string;
  frecuencia: string;
  duracion?: string;
}

export interface Entrada {
  id?: string;
  tipo: TipoEntrada;
  fecha: string;
  motivo?: string;
  diagnostico?: string;
  tratamientoIndicado?: string;
  texto?: string;

  medicamentos?: MedicamentoOrden[];
  examenesSeleccionados?: string[];
  archivoUrl?: string;

  autorUid: string;
  autorNombre: string;
  createdAt: unknown;

  especialidadId?: string;
}

/** Al menos uno de estos campos debe tener contenido para que la entrada sea válida. */
export function entradaTieneContenido(e: Partial<Entrada>): boolean {
  return Boolean(
    e.motivo?.trim() ||
      e.diagnostico?.trim() ||
      e.tratamientoIndicado?.trim() ||
      e.texto?.trim() ||
      (e.medicamentos && e.medicamentos.length > 0) ||
      (e.examenesSeleccionados && e.examenesSeleccionados.length > 0)
  );
}
