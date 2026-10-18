/**
 * Patrones y checks de validación de formularios, reutilizados en varias
 * páginas (persona-form, cita-form, historial-nueva, etc.) para no repetir
 * la misma expresión regular en cada una. Formato HTML5 `pattern` (sin
 * anclas `^$`, Angular/el navegador ya las agrega) + el equivalente en TS
 * para los checks que corren en el componente (ej. antes de enviar).
 *
 * El atributo `pattern` de HTML se interpreta con el flag `v` de RegExp
 * (unicode sets): un rango manual tipo `À-ÖØ-öø-ÿ` dispara "Invalid
 * character in character class" bajo ese flag — `\p{L}` (cualquier letra
 * Unicode) es justamente lo que ese modo espera, así que cubre tildes/ñ sin
 * ese problema. Y un `-` al final de la clase mezclado con un escape
 * (`\s`, `\p{L}`) también queda ambiguo en modo `v` — hay que escaparlo
 * como `\-` aunque en el resto de JS no haría falta.
 */

/** Letras (con tildes/ñ), espacios, apóstrofo y guión — nombres y apellidos tipo "O'Higgins" o "Pérez-García". */
export const PATRON_NOMBRE = "[\\p{L}\\s'\\-]+";

/** Dígitos, espacios, guiones y un "+" inicial opcional — permisivo a propósito (fijo o celular, con o sin +56). */
export const PATRON_TELEFONO = '\\+?[0-9\\s\\-]{7,15}';

export function nombreValido(valor: string): boolean {
  // Flag 'v': \p{L} solo es un escape de Unicode reconocido en modo unicode (igual que interpreta el navegador el atributo pattern).
  return new RegExp(`^${PATRON_NOMBRE}$`, 'v').test(valor.trim());
}

export function telefonoValido(valor: string): boolean {
  return new RegExp(`^${PATRON_TELEFONO}$`, 'v').test(valor.trim());
}
