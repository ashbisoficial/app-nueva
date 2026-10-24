import { avatarDataUri } from '../core/avatar-dicebear';
import type { Persona } from '../models';

/** Avatar con iniciales para "Mis personas" (reemplaza el ícono genérico persona-circle) — fallback cuando ni el avatar ilustrado ni la foto real resuelven. */
const COLORES_PERSONA = ['#A85C68', '#7C9473', '#9B7FB8', '#D98E2B', '#4F5F9E'];

export function inicialPersona(nombre: string | undefined): string {
  return nombre?.trim().charAt(0).toUpperCase() || '?';
}

export function colorPersona(indice: number): string {
  return COLORES_PERSONA[indice % COLORES_PERSONA.length];
}

/**
 * Qué mostrar como avatar de una Persona en toda la app (listados, Home,
 * detalle): el avatar ilustrado siempre que exista `avatarConfig` (lo
 * normal desde que esto se implementó); si no, la foto real como respaldo
 * para Personas creadas antes de este cambio (nunca se le borra su foto);
 * si tampoco hay foto, `null` — ahí quien llama cae a las iniciales.
 */
export function avatarSrc(persona: Persona): string | null {
  if (persona.avatarConfig) return avatarDataUri(persona.avatarConfig);
  return persona.fotoUrl ?? null;
}
