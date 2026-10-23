import { signal } from '@angular/core';

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

/**
 * Mensajes de error por campo, iguales en toda la app (pedido explícito:
 * cada input dice qué está mal — "Este campo es obligatorio", "Ingresa un
 * correo válido", etc. — en vez de solo bloquear el botón).
 */
export const MENSAJES = {
  obligatorio: 'Este campo es obligatorio.',
  elegir: 'Elige una opción.',
  nombre: 'Solo se permiten letras y espacios.',
  correo: 'Ingresa un correo válido, por ejemplo nombre@correo.com.',
  telefono: 'Ingresa un teléfono válido: solo números, espacios, guiones y un "+" al inicio.',
  rut: 'El RUT no es válido. Revisa los números y el dígito verificador.',
  fechaFutura: 'La fecha no puede ser futura.',
  hora: 'Usa el formato de hora HH:MM, por ejemplo 08:00.',
  pin: 'El PIN tiene 6 números.',
  contrasena: 'La contraseña debe tener al menos 6 caracteres.',
  largoMaximo: (max: number) => `Máximo ${max} caracteres.`,
  rango: (min: number, max: number, unidad: string) => `Ingresa un valor entre ${min} y ${max} ${unidad}.`,
  fechaPosterior: (otra: string) => `Debe ser posterior a ${otra}.`,
};

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function correoValido(valor: string): boolean {
  return PATRON_CORREO.test(valor.trim());
}

const vacio = (valor: unknown) =>
  valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '');

/**
 * Reglas reutilizables: cada una devuelve el mensaje de error o null. Las
 * que no son `requerido` dejan pasar un valor vacío, para poder combinarlas
 * en campos opcionales (ej. teléfono opcional pero con formato si se llena).
 */
export const reglas = {
  requerido: (valor: unknown, mensaje = MENSAJES.obligatorio) => (vacio(valor) ? mensaje : null),
  elegir: (valor: unknown) => (vacio(valor) ? MENSAJES.elegir : null),
  nombre: (valor: string) => (!vacio(valor) && !nombreValido(valor) ? MENSAJES.nombre : null),
  correo: (valor: string) => (!vacio(valor) && !correoValido(valor) ? MENSAJES.correo : null),
  telefono: (valor: string) => (!vacio(valor) && !telefonoValido(valor) ? MENSAJES.telefono : null),
  noFutura: (fechaISO: string) =>
    !vacio(fechaISO) && fechaISO.slice(0, 10) > new Date().toISOString().slice(0, 10) ? MENSAJES.fechaFutura : null,
  largoMaximo: (valor: string, max: number) => (!vacio(valor) && valor.trim().length > max ? MENSAJES.largoMaximo(max) : null),
  rango: (valor: number | null | undefined, min: number, max: number, unidad: string) =>
    !vacio(valor) && (Number(valor) < min || Number(valor) > max) ? MENSAJES.rango(min, max, unidad) : null,
};

/** El primer mensaje de error no nulo, para encadenar reglas: primerError(reglas.requerido(x), reglas.nombre(x)). */
export function primerError(...errores: (string | null)[]): string | null {
  return errores.find((e) => !!e) ?? null;
}

/**
 * Estado de validación de un formulario. Cada campo tiene su regla (una
 * función que lee el valor actual del componente):
 * - `campo('x')` se llama al salir del campo (ionBlur) o al elegir (ionChange).
 * - `revalidar('x')` se llama mientras se escribe: solo vuelve a evaluar si el
 *   campo ya estaba marcado con error, para que el mensaje desaparezca apenas
 *   se corrige sin retar a nadie mientras escribe por primera vez.
 * - `todo()` al enviar: marca todos los campos y dice si se puede guardar.
 */
export class ValidacionFormulario<C extends string = string> {
  private readonly estado = signal<Partial<Record<C, string>>>({});

  constructor(private readonly reglasPorCampo: Record<C, () => string | null>) {}

  error(campo: C): string | null {
    return this.estado()[campo] ?? null;
  }

  campo(campo: C): void {
    const mensaje = this.reglasPorCampo[campo]();
    this.estado.update((e) => ({ ...e, [campo]: mensaje ?? undefined }));
  }

  revalidar(campo: C): void {
    if (this.estado()[campo]) this.campo(campo);
  }

  /** Valida todos los campos; true si no hay ningún error. */
  todo(): boolean {
    const nuevo: Partial<Record<C, string>> = {};
    for (const campo of Object.keys(this.reglasPorCampo) as C[]) {
      const mensaje = this.reglasPorCampo[campo]();
      if (mensaje) nuevo[campo] = mensaje;
    }
    this.estado.set(nuevo);
    return Object.keys(nuevo).length === 0;
  }

  limpiar(): void {
    this.estado.set({});
  }
}

/**
 * Archivo subido (foto, documento, resultado de examen): solo imagen, o
 * imagen/PDF si `permitePdf`, y con tope de tamaño para no llenar Storage con
 * fotos de 40 MB sin comprimir.
 */
export function errorArchivo(archivo: File, { permitePdf = true, maxMb = 15 } = {}): string | null {
  const esImagen = archivo.type.startsWith('image/');
  const esPdf = archivo.type === 'application/pdf';
  if (!esImagen && !(permitePdf && esPdf)) {
    return permitePdf ? 'Solo se aceptan fotos o archivos PDF.' : 'Solo se aceptan fotos (JPG, PNG, etc.).';
  }
  if (archivo.size > maxMb * 1024 * 1024) return `El archivo pesa más de ${maxMb} MB. Elige uno más liviano.`;
  return null;
}
