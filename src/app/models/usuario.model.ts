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
  modoColor?: 'claro' | 'oscuro' | 'sistema';
  /** Recordatorios locales (sección 4.5, capa 1) — on por defecto si no está definido. */
  notificacionesLocales?: boolean;
  /**
   * Id de la Persona "yo mismo/a" de esta cuenta (sección 6.2: solo puede
   * haber una). Se fija atómicamente junto con esa Persona en
   * PersonasService.crearTitular() y firestore.rules usa su sola presencia
   * (no reescribible a otro id) para bloquear que la misma cuenta cree una
   * segunda — ver la regla de creación de `personas/{personaId}`.
   */
  personaYoMismoId?: string;
}
