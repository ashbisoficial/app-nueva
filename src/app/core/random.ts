const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Token aleatorio URL-safe, usado por ejemplo para qrFichaToken (sección 3.2). */
export function generarToken(longitud = 24): string {
  const bytes = new Uint8Array(longitud);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('');
}

/** PIN numérico de 6 dígitos, usado para compartir un perfil (sección 6). */
export function generarPin6(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const n = new DataView(bytes.buffer).getUint32(0) % 900000;
  return (100000 + n).toString();
}
