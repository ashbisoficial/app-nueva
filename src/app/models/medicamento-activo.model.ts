export interface MedicamentoActivo {
  id: string;
  nombre: string;
  dosis: string;
  viaAdministracion?: string;
  frecuencia: string;
  fechaInicio: string;
  fechaFin?: string;
  horariosRecordatorio?: string[];
  notas?: string;
  creadoPor: string;
  especialidadId?: string;
  /** Fecha ISO (yyyy-MM-dd) de la última vez que se marcó "tomado" — adherencia simple, día a día. */
  ultimaTomaFecha?: string;
}
