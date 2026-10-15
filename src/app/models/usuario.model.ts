export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  foto?: string;
  telefono?: string;
  fechaRegistro: unknown;
  /** Normalizado (sin puntos ni guión, dígito verificador en mayúscula) — ver sección 6.1 del spec. */
  rut?: string;
  /** Preferencias de personalización (sección 2.2) — siguen a la cuenta entre dispositivos. */
  temaColor?: string;
  tamanoFuente?: 'chico' | 'normal' | 'grande';
}
