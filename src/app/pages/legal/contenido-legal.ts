/**
 * Contenido de la Política de Privacidad y los Términos de Uso, separado del
 * template para que cada página solo itere secciones (título + párrafos +
 * lista opcional) en vez de tener un bloque de HTML gigante.
 *
 * Responsable del tratamiento de datos (persona natural, sin empresa
 * constituida todavía): Ana Rayen Castillo Painenao, RUT 21.393.050-8.
 * Contacto: serangelia.oficial@gmail.com
 */

export interface SeccionLegal {
  titulo: string;
  parrafos?: string[];
  items?: string[];
}

export const ULTIMA_ACTUALIZACION = '19 de octubre de 2026';
export const EMAIL_CONTACTO = 'serangelia.oficial@gmail.com';
export const RESPONSABLE_NOMBRE = 'Ana Rayen Castillo Painenao';
export const RESPONSABLE_RUT = '21.393.050-8';

export const POLITICA_PRIVACIDAD: SeccionLegal[] = [
  {
    titulo: '1. Quién trata tus datos',
    parrafos: [
      `Serangelia es desarrollada y administrada por ${RESPONSABLE_NOMBRE}, RUT ${RESPONSABLE_RUT} (en adelante, "el Responsable"), como persona natural — Serangelia todavía no está constituida como empresa. El Responsable es quien decide para qué se usan los datos que ingresas y responde por su protección.`,
      `Para cualquier consulta, solicitud o reclamo sobre tus datos personales, puedes escribir a ${EMAIL_CONTACTO}.`,
    ],
  },
  {
    titulo: '2. A qué datos aplica esta política',
    parrafos: [
      'Esta política cubre todos los datos que ingresas o se generan al usar Serangelia: los datos de tu cuenta, los de cada Persona que registres (incluido tu propio perfil y los de personas dependientes a tu cargo), y los documentos y archivos que subas.',
    ],
    items: [
      'Datos de cuenta: nombre, email, teléfono (opcional), RUT.',
      'Datos de identificación de cada Persona: nombres, apellidos, fecha de nacimiento, sexo, RUT, dirección y comuna (opcionales).',
      'Datos de salud (datos sensibles, ver sección 3): grupo sanguíneo, alergias, enfermedades crónicas, medicamentos, peso, estatura, dispositivos médicos implantados, condición de donante de órganos, previsión de salud, médico tratante, historial clínico, vacunas, exámenes, recetas y cualquier documento o foto médica que subas.',
      'Datos de contacto de emergencia de cada Persona.',
      'Documentos que subas: fotos o PDFs de exámenes, recetas, certificados, carnets, etc.',
      'Datos técnicos mínimos para que la app funcione: identificador de tu cuenta, fecha de registro, y las preferencias que elijas (tema de color, tamaño de letra) guardadas en tu dispositivo y en tu cuenta.',
      'Si activas las notificaciones: un identificador técnico por dispositivo (token de Firebase Cloud Messaging) que permite enviarte los avisos. Se borra al desactivarlas.',
      'Si conectas tu calendario: un enlace secreto propio de tu cuenta que entrega tus citas, próximas vacunas y fin de tratamientos a la app de calendario que elijas (por ejemplo, Google Calendar). Puedes desconectarlo cuando quieras y el enlace deja de funcionar.',
      'El registro de tu consentimiento: la fecha en que aceptaste estos textos y la versión aceptada.',
    ],
  },
  {
    titulo: '3. Datos sensibles y tu consentimiento',
    parrafos: [
      'Según la Ley N° 19.628 sobre Protección de la Vida Privada (y la Ley N° 21.719, que la moderniza y crea la Agencia de Protección de Datos Personales), los datos de salud son "datos sensibles": una categoría que solo se puede tratar con tu consentimiento expreso, precisamente porque revelan información especialmente delicada.',
      'Al crear tu cuenta marcas, por separado, la aceptación de los Términos de Uso y de esta Política, y con ello das tu consentimiento expreso para que Serangelia trate tus datos sensibles y los de las Personas a tu cargo que registres, exclusivamente con las finalidades descritas en la sección 4. Guardamos la fecha y la versión de lo que aceptaste; si esta política cambia de forma relevante, te pediremos aceptarla de nuevo antes de seguir usando la app. Puedes retirar este consentimiento en cualquier momento solicitando la eliminación de tu cuenta (sección 8) — al hacerlo, dejamos de tratar tus datos, sin que esto afecte el tratamiento ya realizado mientras tu consentimiento estuvo vigente.',
    ],
  },
  {
    titulo: '4. Para qué usamos tus datos',
    parrafos: ['Tus datos se usan únicamente para que Serangelia funcione como lo que es: tu registro personal de salud. En concreto:'],
    items: [
      'Guardar y mostrarte tu historial médico y el de las Personas a tu cargo.',
      'Generar recordatorios de vacunas, citas médicas y tomas de medicamentos.',
      'Generar el carnet de emergencia y el QR de pérdida que tú decides compartir, con los campos que tú elijas mostrar.',
      'Permitir que compartas el perfil de una Persona con alguien de confianza mediante un PIN, si tú lo generas. El PIN vence en el plazo que elijas (máximo 7 días), sirve para un número limitado de personas y lo puedes anular cuando quieras.',
      'Enviarte avisos (notificaciones) y mantener actualizado tu calendario externo, solo si tú los activas.',
      'Validar que tu RUT (o el de una Persona dependiente) no esté duplicado, para que no se pueda usar dos veces dentro de la app.',
      'En el futuro (todavía no implementado, ver sección 6): verificar tu identidad al crear la cuenta mediante un proveedor externo que compara una selfie con tu cédula.',
    ],
  },
  {
    titulo: '5. Qué NO hacemos con tus datos',
    items: [
      'No vendemos tus datos a nadie, bajo ninguna circunstancia.',
      'No los usamos con fines publicitarios ni los compartimos con terceros para marketing.',
      'No le damos acceso a tu historial médico a nadie que no sea quien tú autorices explícitamente (el titular de la cuenta, o alguien a quien le compartas el PIN de una Persona).',
      'La ficha de emergencia y el QR de pérdida públicos nunca exponen tu historial clínico completo, archivos ni documentos — solo los campos puntuales que tú marques como visibles, y nunca tu dirección ni comuna.',
    ],
  },
  {
    titulo: '6. Verificación de identidad (planificada, no activa todavía)',
    parrafos: [
      'Para evitar que alguien registre una cuenta con el RUT de otra persona, Serangelia planea integrar un proveedor externo de verificación de identidad (que compara una selfie en vivo con la foto de tu cédula contra bases oficiales). Mientras ese proveedor no esté integrado, la app solo valida el formato del RUT, sin verificar identidad real.',
      'Cuando esta verificación se active, se actualizará esta política para detallar qué proveedor se usa, qué datos biométricos procesa, y se guardará únicamente el resultado ("verificado" o no) y la fecha — nunca la selfie ni la foto de tu cédula de forma permanente.',
    ],
  },
  {
    titulo: '7. Con quién se comparten tus datos',
    parrafos: [
      'Serangelia funciona sobre Firebase (Google Cloud Platform), que aloja la base de datos, los archivos que subes, la autenticación y el envío de notificaciones. Google actúa como encargado del tratamiento: procesa los datos por instrucción del Responsable, bajo sus propias medidas de seguridad, y no los usa para fines propios. Esto implica una transferencia internacional de datos, ya que los servidores de Firebase pueden estar ubicados fuera de Chile.',
      'Si conectas tu calendario, la app de calendario que elijas (por ejemplo, Google Calendar) recibe los títulos, fechas y lugares de tus citas, vacunas y fin de tratamientos; esa información queda sujeta también a la política de privacidad de ese servicio. El contenido del historial médico, los diagnósticos y los documentos nunca se envían al calendario.',
      'No compartimos tus datos con ningún otro tercero, salvo que la ley chilena nos obligue a hacerlo (ej. un requerimiento judicial).',
    ],
  },
  {
    titulo: '8. Tus derechos sobre tus datos',
    parrafos: [
      'Como titular de tus datos, tienes derecho a acceder a ellos, rectificarlos si están incorrectos, solicitar su eliminación (cancelación), oponerte a un tratamiento específico, y a la portabilidad de tus datos (poder llevártelos a otro servicio) — estos son los derechos "ARCO+" reconocidos por la ley chilena.',
      `Hoy puedes editar o eliminar la mayoría de tus datos directamente desde la app (editar una Persona, eliminar una Persona, etc.). Para eliminar tu cuenta completa o ejercer cualquiera de estos derechos sobre datos que no puedas editar tú mismo/a, escríbenos a ${EMAIL_CONTACTO} — vamos a responder y resolver tu solicitud dentro de un plazo razonable.`,
    ],
  },
  {
    titulo: '9. Personas dependientes (menores de edad o adultos mayores a cargo)',
    parrafos: [
      'Cuando registras a un menor de edad o a un adulto mayor/convaleciente a tu cargo, tú — como titular de la cuenta — eres quien da el consentimiento para tratar los datos de salud de esa persona, en representación suya, y eres responsable de que esa representación sea legítima (ver sección 6.2 de la especificación técnica del producto: se pide un documento de respaldo, como certificado de nacimiento o documento de tutela).',
    ],
  },
  {
    titulo: '10. Seguridad',
    items: [
      'Todos los datos viajan cifrados entre tu dispositivo y los servidores (HTTPS/TLS).',
      'El acceso a cada Persona está restringido por reglas de seguridad de la base de datos: solo tú (o quien tú autorices explícitamente) puede leer o escribir sus datos.',
      'El historial médico es de solo-agregado ("append-only"): una vez escrita una entrada, nadie —ni el propio titular— puede editarla o borrarla, lo que evita alteraciones posteriores.',
      'La ficha pública de emergencia/pérdida nunca da acceso a documentos ni archivos, solo a los campos de texto que tú marcaste como públicos.',
    ],
  },
  {
    titulo: '11. Cuánto tiempo guardamos tus datos',
    parrafos: [
      'Guardamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación de tu cuenta, eliminamos tus datos personales y los de las Personas que administras, salvo que la ley nos obligue a conservar algún registro por un plazo determinado.',
    ],
  },
  {
    titulo: '12. Cambios a esta política',
    parrafos: [
      `Si actualizamos esta política de forma relevante (por ejemplo, al integrar el proveedor de verificación de identidad de la sección 6), lo vamos a indicar en esta misma página con la nueva fecha de actualización, y si el cambio afecta cómo tratamos datos sensibles, te lo vamos a notificar para pedir tu consentimiento de nuevo si corresponde.`,
      `Última actualización: ${ULTIMA_ACTUALIZACION}.`,
    ],
  },
];

export const TERMINOS_USO: SeccionLegal[] = [
  {
    titulo: '1. Qué es Serangelia',
    parrafos: [
      'Serangelia es una herramienta personal de registro de salud: te permite guardar y organizar el historial médico, documentos, exámenes, recetas, vacunas y citas tuyas y de tu familia, y generar una ficha de emergencia o un QR de pérdida para compartir fuera de la app.',
      'Serangelia NO es un servicio médico, no reemplaza la atención ni el consejo de un profesional de la salud, no diagnostica ni prescribe nada, y ningún médico ni clínica participa dentro de la app. Es, exclusivamente, un lugar donde tú guardas y organizas tu propia información.',
    ],
  },
  {
    titulo: '2. Quién puede usar la app',
    parrafos: [
      'Para crear una cuenta como titular necesitas ser mayor de edad y poder identificarte con un RUT chileno válido. Una cuenta puede además registrar el perfil de personas dependientes a su cargo (un menor de edad, o un adulto mayor/convaleciente), en los términos descritos en la especificación del producto — nunca el perfil de otro adulto independiente, que debe crear su propia cuenta.',
    ],
  },
  {
    titulo: '3. Tu responsabilidad sobre los datos que ingresas',
    items: [
      'Eres responsable de que la información que cargas sea veraz y de que tengas derecho a cargarla (tu propia información, o la de un dependiente legítimamente a tu cargo).',
      'Eres responsable de mantener segura tu contraseña y el acceso a tu cuenta.',
      'Si compartes el perfil de una Persona con alguien mediante un PIN, eres responsable de a quién se lo compartes y del nivel de acceso (lectura o lectura y escritura) que le otorgas.',
      'Serangelia no verifica que el contenido médico que subas sea correcto ni vigente — la responsabilidad sobre la exactitud de lo que registras es siempre tuya.',
    ],
  },
  {
    titulo: '4. Uso aceptable',
    items: [
      'No está permitido usar Serangelia para registrar información de alguien que no seas tú ni un dependiente legítimamente a tu cargo, sin su consentimiento.',
      'No está permitido intentar vulnerar la seguridad de la app, acceder a datos de otra cuenta sin autorización, o usar la app de forma que pueda dañarla o afectar a otros usuarios.',
      'El Responsable puede suspender o cerrar una cuenta que incumpla estos términos.',
    ],
  },
  {
    titulo: '5. Tus datos siguen siendo tuyos',
    parrafos: [
      'Toda la información que ingresas sigue siendo tuya. No la vendemos ni la usamos con fines distintos a los descritos en la Política de Privacidad. Puedes pedir una copia o la eliminación de tus datos en cualquier momento (ver la Política de Privacidad, sección 8).',
    ],
  },
  {
    titulo: '6. Limitación de responsabilidad',
    parrafos: [
      'Serangelia se entrega "tal cual", sin garantía de disponibilidad permanente ni de ausencia total de errores. Hacemos nuestro mejor esfuerzo para mantener la app funcionando y tus datos seguros, pero no podemos garantizar que el servicio nunca se interrumpa.',
      'El Responsable no es médico ni presta servicios de salud: ninguna funcionalidad de la app (recordatorios, carnet de emergencia, organización por especialidad, etc.) reemplaza el criterio de un profesional de la salud. Ante cualquier emergencia médica real, contacta siempre a los servicios de emergencia correspondientes.',
    ],
  },
  {
    titulo: '7. Cambios a estos términos',
    parrafos: [
      `Si actualizamos estos términos de forma relevante, lo vamos a indicar en esta misma página con la nueva fecha. Seguir usando Serangelia después de un cambio implica que lo aceptas.`,
      `Última actualización: ${ULTIMA_ACTUALIZACION}.`,
    ],
  },
  {
    titulo: '8. Ley aplicable y contacto',
    parrafos: [
      'Estos términos se rigen por las leyes de la República de Chile.',
      `Para cualquier consulta sobre estos términos, escríbenos a ${EMAIL_CONTACTO}.`,
    ],
  },
];
