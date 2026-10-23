import type { Persona } from '../models';

/** Las 16 regiones de Chile, de norte a sur — para el selector de vivienda. */
export const REGIONES_CHILE = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
];

export const PARENTESCOS = [
  'Madre',
  'Padre',
  'Hijo/a',
  'Hermano/a',
  'Pareja',
  'Abuelo/a',
  'Nieto/a',
  'Tío/a',
  'Sobrino/a',
  'Tutor/a',
  'Cuidador/a',
  'Amigo/a',
  'Vecino/a',
  'Otro',
];

/**
 * Datos esenciales que toda Persona debería tener (pedido explícito: cada
 * persona que se crea o se une tiene que tener sus datos de identificación,
 * contacto, vivienda y de emergencia). persona-form los exige al guardar;
 * esto sirve para avisar en Personas que ya existían antes de exigirlos.
 * Devuelve etiquetas legibles, vacío si no falta nada.
 */
export function datosFaltantes(p: Persona): string[] {
  const faltan: string[] = [];
  const vacio = (v?: string) => !v?.trim();
  if (vacio(p.nombres) && vacio(p.nombre)) faltan.push('Nombres');
  if (vacio(p.apellidos)) faltan.push('Apellidos');
  if (vacio(p.fechaNacimiento)) faltan.push('Fecha de nacimiento');
  if (vacio(p.sexo)) faltan.push('Sexo');
  // Un menor muchas veces no tiene teléfono propio: se ubica por su contacto de emergencia.
  if (p.relacion !== 'menor_a_cargo' && vacio(p.telefono)) faltan.push('Teléfono');
  if (vacio(p.direccion)) faltan.push('Dirección');
  if (vacio(p.comuna)) faltan.push('Comuna');
  if (vacio(p.region)) faltan.push('Región');
  if (vacio(p.contactoEmergencia)) faltan.push('Contacto de emergencia');
  if (vacio(p.contactoEmergenciaParentesco)) faltan.push('Parentesco del contacto');
  if (vacio(p.telefonoEmergencia)) faltan.push('Teléfono de emergencia');
  return faltan;
}

export function etiquetaRelacion(relacion: Persona['relacion'] | null | undefined): string {
  if (relacion === 'yo_mismo') return 'Yo mismo/a';
  if (relacion === 'menor_a_cargo') return 'Menor de edad a cargo';
  if (relacion === 'adulto_mayor_a_cargo') return 'Adulto mayor/convaleciente a cargo';
  return '';
}

export function etiquetaSexo(sexo: string | undefined): string {
  if (sexo === 'femenino') return 'Femenino';
  if (sexo === 'masculino') return 'Masculino';
  if (sexo === 'otro') return 'Otro';
  return '';
}
