export type CategoriaDocumento = 'seguro' | 'certificado' | 'carnet' | 'otro';

export const CATEGORIAS_DOCUMENTO: { value: CategoriaDocumento; label: string }[] = [
  { value: 'seguro', label: 'Seguro médico' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'carnet', label: 'Carnet' },
  { value: 'otro', label: 'Otro' },
];

export interface Documento {
  id: string;
  nombre: string;
  categoria: CategoriaDocumento;
  archivoUrl: string;
  subidoEn: unknown;
  notas?: string;
  especialidadId?: string;
}
