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
}

export interface TomaRegistrada {
  id?: string;
  fechaHora: string;
  registradoPor: string;
}
