/** Avatar con iniciales para "Mis personas" (reemplaza el ícono genérico persona-circle). */
const COLORES_PERSONA = ['#A85C68', '#7C9473', '#9B7FB8', '#D98E2B', '#4F5F9E'];

export function inicialPersona(nombre: string | undefined): string {
  return nombre?.trim().charAt(0).toUpperCase() || '?';
}

export function colorPersona(indice: number): string {
  return COLORES_PERSONA[indice % COLORES_PERSONA.length];
}
