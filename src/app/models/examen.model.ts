export const EXAMENES_COMUNES: string[] = [
  'Hemograma completo',
  'Perfil bioquímico',
  'Perfil lipídico',
  'Glicemia',
  'Hemoglobina glicosilada',
  'Orina completa',
  'Radiografía',
  'Ecografía',
  'Electrocardiograma',
  'Perfil tiroideo',
  'Prueba de función renal',
  'Prueba de función hepática',
];

export interface Examen {
  id: string;
  tipo: string;
  fechaProgramada?: string;
  realizado?: boolean;
  fechaRealizado?: string;
  lugar?: string;
  notas?: string;
  ordenUrl?: string;
  resultadoUrl?: string;
  creadoPor: string;
  especialidadId?: string;
}
