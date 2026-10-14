export interface Vacuna {
  id: string;
  tipo: string;
  fechaAplicacion: string;
  proximaFecha?: string;
  notas?: string;
  creadoPor: string;
}
