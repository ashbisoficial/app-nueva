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

/** Colección floral (sección 2.2 del spec). Rosa palo es la predeterminada. */
export const TEMAS: Tema[] = [
  { id: 'rosa-palo', nombre: 'Rosa palo', primario: '#A85C68', secundario: '#7C9473', fondo: '#FBF3F2', forma: 'rosa' },
  { id: 'lilas', nombre: 'Lilas', primario: '#9B7FB8', secundario: '#7C9473', fondo: '#F7F3FA', forma: 'racimo-pequeno', imagenUrl: 'assets/flores/lilas.png' },
  { id: 'pensamientos', nombre: 'Pensamientos', primario: '#6B4E9E', secundario: '#C9A86E', fondo: '#F4F1FA', forma: 'pensamiento' },
  { id: 'hibisco', nombre: 'Hibisco', primario: '#D1495B', secundario: '#7C9473', fondo: '#FDF2F0', forma: 'hibisco', imagenUrl: 'assets/flores/hibisco.png' },
  { id: 'calendula', nombre: 'Caléndula', primario: '#D98E2B', secundario: '#7C9473', fondo: '#FDF5E8', forma: 'calendula' },
  { id: 'girasol', nombre: 'Girasol', primario: '#D4A82E', secundario: '#7C9473', fondo: '#FDFAE8', forma: 'girasol', imagenUrl: 'assets/flores/girasol.png' },
  { id: 'lirios', nombre: 'Lirios', primario: '#C98858', secundario: '#8FA888', fondo: '#FBF4EC', forma: 'lirio' },
  { id: 'ave-del-paraiso', nombre: 'Ave del paraíso', primario: '#D9652E', secundario: '#4A4E8C', fondo: '#FDF2EA', forma: 'ave-del-paraiso' },
  { id: 'bailarinas', nombre: 'Bailarinas', primario: '#B85491', secundario: '#7C9473', fondo: '#FBF1F7', forma: 'bailarina' },
  { id: 'copihue', nombre: 'Copihue', primario: '#A8333D', secundario: '#4A6B4F', fondo: '#FBF0F0', forma: 'copihue', imagenUrl: 'assets/flores/copihue.png' },
  { id: 'rosas', nombre: 'Rosas', primario: '#C13B55', secundario: '#7C9473', fondo: '#FCF1F3', forma: 'rosa' },
  { id: 'hortensia', nombre: 'Hortensia', primario: '#4F5F9E', secundario: '#C98A94', fondo: '#F1F3FA', forma: 'racimo-grande' },
  { id: 'dalia', nombre: 'Dalia', primario: '#9E3860', secundario: '#C9A86E', fondo: '#FBF1F4', forma: 'dalia' },
];

export const TEMA_PREDETERMINADO = 'rosa-palo';
