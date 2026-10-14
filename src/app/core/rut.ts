/** Validación de RUT chileno (sección 6.1 del spec: unicidad de cuenta, no verificación de identidad real). */

/** Deja solo dígitos + dígito verificador en mayúscula, sin puntos ni guión. Ej. "12.345.678-k" -> "12345678K" */
export function normalizarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatearRut(rut: string): string {
  const limpio = normalizarRut(rut);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpoFormateado}-${dv}`;
}

function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

/** true si el RUT (con o sin puntos/guión) es válido según el dígito verificador. */
export function validarRut(rut: string): boolean {
  const limpio = normalizarRut(rut);
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return calcularDigitoVerificador(cuerpo) === dv;
}
