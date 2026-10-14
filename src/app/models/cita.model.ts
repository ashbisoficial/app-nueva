export type TipoCita =
  | 'control'
  | 'especialista'
  | 'examen'
  | 'cirugia'
  | 'urgencia'
  | 'dental'
  | 'otro';

export const TIPOS_CITA: { value: TipoCita; label: string; color: string }[] = [
  { value: 'control', label: 'Control', color: '#4f8cff' },
  { value: 'especialista', label: 'Especialista', color: '#8b5cf6' },
  { value: 'examen', label: 'Examen', color: '#f59e0b' },
  { value: 'cirugia', label: 'Cirugía', color: '#ef4444' },
  { value: 'urgencia', label: 'Urgencia', color: '#dc2626' },
  { value: 'dental', label: 'Dental', color: '#10b981' },
  { value: 'otro', label: 'Otro', color: '#6b7280' },
];

export interface Cita {
  id: string;
  titulo: string;
  tipo?: TipoCita;
  fechaInicio: string;
  fechaFin?: string;
  lugar?: string;
  notas?: string;
  creadoPor: string;
  personaId: string;
  personaNombre: string;
  especialidadId?: string;
}
