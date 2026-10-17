/** Formas de ilustración disponibles para el ícono de cada paleta (ver flor-icono.component.ts). */
export type FormaFlor =
  | 'rosa'
  | 'racimo-pequeno'
  | 'racimo-grande'
  | 'pensamiento'
  | 'hibisco'
  | 'calendula'
  | 'girasol'
  | 'lirio'
  | 'ave-del-paraiso'
  | 'bailarina'
  | 'copihue'
  | 'dalia';

export interface Tema {
  id: string;
  nombre: string;
  primario: string;
  secundario: string;
  fondo: string;
  forma: FormaFlor;
  /** Ilustración propia (dibujada por el usuario) para esta flor. Si está
   *  presente, reemplaza al SVG generado por FlorIconoComponent. Ver
   *  public/assets/flores/. */
  imagenUrl?: string;
}

/**
 * Colección floral (sección 2.2 del spec). Rosa palo es la predeterminada.
 *
 * Revisada (pedido explícito del usuario: varias se veían muy parecidas
 * entre sí): antes 7 de las 13 compartían el mismo secundario (#7C9473) y
 * varios primarios caían todos en la misma franja rosa/magenta. Ahora cada
 * paleta tiene su propio par primario/secundario, separados por matiz Y por
 * saturación/luminosidad — no solo matiz — para que los tonos naturalmente
 * parecidos de varias flores reales (rosas, copihue, dalia, bailarinas,
 * hibisco, rosa palo) sigan siendo fieles al color real de cada una sin
 * verse todas iguales. El resto de los tokens de color de cada tema
 * (texto, fondo, bordes, etc. en src/theme/variables.css) se derivan de
 * estos mismos primario/secundario con una fórmula consistente.
 */
export const TEMAS: Tema[] = [
  { id: 'rosa-palo', nombre: 'Rosa palo', primario: '#A85764', secundario: '#7C9473', fondo: '#FAEFF1', forma: 'rosa' },
  { id: 'lilas', nombre: 'Lilas', primario: '#A87FBD', secundario: '#8A9B6E', fondo: '#F7EFFA', forma: 'racimo-pequeno', imagenUrl: 'assets/flores/lilas.png' },
  { id: 'pensamientos', nombre: 'Pensamientos', primario: '#5E3597', secundario: '#C9A86E', fondo: '#F4EFFA', forma: 'pensamiento', imagenUrl: 'assets/flores/pensamientos.png' },
  { id: 'hibisco', nombre: 'Hibisco', primario: '#D62F29', secundario: '#D9A441', fondo: '#FAF0EF', forma: 'hibisco', imagenUrl: 'assets/flores/hibisco.png' },
  { id: 'calendula', nombre: 'Caléndula', primario: '#DB8F24', secundario: '#8B5E34', fondo: '#FCF6EE', forma: 'calendula', imagenUrl: 'assets/flores/calendula.png' },
  { id: 'girasol', nombre: 'Girasol', primario: '#D8B731', secundario: '#6B4423', fondo: '#FCF9EE', forma: 'girasol', imagenUrl: 'assets/flores/girasol.png' },
  { id: 'lirios', nombre: 'Lirios', primario: '#C79775', secundario: '#7FA89A', fondo: '#FCF4EE', forma: 'lirio', imagenUrl: 'assets/flores/lirios.png' },
  { id: 'ave-del-paraiso', nombre: 'Ave del paraíso', primario: '#D66329', secundario: '#4A4E8C', fondo: '#FCF2EE', forma: 'ave-del-paraiso', imagenUrl: 'assets/flores/ave-del-paraiso.png' },
  { id: 'bailarinas', nombre: 'Bailarinas', primario: '#CE55A5', secundario: '#6FA36B', fondo: '#FAEFF7', forma: 'bailarina', imagenUrl: 'assets/flores/bailarinas.png' },
  { id: 'copihue', nombre: 'Copihue', primario: '#7C1D25', secundario: '#4A6B4F', fondo: '#FAEFF0', forma: 'copihue', imagenUrl: 'assets/flores/copihue.png' },
  { id: 'rosas', nombre: 'Rosas', primario: '#B53051', secundario: '#5B7A4F', fondo: '#FAEFF2', forma: 'rosa', imagenUrl: 'assets/flores/rosas.png' },
  { id: 'hortensia', nombre: 'Hortensia', primario: '#4B5CA0', secundario: '#C98A94', fondo: '#EFF2FA', forma: 'racimo-grande', imagenUrl: 'assets/flores/hortensia.png' },
  { id: 'dalia', nombre: 'Dalia', primario: '#8C2C5C', secundario: '#D4A857', fondo: '#FAEFF5', forma: 'dalia', imagenUrl: 'assets/flores/dalia.png' },
];

export const TEMA_PREDETERMINADO = 'rosa-palo';
