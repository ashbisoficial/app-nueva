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
  /** Un token FCM por dispositivo/navegador con notificaciones push activas (core/push.service.ts). */
  fcmTokens?: string[];
  /** Token secreto del feed de calendario /calendario/{token}.ics (suscripción desde Google Calendar). */
  calendarioToken?: string;
  /**
   * Consentimiento expreso al crear la cuenta (Ley 19.628 / 21.719: los datos
   * de salud son datos sensibles). `version` es la fecha de "Última
   * actualización" de los textos legales aceptados (ULTIMA_ACTUALIZACION).
   */
  consentimientos?: {
    version: string;
    terminosAceptadosEn: unknown;
    privacidadAceptadaEn: unknown;
  };
  /**
   * Verificación real del titular (sección 6.1: cédula + selfie comparadas
   * contra el Registro Civil vía Didit). La escribe únicamente
   * crearSesionVerificacion/webhookVerificacionIdentidad (Cloud Functions,
   * Admin SDK) — el cliente solo la lee, nunca la escribe directo.
   */
  verificacionIdentidad?: {
    estado: 'pendiente' | 'aprobada' | 'rechazada' | 'en_revision';
    sessionId: string;
    creadoEn?: unknown;
    actualizadoEn?: unknown;
    // Control de costo (cada sesión en Didit cuesta real): cuántas veces se
    // creó una sesión y cuándo fue la última, para el límite de intentos y
    // la espera mínima entre uno y el siguiente (ver crearSesionVerificacion).
    intentos?: number;
    ultimoIntentoEn?: unknown;
  };
}
