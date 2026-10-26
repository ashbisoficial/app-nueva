# Serangelia — Especificación técnica

"Versión humana" de Ashbis: sistema de gestión de salud personal/familiar.

**Nombre de la app: Serangelia** (definitivo). Combina los nombres de
Sergio, Ana, Gabriel y Lidia — con "ser ángel" escondido adentro
(se-ran-**GEL**-ia) — y termina como nombre de lugar (Valencia, Galicia) en
vez de nombre de persona. `app-nueva` sigue siendo el nombre técnico del
repo/paquete; no hace falta tocarlo.

## 1. Qué es y qué NO es

Es una app (web + móvil con una sola base de código) para que una persona lleve
el historial médico propio y el de su familia: documentos clínicos, exámenes,
recetas/medicamentos, vacunas, cirugías, citas médicas con recordatorios, y una
ficha de emergencia descargable/compartible por QR.

**Un solo tipo de cuenta.** No hay médicos, clínicas, ni roles de negocio
dentro de la app — es una herramienta personal de registro, no un marketplace
ni una plataforma de reserva de horas con terceros. Un médico real nunca
inicia sesión en esta app; si alguien necesita mostrarle algo a un médico, lo
hace con el PDF/QR generado, fuera de la app.

**Multi-perfil bajo una sola cuenta, pero no libre.** Una cuenta puede llevar
el registro de varias "personas", pero no de cualquiera — equivalente directo
al concepto "una cuenta de dueño con varias mascotas" del sistema original
(Ashbis), salvo que acá las "mascotas" son personas reales y por eso hay una
restricción explícita (ver sección 6.2): una cuenta siempre tiene **una
Persona "yo mismo/a"**, y además puede tener **Personas dependientes** solo en
dos casos — un **menor de edad a cargo** o un **adulto mayor/convaleciente a
cargo**. Un adulto que puede manejar su propio teléfono y no es menor ni
convaleciente **no se agrega como Persona dentro de la cuenta de otro** — se
vincula con su propia cuenta vía PIN (sección 6).

## 2. Stack técnico

- **Frontend:** Angular (standalone components, sin NgModules) + Ionic (UI y
  componentes nativos) + Capacitor (empaquetado nativo iOS/Android desde el
  mismo código web).
- **Backend:** Firebase — Firestore (NoSQL, documentos/colecciones), Cloud
  Functions (TypeScript server-side), Firebase Auth (login), Firebase Storage
  (archivos/fotos/PDFs), Firebase Cloud Messaging (push).
- **PDF:** generación client-side con jsPDF (sin backend), para carnet de
  emergencia y órdenes/recetas.
- **Notificaciones:** dos capas — recordatorios locales
  (`@capacitor/local-notifications`, programados en el dispositivo, sin
  servidor) + push real (Cloud Function programada 1x/día vía FCM).

**Por qué esta combinación:** una sola base de código sirve web (PWA/sitio) y
apps nativas; Firestore con reglas de seguridad declarativas evita necesitar
un backend REST propio para CRUD básico; Cloud Functions solo se usan donde
hace falta lógica que NO puede confiarse al cliente (validaciones cruzadas,
acceso con PIN, recordatorios programados).

## 2.1 Usuario objetivo y alcance de funcionalidades multimedia

El usuario típico no es alguien "digital-first": es una persona mayor, o
alguien que administra el cuidado de una persona mayor o de un familiar
crónico, cuyo problema real es **perder papeles y perder el hilo de qué
médico dijo qué**. El diseño prioriza:

- Bajísima fricción para guardar un documento (sacarle una foto a un papel y
  listo) antes que funcionalidades vistosas.
- Organización que evite que todo termine en una sola bolsa mezclada (ver
  "Especialidades", sección 3.9).

**Explícitamente de baja prioridad / NO construir todavía:**

- Una "galería de fotos" como feature propia (feed, álbumes, edición de
  imágenes, etc.). La cámara se usa solo como método de captura para digitalizar
  un documento (ver 4.1), no como una sección de la app en sí misma.
- Cualquier cosa puramente social o decorativa que no ayude directamente a no
  perder información o a no perder una toma/cita.

**Nota a futuro (no MVP):** para cuidadores de personas con Alzheimer u otro
deterioro cognitivo, sí podría valer la pena más adelante un "modo cuidador"
simplificado o recordatorios con fotos de reconocimiento (ej. foto del
medicamento junto al nombre). Queda anotado como posible fase 2, no se
construye ahora.

**Rango de edad real:** el público va desde estudiantes de enseñanza media con
su propio celular hasta personas mayores — la app tiene que sentirse igual de
cómoda en ambos extremos. Eso empuja todo el diseño hacia "súper intuitivo" por
defecto, no hacia una versión simplificada para un grupo y otra completa para
el resto.

## 2.2 Personalización y accesibilidad

Cada persona puede ajustar la app a lo que le resulte cómodo, no hay un único
look fijo para todos:

- **Color.** La app es tematizable: cada usuario elige su paleta desde
  Configuración. El color por defecto (el que ve alguien que nunca tocó nada)
  es **rosa palo**, con un set de colores de contraste pensado para que
  funcione como fondo/acento (no como color de texto — el texto usa un
  café-rosado oscuro, nunca negro puro). El resto de paletas predefinidas
  siguen una "colección floral" (todas nombradas como flores, para que
  elegir una se sienta cercano en vez de elegir "Tema 3"): **Rosa palo**
  (predeterminada), **Lilas**, **Pensamientos**, **Hibisco**, **Caléndula**,
  **Girasol**, **Lirios**, **Ave del paraíso**, **Bailarinas**, **Copihue**,
  **Rosas**, **Hortensia** y **Dalia** — 13 en total, cada una con su color
  primario/secundario tomado del color real de la flor (ej. Copihue en rojo
  profundo con verde oscuro, por ser la flor nacional de Chile). Implementado:
  tokens de color (variables CSS, `src/theme/variables.css`) por tema vía
  `[data-tema="<id>"]` en `<html>`, nunca colores hardcodeados en los
  componentes; metadata en `core/temas.ts`; aplicación/persistencia
  (localStorage + `usuarios/{uid}`) en `core/theme.service.ts`; selector de
  paleta en Configuración. **Revisada** (pedido explícito: varias se veían
  muy parecidas — 7 de las 13 compartían el mismo secundario y la mayoría de
  los primarios caía en la misma franja rosa/magenta): cada paleta separa su
  primario/secundario por matiz Y por saturación/luminosidad, no solo
  matiz, para que flores naturalmente parecidas en la realidad (rosas,
  copihue, dalia, bailarinas, hibisco, rosa palo son todas rosadas/rojizas)
  sigan siendo fieles a su color real sin verse todas iguales en la app.
- **Tipografía.** Fuente cálida y "familiar", no corporativa fría. Entre las
  opciones evaluadas, **Atkinson Hyperlegible** (diseñada por el Braille
  Institute específicamente para legibilidad en baja visión) es la
  recomendada dado el rango etario — cubre bien tanto a adultos mayores como
  al resto sin sacrificar personalidad.
- **Tamaño de letra / tamaño de interfaz.** Ajustable desde Configuración
  (ej. tres pasos: chico/normal/grande) y aplicado a toda la app vía un
  token de escala, no pantalla por pantalla.
- **Modo oscuro.** Preferencia de tres opciones — **Claro**, **Oscuro**,
  **Sistema** (sigue `prefers-color-scheme` del dispositivo en vivo, sin
  recargar) — elegible desde Configuración junto al resto de personalización,
  con la misma persistencia que tema/tamaño (localStorage para aplicarlo al
  instante + `usuarios/{uid}.modoColor` para que siga a la cuenta entre
  dispositivos). Implementado como una segunda capa de tokens CSS por tema
  (`:root[data-tema="X"][data-modo="oscuro"]` en `src/theme/variables.css`,
  además del bloque claro `:root[data-tema="X"]` ya existente — la combinación
  de ambos atributos en `<html>`, manejada por `core/theme.service.ts`, decide
  qué bloque gana sin depender del orden del archivo), nunca una inversión
  automática de colores: cada una de las 13 paletas tiene su propio set
  oscuro derivado a mano conservando su identidad de matiz (ej. Copihue sigue
  viéndose rojo/verde en oscuro, Girasol sigue amarillo), con fondo casi
  negro (nunca negro puro) y texto casi blanco (nunca blanco puro) — mismo
  principio que ya regía el modo claro de no usar negro/blanco puros.

## 3. Modelo de datos (Firestore)

### 3.1 `usuarios/{uid}` — la cuenta

```ts
{
  uid, email, nombre, foto?, telefono?,
  fechaRegistro,
  // sin campo "rol" — no hace falta, un solo tipo de cuenta
}
```

### 3.2 `personas/{personaId}` — cada perfil de salud bajo la cuenta

Colección top-level, no subcolección — así una persona puede eventualmente
compartirse entre dos cuentas (ej. padres separados con un hijo en común),
igual que el sistema original permite "co-dueños".

```ts
// Sección 6.2: qué es esta Persona respecto de la cuenta que la administra.
type RelacionPersona = 'yo_mismo' | 'menor_a_cargo' | 'adulto_mayor_a_cargo';

interface Persona {
  id: string;
  uidTitular: string;        // quién administra este perfil (equivalente a uidUsuario)
  nombres: string;
  apellidos: string;
  nombre?: string;           // @deprecated — campo legado de antes de separar nombres/apellidos;
                              // se mantiene solo por compatibilidad con documentos viejos, nunca
                              // se vuelve a escribir. nombreCompleto() resuelve a este valor si
                              // nombres/apellidos vienen vacíos (shared/persona-nombre.ts).
  fechaNacimiento: string;    // la edad se calcula al vuelo (core/edad.ts), nunca se guarda
  sexo: string;

  // Avatar ilustrado tipo Duolingo (core/avatar-dicebear.ts, librería
  // DiceBear "avataaars", MIT, 100% client-side) — identidad visual por
  // defecto de la Persona en toda la app (persona-detalle/personas-lista/
  // home/datos, vía shared/avatar.ts → avatarSrc()), en vez de subir/
  // recortar una foto real solo para "verse bien" (pedido explícito,
  // sección 2.1: baja fricción). Se guarda la configuración elegida (qué
  // piel, peinado, ojos, cejas, boca, lentes, ropa — ver AvatarOpciones),
  // nunca el SVG ya armado: liviano en Firestore, se arma al vuelo en el
  // cliente. Si no se personalizó, se usa AVATAR_POR_DEFECTO.
  avatarConfig?: AvatarOpciones;
  // Foto REAL (no el avatar) — exclusiva del QR de pérdida (sección 4.6):
  // ahí el objetivo es que un desconocido reconozca a la persona en la
  // vida real, así que una ilustración no sirve. persona-form solo la pide
  // (obligatoria) cuando `requiereQrPerdida` está activo; el resto de la
  // app (listados, Home, detalle, carnet de emergencia) siempre usa el
  // avatar de arriba, nunca esta foto.
  fotoUrl?: string;

  nacionalidad?: string;

  // Datos personales esenciales (pedido explícito: toda Persona que se crea
  // o se une tiene identificación, contacto, vivienda y contacto de
  // emergencia). persona-form los exige al guardar; quedan opcionales en el
  // tipo porque las Personas creadas antes no los tienen — para esas,
  // datosFaltantes() (shared/persona-datos.ts) avisa en Home, en el detalle
  // y en "Datos personales" qué falta completar.
  telefono?: string;         // obligatorio salvo para un menor a cargo (se le ubica por su contacto de emergencia)
  email?: string;
  direccion?: string;        // obligatorio: calle y número — para indicarle a una ambulancia dónde ir
  direccionDetalle?: string; // depto., casa, block
  comuna?: string;           // obligatorio
  region?: string;           // obligatorio, una de REGIONES_CHILE

  relacion: RelacionPersona;
  // Para 'yo_mismo': copia de usuarios/{uid}.rut (no se puede editar distinto acá).
  // Para 'menor_a_cargo' / 'adulto_mayor_a_cargo': RUT propio del dependiente,
  // obligatorio, único (mismo índice rutsRegistrados que usan las cuentas —
  // ver 6.2), validado solo en formato, NO verificado contra un registro real.
  rut: string;
  // Solo dependientes: documento que respalda el vínculo (certificado de
  // nacimiento para un menor; carnet + poder/documento de tutela para un
  // adulto mayor). Se guarda como respaldo, nadie lo revisa automáticamente
  // al crearlo (sección 6.2).
  documentoRespaldoUrl?: string;

  // Salud crítica — todo lo que un médico/paramédico de urgencia necesitaría
  // y nunca debería tener que adivinar (principio rector de esta sección).
  grupoSanguineo?: string;
  alergias?: string[];
  enfermedadesCronicas?: string[];
  medicamentosPermanentes?: string[];
  pesoKg?: number;                   // relevante para dosificar un medicamento de urgencia (ej. a un menor)
  estaturaCm?: number;
  dispositivosMedicos?: string[];    // marcapasos, prótesis, implantes metálicos — relevante antes de una resonancia/cirugía
  donanteOrganos?: boolean;
  prevision?: string;                // ej. "Fonasa", "Isapre Banmédica" — a qué institución corresponde llevarla
  medicoTratante?: string;
  telefonoMedicoTratante?: string;
  notasEmergencia?: string;          // texto libre, cualquier otra cosa relevante en una urgencia

  // Contacto de emergencia
  contactoEmergencia?: string;            // obligatorio
  contactoEmergenciaParentesco?: string;  // obligatorio, una de PARENTESCOS (se muestra también en el QR de pérdida)
  telefonoEmergencia?: string;            // obligatorio
  // Contactos de emergencia adicionales (hasta 4, pedido explícito), cada uno
  // con nombre/parentesco/teléfono obligatorios y el mismo formato que el
  // principal. Se ven en el detalle (con un toque para llamar) y en "Datos
  // personales"; el carnet, el QR de pérdida y el PDF siguen mostrando solo
  // el principal (los tres campos de arriba).
  contactosEmergenciaAdicionales?: { nombre: string; parentesco: string; telefono: string }[];

  // QR del carnet de emergencia — datos médicos para mostrarle a un médico.
  // qrFichaCamposPublicos deliberadamente NO puede incluir direccion/comuna:
  // exponer la dirección de alguien sin login es un riesgo que no aporta
  // nada a un médico de urgencia (minimización de datos, sección 7).
  qrFichaToken?: string;            // token random, válido para siempre, enlaza a vista pública de solo lectura
  qrFichaCamposPublicos?: string[]; // opt-in: qué secciones se muestran al escanear (alergias, contacto, medicación — NUNCA el historial completo NI archivos/documentos NI dirección/comuna)

  // QR de pérdida — para personas con demencia/Alzheimer que se pueden
  // desorientar o perderse (sección 4.6). Token y campos visibles
  // independientes del carnet: el enfoque acá es "si me encontraron, a quién
  // llamar", no el historial médico.
  qrPerdidaToken?: string;
  qrPerdidaCamposPublicos?: string[]; // típicamente: nombre, foto, contacto de emergencia, condición relevante (ej. "tiene Alzheimer")

  modoAccesoCompartido?: 'lectura' | 'escritura'; // permiso vigente del último PIN canjeado (sección 6; el PIN mismo vive en pinesAcceso, no acá)
}
```

### 3.3 `personas/{id}/historialMedico/{entradaId}` — el corazón del sistema

**Append-only: nunca se edita ni borra.**

```ts
type TipoEntrada = 'consulta' | 'receta' | 'vacunacion' | 'examen_resultado'
                  | 'cirugia' | 'indicaciones_alta' | 'solicitud_examen' | 'otro';

interface MedicamentoOrden {
  nombre: string;
  dosis: string;
  via?: string;          // oral, tópica, inyectable...
  frecuencia: string;    // "cada 8 horas", "1 vez al día"
  duracion?: string;     // "7 días", "de por vida"
}

interface Entrada {
  id?: string;
  tipo: TipoEntrada;
  fecha: string;               // fecha de la consulta/evento (puede diferir de createdAt si se carga después)
  motivo?: string;             // por qué fue la consulta
  diagnostico?: string;
  tratamientoIndicado?: string;
  texto?: string;              // notas libres adicionales

  // 'receta' / 'indicaciones_alta': lista estructurada, NO texto libre
  medicamentos?: MedicamentoOrden[];

  // 'solicitud_examen': checklist de estudios pedidos
  examenesSeleccionados?: string[];

  // 'examen_resultado': el resultado de un examen ya hecho
  archivoUrl?: string;         // PDF/foto del resultado/informe subido

  // Quién lo escribió — siempre el titular de la cuenta (no hay "autorRol"
  // porque no hay otro tipo de usuario)
  autorUid: string;
  autorNombre: string;
  createdAt: any;              // serverTimestamp — append-only, prueba que no se alteró después

  // Opcional: a qué especialidad/médico pertenece (sección 3.9) — permite que
  // no se mezcle el seguimiento de un cardiólogo con el de un endocrinólogo
  especialidadId?: string;
}
```

**Por qué append-only:** es la misma garantía que el sistema original aplica
al historial clínico — una vez escrita una nota, nadie (ni el propio dueño)
puede editarla o borrarla. Eso convierte el historial en un registro
confiable, no en notas que se pueden "arreglar" después de los hechos. Si algo
se cargó mal, se agrega una entrada nueva aclarando el error — nunca se
reescribe la vieja.

**Validación mínima (reglas de Firestore):** al menos uno de `motivo` /
`diagnostico` / `tratamientoIndicado` / `texto` / `medicamentos` (no vacío) /
`examenesSeleccionados` (no vacío) tiene que venir con contenido — así no se
pueden crear entradas completamente vacías.

### 3.4 `personas/{id}/vacunas/{id}`

```ts
{ id, tipo, fechaAplicacion, proximaFecha?, notas?, creadoPor }
```

`proximaFecha` es lo que la Cloud Function de recordatorios usa para avisar
un día antes.

### 3.5 `personas/{id}/medicamentosActivos/{id}` — tracking de un tratamiento en curso

Distinto de la receta puntual del historial.

```ts
{
  id, nombre, dosis, viaAdministracion?,
  frecuencia,              // para armar el recordatorio recurrente
  fechaInicio, fechaFin?,  // sin fechaFin = "de por vida"/indefinido
  horariosRecordatorio?: string[],  // ["08:00","14:00","20:00"] — cada toma
  notas?, creadoPor
}
```

Esta colección es la gran diferencia funcional pedida: no solo "quedó
registrada una receta", sino recordatorios recurrentes de toma de
medicamento, programados localmente en el dispositivo
(`@capacitor/local-notifications`) por cada horario mientras el tratamiento
esté activo (entre `fechaInicio` y `fechaFin`).

### 3.6 `personas/{id}/citas/{id}` — agenda de citas médicas

```ts
type TipoCita = 'control' | 'especialista' | 'examen' | 'cirugia' | 'urgencia' | 'dental' | 'otro';

{
  id, titulo, tipo?: TipoCita,
  fechaInicio,       // ISO completo (fecha+hora)
  fechaFin?, lugar?, notas?,
  creadoPor, personaId, personaNombre,  // denormalizado para mostrar en una agenda agregada de toda la familia
  especialidadId?: string   // opcional, ver 3.9
}
```

### 3.7 `personas/{id}/examenes/{id}` — exámenes programados/realizados

Distinto del resultado que vive en el historial.

```ts
{ id, tipo, fechaProgramada?, realizado?, fechaRealizado?, lugar?, notas?, ordenUrl?, resultadoUrl?, creadoPor, especialidadId? }
```

### 3.8 `personas/{id}/documentos/{id}` — documentos sueltos

Documentos que no encajan como "entrada de historial" (carnet de vacunación
físico escaneado, seguro médico, certificados, etc.).

```ts
{ id, nombre, categoria: 'seguro'|'certificado'|'carnet'|'otro', archivoUrl, subidoEn, notas?, especialidadId? }
```

### 3.9 `personas/{id}/especialidades/{id}` — catálogo de especialidades/médicos de esa persona

No es un catálogo global fijo (como `EXAMENES_COMUNES`): cada Persona arma el
suyo a medida que lo necesita, porque lo que importa es **el médico/trato
puntual de esa persona**, no una lista genérica de especialidades médicas.

```ts
{
  id,
  nombre: string,       // ej. "Cardiología — Dr. Pérez", "Endocrinología", "Oncología"
  color?: string,        // para distinguir visualmente en listados/calendario
  notas?: string,
  activa?: boolean,       // permite "archivar" un seguimiento cerrado sin borrar su historial
  creadoPor, creadoEn,
}
```

Es la pieza que resuelve el pedido explícito de no mezclar todo: documentos,
entradas de historial, citas y exámenes pueden etiquetarse opcionalmente con
`especialidadId`, de forma que el seguimiento de una enfermedad crónica o de
un médico específico se pueda ver aislado del resto (una "carpeta" por
especialidad), sin que eso sea obligatorio para usar el resto de la app.

## 4. Funcionalidades por módulo

### 4.1 Gestión de documentos

- Pantalla "Subir documento": elegir a qué Persona corresponde, categoría,
  especialidad opcional (3.9), archivo (foto con cámara o desde galería, o
  PDF), sube a Storage (`personas/{id}/documentos/...`), crea el registro en
  Firestore. La cámara acá es solo un método de captura de un papel/documento,
  no una galería de fotos (ver 2.1).
- El historial médico (3.3) también permite adjuntar un PDF/foto por entrada
  (resultado de examen, orden firmada escaneada).
- Listado filtrable por persona, por categoría **y por especialidad**; vista
  de detalle con el archivo embebido + metadata.
- **`core/storage.ts` → `subirArchivo()` reintenta ante `storage/unauthorized`**
  (hasta 3 veces, con espera creciente): las reglas de Storage validan acceso
  leyendo el documento de Firestore de la Persona dueña
  (`storage.rules` → `personaDoc()`), y esa lectura cruzada Storage→Firestore
  es de consistencia eventual (documentado por Firebase) — justo después de
  crear una Persona nueva, subir su primera foto/documento puede chocar con
  un 403 aunque el documento ya exista, porque la regla todavía no lo ve. Un
  error de permisos genuino (no por esto) sigue fallando igual tras los
  reintentos. En `persona-form`, si aun así falla (ej. en el emulador local,
  donde esta lectura cruzada no funciona de forma confiable — limitación ya
  conocida, no de producción), la Persona ya quedó guardada: se avisa aparte
  (alerta, no bloqueante) en vez de mostrar "no se pudo guardar" y arriesgar
  crear un duplicado si el usuario reintenta.

### 4.2 Exámenes

- Dos estados: **programado** (agendado, con fecha futura, aparece en el
  calendario) y **realizado** (con resultado adjunto).
- Checklist de estudios comunes reutilizable al "solicitar" un examen
  (`solicitud_examen` en el historial): hemograma, perfil bioquímico,
  radiografía, ecografía, orina, etc. — lista fija editable, igual que
  `EXAMENES_COMUNES` en el sistema original.
- Al marcar "realizado", se sube el resultado y queda enlazado tanto en
  `examenes/{id}` como en una entrada nueva `examen_resultado` en el
  historial (doble indexado: por tipo de contenido y por línea de tiempo
  cronológica).

### 4.3 Agenda / citas

- Calendario mensual compartido por todas las personas de la cuenta (igual
  que `CalendarioGridComponent` del sistema original): grilla del mes, un
  punto de color por tipo de evento en cada día, al tocar un día se ve el
  detalle de lo agendado (vacunas próximas, citas, medicamentos con
  recordatorio ese día).
- Layout responsive: en mobile la agenda del día va debajo de la grilla
  (scroll vertical normal); en escritorio (≥900px) la grilla ocupa la
  izquierda completa sin scroll y la agenda del día elegido queda fija en un
  panel a la derecha.
- Crear cita: formulario con persona, título, tipo, fecha/hora, lugar, notas.
- Pantalla de detalle de cita (ver/editar/eliminar), con botón de "agregar a
  mi calendario" (ICS) como paso intermedio antes de encarar una integración
  real con Google Calendar más adelante.
- **Conexión con Google Calendar (implementada, por suscripción .ics, sin
  OAuth):** Ajustes → Calendario → "Conectar con Google Calendar" genera un
  token secreto en `usuarios/{uid}.calendarioToken` y abre
  `calendar.google.com/calendar/render?cid=webcal://…/calendario/{token}.ics`
  para que el usuario confirme "Agregar". Ese feed lo sirve la Cloud Function
  `calendarioIcs` (rewrite de Hosting `/calendario/**`) con las citas,
  próximas vacunas y fin de tratamientos de todas las personas que ve la
  cuenta (propias y compartidas). Google lo vuelve a leer solo cada algunas
  horas (no es instantáneo). "Copiar enlace" sirve para Apple Calendar /
  Outlook; "Desconectar" borra el token y el enlace deja de funcionar. Se
  descartó OAuth porque el permiso de Calendar es "sensible" y exige que
  Google verifique la app antes de que usuarios reales lo puedan usar.

### 4.4 Medicamentos

Dos niveles, deliberadamente separados:

1. Receta puntual (dentro de una entrada de historial — "esto se indicó en
   esta consulta").
2. Tratamiento activo con recordatorio (`medicamentosActivos`, sección 3.5) —
   lo que dispara notificaciones repetidas mientras dura.

Pantalla "Mis medicamentos": lista de tratamientos activos por persona, con
botón "Marcar tomado" (log opcional de adherencia) y botón para dar de baja
cuando termina el tratamiento (cancela los recordatorios locales pendientes).

### 4.5 Recordatorios (dos capas, mismo patrón que el sistema original)

**Capa 1 — locales, instantáneos, sin servidor:**
`@capacitor/local-notifications`, programados en el momento de crear la
cita/medicamento, directo en el dispositivo. Rápidos pero se pierden si se
desinstala la app o se usa otro dispositivo.

**Capa 2 — push real, server-side**, una Cloud Function programada
(`onSchedule`) que corre una vez al día (ej. 09:00 hora local):

```ts
export const recordatoriosDiarios = onSchedule(
  { schedule: 'every day 09:00', timeZone: '<zona horaria del usuario o fija>' },
  async () => {
    // 1) collectionGroup('vacunas').where('proximaFecha','==', mañana) → push al titular
    // 2) collectionGroup('citas').where('fechaInicio','==', mañana) → push al titular
    // 3) revisar medicamentosActivos con fechaFin próximo → push "se termina el tratamiento"
    // cada push en su propio try/catch, para que un fallo puntual no corte el resto del lote
  }
);
```

Usa `collectionGroup` para barrer TODAS las subcolecciones
`vacunas`/`citas` de TODAS las personas de TODOS los usuarios en una sola
consulta, en vez de iterar usuario por usuario — clave para que escale sin
volverse lento ni caro a medida que crece la base de usuarios.

**Estado real de cada capa (actualizado):**
- Capa 1 (local): completamente funcional, y ahora además apagable desde
  Configuración ("Recordatorios en este dispositivo", sección 8) — el
  interruptor se guarda en `usuarios/{uid}.notificacionesLocales`
  (`core/notificaciones.service.ts`, mismo patrón que `ThemeService`) y
  `RecordatoriosLocalesService` lo consulta antes de programar un
  recordatorio nuevo. Apagarlo no cancela retroactivamente lo que ya estaba
  programado, solo evita programar recordatorios nuevos — a la UI se lo deja
  así de claro para no prometer de más.
- **Por qué "no se activaban" (corregido):** en la web la capa 1 no sirve
  — el plugin de Capacitor en navegador solo usa un `setTimeout` mientras
  la pestaña está abierta — y la capa 2 estaba deshabilitada porque ningún
  cliente registraba su token. Ahora: la capa 1 (interruptor "Recordatorios
  en este dispositivo") solo se muestra en la app nativa
  (`Capacitor.isNativePlatform()`), y en la web el interruptor "Avisos en
  este dispositivo" activa push real con FCM (`core/push.service.ts`):
  pide permiso, registra `public/firebase-messaging-sw.js` (service worker
  propio, sin cargar el SDK desde un CDN: solo muestra la notificación y
  abre la app al tocarla), y agrega el token a `usuarios/{uid}.fcmTokens`
  (uno por dispositivo). `recordatoriosDiarios` envía a todos los tokens
  con `sendEachForMulticast` y borra los que FCM reporta como inválidos.
  Botón "Enviar una notificación de prueba" → Cloud Function
  `enviarPushPrueba`. Sin `environment.vapidKey` se usa la clave VAPID por
  defecto de Firebase (funciona); se puede generar una propia en Firebase
  Console → Cloud Messaging → Certificados push web. En iPhone el push web
  solo funciona con la app agregada a la pantalla de inicio (hay
  `manifest.webmanifest` + íconos en `public/assets/icon/`). Los
  recordatorios de cada toma de medicamento siguen siendo solo locales
  (app nativa); el push avisa el día anterior a citas, vacunas y fin de
  tratamiento.

### 4.6 Carnet / fichas QR (emergencia y pérdida)

**Regla general para ambos QR:** la vista pública nunca da acceso a
documentos ni archivos, ni siquiera como enlace — solo a los campos de texto
que el titular marcó como públicos explícitamente. Ver los propios
documentos/exámenes/historial requiere estar logueado en la cuenta con
acceso a esa Persona; no hay forma de llegar a esos archivos escaneando un
QR, bajo ningún escenario.

**Carnet de emergencia** (dato médico, para un médico):
- Cada Persona tiene un `qrFichaToken` único y permanente.
- **La vista pública pasa por la Cloud Function `fichaPublica`** (corregido:
  antes la página leía el documento de la Persona desde el cliente, lo que
  fallaba para cualquiera sin sesión — o sea, el QR no le funcionaba a un
  desconocido — y de haberse permitido habría expuesto el documento
  completo). La función busca por token y devuelve solo los campos
  marcados como públicos para ese QR. La selección por defecto se guarda
  al abrir la configuración por primera vez (antes solo existía en
  pantalla y el QR salía vacío hasta tocar una casilla).
- Las páginas de configuración de cada QR muestran al lado (abajo en
  celular) una **vista previa en vivo** — un iframe de la misma página
  pública, que se recarga al guardar — en vez del botón "Ver cómo la ve
  un extraño". Las rutas públicas no muestran la pantalla de bloqueo por
  PIN, y Hosting manda `frame-ancestors 'self'` para que ningún otro sitio
  pueda incrustar la app.
- **QR de pérdida solo si la persona lo necesita** (pedido explícito):
  `Persona.requiereQrPerdida` (interruptor en "Salud urgente" del
  formulario). El módulo aparece en el detalle solo si está activo, o si ya
  se había configurado antes (tiene `qrPerdidaToken`).
- **Única pantalla de la app que pide una foto real** (pedido explícito):
  activar `requiereQrPerdida` en persona-form hace obligatorio subir
  `Persona.fotoUrl` ahí mismo — a diferencia del avatar ilustrado (sección
  3.2), acá sí hace falta una foto real porque el objetivo es que un
  desconocido reconozca a la persona en la calle. El resto de la app
  (listados, Home, detalle, carnet de emergencia) sigue usando siempre el
  avatar, nunca esta foto.
- Vista pública (sin login) en `/ficha-publica/{token}`: muestra solo lo que
  el titular marcó como público en `qrFichaCamposPublicos` (opt-in explícito,
  nunca el historial clínico completo) — típicamente: nombre, grupo
  sanguíneo, alergias, medicación crónica, contacto de emergencia.
- Generación de PDF de carnet descargable/imprimible (jsPDF, 100%
  client-side) con esos mismos datos + el QR embebido, para llevarlo
  físicamente o guardarlo en el teléfono.
- Caso de uso: emergencia médica donde la persona no puede hablar, llevarlo
  a la escuela/trabajo, etc.

**QR de pérdida** (dato de contacto, para un desconocido que encuentra a la
persona):
- Pensado para personas con demencia, Alzheimer u otra condición que pueda
  hacer que se desorienten o se pierdan.
- Cada Persona tiene, independiente del carnet, un `qrPerdidaToken` propio
  con su propia vista pública de solo lectura.
- Prioriza lo que necesita alguien que la encuentra en la calle: nombre,
  foto, una condición relevante en una frase ("tiene Alzheimer, por favor
  llamar a su familiar"), y el contacto de emergencia bien visible — no
  apunta a ser un resumen médico como el carnet.
- Mismo mecanismo de impresión en PDF/QR físico que el carnet, para llevarlo
  encima (ej. en la billetera o cosido a la ropa).

### 4.7 Especialidades (organización por médico/tratamiento)

Ejemplo real que motiva esto: el papá tiene problemas respiratorios, así que
su perfil tiene un apartado "Broncopulmonar", otro "Gastro" y uno "General".
Si va a una urgencia respiratoria, el familiar que lo acompaña entra
directo a "Broncopulmonar" y ve solo lo de esa especialidad — no tiene que
buscar entre todos los exámenes de los últimos años para encontrar el
informe que necesita en ese momento.

- Gestionadas desde el detalle de cada Persona: crear/renombrar/archivar
  especialidades (3.9).
- Vista "por especialidad": elegida una especialidad, se ve en una sola
  pantalla todo lo etiquetado con ese `especialidadId` — documentos, entradas
  de historial, citas y exámenes — ordenado cronológicamente, como una
  carpeta de ese tratamiento en particular.
- Etiquetar con especialidad es siempre opcional al crear una entrada,
  documento, cita o examen; no bloquea el flujo normal de la app para quien no
  lo necesita.
- **Encontrar la especialidad correcta rápido:** el listado de
  especialidades de una Persona tiene un buscador por nombre (aparece desde
  la quinta especialidad en adelante — antes no hace falta). Se evaluó
  también un mapa interactivo de cuerpo humano (tocar una zona como
  "cabeza" → sugerir especialidades como psicología/neurología), pero se
  descartó para esta etapa: el buscador cubre el caso real (encontrar
  "Broncopulmonar" entre varias que ya creó el usuario, sección 4.7) con
  mucho menos esfuerzo de construcción y es más accesible para el público
  objetivo (sección 2.1) que interpretar un diagrama. Queda anotado como
  posible mejora de fase 2, no se descarta para siempre.

## 5. Autenticación y estructura de cuenta

- Firebase Auth: email/contraseña + Google Sign-In (OAuth).
- Una sola colección de usuarios, sin campo de rol. El `authGuard` de rutas
  solo verifica "¿hay sesión?", no distingue tipos de cuenta.
- Cada usuario ve solo sus propias Personas (`where uidTitular == miUid`)
  salvo que use el mecanismo de compartir (sección 6).

## 6. Familiares (co-dueños entre cuentas separadas)

Reutilizando la idea de "co-dueño" del sistema original: cada persona de la
familia tiene **su propia cuenta** (su propio login), y las cuentas se
vinculan entre sí para que una pueda ver y gestionar los perfiles de la otra.

Ejemplo real: Lidia y Sergio tienen cada uno su propia cuenta en la app, cada
uno con su propia Persona "yo mismo/a". Su hijo Gabriel también tiene su
propia cuenta. Gabriel se vincula como familiar a la cuenta de Lidia y a la
de Sergio — a partir de ahí, cuando Gabriel entra a la app ve su propio
perfil **y además** los perfiles de sus dos padres en su mismo listado de
"Mis personas", con acceso para cargar/consultar documentos, exámenes y citas
de ellos, sin que eso le dé a Gabriel la contraseña ni el control total de la
cuenta de sus padres.

**PIN con vencimiento y límite de usos (implementado, reemplaza al campo
`pinAccesoCompartido` de la Persona):** cada PIN es un doc
`pinesAcceso/{pin}` (`personaId`, `uidTitular`, `modo`, `usosMax` 1–5,
`usos`, `expiraEn` máx. 7 días — validado en firestore.rules). Solo el
titular lo puede leer o anular: antes el PIN vivía en el doc de la Persona y
cualquiera con acceso compartido lo podía leer y reenviar. `canjearPin`
valida y suma el uso en una transacción, y borra el PIN al agotarse;
canjear de nuevo un perfil al que ya se tiene acceso no gasta un uso. El
modal `shared/compartir-pin` (botón "Compartir perfil con un familiar" en
el detalle de la Persona, más en "Datos personales") permite elegir permiso,
vigencia (1 h / 24 h / 7 días) y usos (1 / 3 / 5), y comparte por WhatsApp
(`wa.me`), por el menú nativo (`navigator.share`) o copiando un mensaje con
instrucciones y el enlace `/canjear-pin?pin=…`, que deja el PIN ya escrito.
"¿Te compartieron un perfil?" aparece arriba en Personas (además de Home).

**Esto se resuelve con el mecanismo de PIN de arriba**: quien lo canjea
(mediante invitación: el titular comparte el código, la otra persona lo
ingresa estando logueada en su propia cuenta) queda agregado a
`uidsConAcceso` de esa Persona, con acceso de solo lectura o
lectura+escritura según lo que eligió el titular — y esa Persona pasa a
aparecer también en el listado de "Mis personas" de quien canjeó el PIN. No
hace falta compartir la cuenta completa ni la contraseña.

Sirve tanto para el caso de arriba (hijo ↔ padres, cada uno con cuenta
propia) como para parejas o cuidadores que administran el perfil de un
adulto mayor.

## 6.1 Una cuenta por persona real — verificación del titular

**Decisión tomada (reemplaza la decisión anterior de "opción liviana"): sí se
hace verificación real**, parecida a cómo lo hace BancoEstado con CuentaRUT —
cédula + selfie en vivo comparada contra la foto del Registro Civil — en vez
de solo validar el formato del RUT.

Por qué cambia la decisión original: para datos de salud, la unicidad de RUT
sola (que alguien no pueda registrarse dos veces) no evita que alguien se
registre con el RUT de **otra persona**. La verificación real sí lo evita,
porque exige que la cara de quien se registra coincida con la foto oficial de
ese RUT.

**Cómo funciona (investigado, no es la opción gratuita):**
- ClaveÚnica (la identidad digital del Estado) es gratis, pero **solo para
  organismos del Estado** — una empresa privada no puede integrarla
  directamente.
- Un médico real nunca entra a la app, pero el **titular de la cuenta sí**, y
  es quien se verifica así. La verificación se hace vía un **proveedor
  externo pagado** que compara la selfie contra la base del Registro Civil —
  evaluados: **Didit** (~US$0,20 por verificación concluyente, el más barato,
  enfocado en LatAm/Chile), Truora, Sumsub. Falta elegir y crear la cuenta del
  proveedor (pendiente del usuario) antes de integrar la API.
- Flujo: al completar el registro (junto con el RUT, pantalla
  "completar-registro"), se pide escanear la cédula y tomarse una selfie; el
  proveedor devuelve si coincide. Mientras no se decide/integra el proveedor,
  el registro sigue funcionando con la validación liviana de formato + Cloud
  Function de unicidad (`rutsRegistrados/{rut}`, sección 6.2) como hoy, para
  no bloquear el desarrollo del resto de la app.
- "Dato biométrico local" (Face ID/huella del teléfono) sigue existiendo pero
  es algo distinto: solo desbloquea la app ya logueada en ESE teléfono, no
  verifica identidad contra el Registro Civil — ver subsección "Desbloqueo
  biométrico" más abajo.

**Límite importante de esta verificación:** solo sirve para alguien que puede
participar activamente (sacarse una foto, mostrar su cédula) — por eso no
aplica a los dependientes de la sección 6.2, que se resuelven distinto.

**Implementado: tope de intentos, porque cada sesión cuesta real.** A
diferencia de las cuotas de Firebase (que se resetean solas), cada sesión de
verificación en Didit tiene un costo (~US$0.35–0.55) aunque termine
rechazada o abandonada — no hay forma de que sea "gratis" aunque el usuario
nunca la use. `crearSesionVerificacion` bloquea una sesión nueva si la cuenta
ya alcanzó **5 intentos** totales (`usuarios/{uid}.verificacionIdentidad.intentos`,
con mensaje para escribir a `serangelia.oficial@gmail.com`) o si el último
intento fue hace menos de **10 minutos** (`ultimoIntentoEn`, evita que un
doble clic dispare dos sesiones pagas). El cliente (`configuracion.page.ts`)
muestra el mensaje que manda la Cloud Function tal cual en vez del genérico
de siempre, porque acá sí hace falta que el usuario entienda por qué no
puede reintentar.

Una vez integrado el proveedor, hay que reflejar en los Términos y
Condiciones y la Política de Privacidad que se procesa una selfie + foto de
cédula con un tercero, con qué base legal, por cuánto tiempo se guarda el
resultado (lo ideal es NO guardar la selfie/cédula, solo el resultado
booleano "verificado sí/no" + fecha) y quién puede verlo.

### PIN de reingreso rápido (implementado)

Pedido explícito del usuario: la verificación cédula+selfie de arriba pasa
**una sola vez**, al crear la cuenta — nunca se repite en cada apertura de
la app, porque sería una obstrucción. Para la seguridad del día a día
(ej. que alguien tome el teléfono ya desbloqueado) se usa en cambio un PIN
de 6 dígitos estilo apps bancarias, configurable desde Configuración →
Seguridad:

- **Puramente local, nunca en el servidor**: el PIN se guarda como hash
  SHA-256 en `localStorage` del dispositivo (`core/bloqueo.service.ts`), no
  en Firestore — no necesita viajar entre dispositivos (cada dispositivo
  tiene el suyo) y guardarlo del lado del servidor no aportaría nada a su
  propósito, que es puramente de conveniencia/seguridad local.
- **Cuándo se pide**: al abrir la app por primera vez en una sesión (carga
  fría) si ya hay un PIN configurado, y al volver de segundo plano después
  de ~10 segundos oculto (`document.visibilitychange`) — no se usa un
  plugin nativo de Capacitor para detectar foreground/background, la API
  web estándar alcanza tanto en navegador como dentro del WebView de
  Capacitor.
- **Pantalla de bloqueo** (`shared/bloqueo-overlay/`): se monta en
  `app.component.html` por encima de `<ion-router-outlet>`, cubriendo toda
  la app mientras `BloqueoService.desbloqueado()` sea `false`. Después de 5
  intentos fallidos, cierra la sesión automáticamente (no deja intentar
  PINs indefinidamente).
- **"Olvidé mi PIN"**: como el PIN es solo una conveniencia local, nunca un
  reemplazo del login real, olvidarlo no es grave — el botón simplemente
  cierra la sesión para volver a entrar con el método real (email/
  contraseña o Google).
- **Teclado numérico reutilizable** (`shared/pin-pad/`): mismo componente
  para la pantalla de bloqueo y para crear/cambiar/quitar el PIN desde
  Configuración (que pide el PIN actual antes de cambiarlo o quitarlo).
- Distinto del desbloqueo biométrico (Face ID/huella), ver subsección
  siguiente — son dos mecanismos de conveniencia local complementarios, no
  mutuamente excluyentes.

### Desbloqueo biométrico (implementado)

Face ID / huella / reconocimiento facial u ojo en Android, vía
`@aparajita/capacitor-biometric-auth` (+ `@capacitor/app`, que necesita como
peer dependency para detectar cuándo la app vuelve a primer plano).
**Nunca reemplaza el PIN de arriba, es un atajo sobre él**: solo se puede
activar si ya hay un PIN configurado, y si la biometría falla, se cancela, o
el dispositivo no la soporta (ej. navegador de escritorio — ahí
`checkBiometry()` siempre reporta `isAvailable: false`), el teclado de PIN
sigue siempre disponible como respaldo en la misma pantalla.

- **`core/biometria.service.ts`**: expone `disponible`/`tipo` (resultado de
  `checkBiometry()` — qué soporta y tiene enrolado ESTE dispositivo) y
  `activa` (preferencia del usuario). Igual que el PIN, `activa` se guarda
  solo en `localStorage` (`serangelia.biometriaActiva`), nunca en
  Firestore — es un dato puramente local del hardware/SO.
- **Se re-chequea al volver a primer plano**, no solo al abrir la app
  (`BiometricAuth.addResumeListener`, que interiormente usa
  `@capacitor/app` → `appStateChange`): si el usuario enrola o borra una
  huella mientras la app está en segundo plano, Configuración lo refleja
  sin tener que reabrir la app.
- **Activar pide confirmar con el sensor primero**
  (`activarConConfirmacion()`): nunca se guarda la preferencia como activa
  si la autenticación de prueba falla, para no dejar un atajo roto.
- **Configuración → Seguridad**: el switch "Desbloquear con Face ID/huella/
  etc." (etiqueta dinámica según `BiometryType`) solo aparece si ya hay PIN
  Y el dispositivo soporta biometría — mismo patrón visual que el resto de
  switches de Configuración.
- **`shared/bloqueo-overlay/`**: si la biometría está activa y disponible,
  se intenta automáticamente al mostrarse la pantalla de bloqueo
  (`ngOnInit`), con un botón para reintentar a mano si se cancela — el
  teclado de PIN de abajo sigue siempre visible y funcional como respaldo,
  nunca se oculta.
- Quitar el PIN (desde Configuración o desde "¿Olvidaste tu PIN?") también
  apaga la preferencia de biometría, para no dejar un atajo activo sin el
  PIN que lo respalda.
- **Pendiente para cuando se agregue la plataforma iOS**: el `Info.plist`
  necesita la clave `NSFaceIDUsageDescription` (requisito de Apple para usar
  Face ID) — no existe todavía porque `npx cap add ios` no se ha corrido en
  este proyecto (sección 2, sigue siendo solo PWA/web).

## 6.2 Personas dependientes (menores de edad / adultos mayores a cargo)

Aplica el límite explícito de la sección 1: una cuenta tiene una Persona
`yo_mismo` (el titular) y, opcionalmente, Personas `menor_a_cargo` o
`adulto_mayor_a_cargo` — nunca un tercer tipo. Un adulto independiente nunca
se agrega así; se vincula con su propia cuenta por PIN (sección 6).

**Por qué un dependiente no pasa por la verificación de 6.1:** la
verificación cédula+selfie necesita que la propia persona participe. Una
guagua no tiene cédula con foto todavía; un adulto mayor convaleciente puede
que no pueda operar el teléfono. Para ellos la app pide, al crear la Persona:

- **RUT propio del dependiente** (obligatorio, no opcional) — en Chile los
  RUT existen desde el nacimiento, así que un recién nacido ya tiene uno.
  Mismo validador de formato que el del titular (sección 6.1).
- **Documento de respaldo** (obligatorio): certificado de nacimiento escaneado
  para un menor; carnet de identidad + algún documento de tutela/poder para
  un adulto mayor. Sube a Storage igual que cualquier documento (sección
  4.1), queda enlazado en `Persona.documentoRespaldoUrl`.
- **No hay revisión automática ni manual del documento al crearlo** — queda
  guardado como respaldo por si hay una disputa (ej. dos cuentas reclamando
  el mismo RUT dependiente), no bloquea el flujo de alta.

**Unicidad de RUT, ahora compartida entre cuentas y dependientes:** el mismo
índice `rutsRegistrados/{rut}` de la sección 6.1 (el id del doc es el RUT
normalizado, así que un segundo `create` sobre el mismo RUT es en realidad un
`update`, y eso ya está bloqueado por reglas) se reutiliza para los
dependientes, agregando qué lo reclamó:

```ts
// rutsRegistrados/{rutNormalizado}
{
  tipo: 'titular' | 'dependiente',
  uid?: string,         // si tipo === 'titular'
  personaId?: string,   // si tipo === 'dependiente'
  uidTitular?: string,  // quién administra ese dependiente
  reclamadoEn: any,     // serverTimestamp
}
```

Esto evita, con la misma garantía atómica de antes (sin necesitar Cloud
Function extra, solo reglas + batch): que dos cuentas reclamen el mismo RUT
como titular, que un RUT ya usado como cuenta se reuse como dependiente de
otra persona, o que el mismo dependiente se agregue dos veces (misma cuenta u
otra). La creación de una Persona dependiente y el `create` en
`rutsRegistrados` van en el mismo `writeBatch`, igual que `reclamarRut`.

**Una cuenta tampoco puede tener dos Personas `yo_mismo` (implementado vía
reglas, no solo la UI):** `PersonasService.crearTitular()` fija, en el mismo
batch que crea la Persona, `usuarios/{uid}.personaYoMismoId`;
`firestore.rules` bloquea un segundo `create` con `relacion == 'yo_mismo'`
para esa cuenta leyendo ese campo, y además bloquea reescribirlo a otro id
una vez fijado. Antes esto solo lo evitaba la UI (`tieneYoMismo()`, una
consulta client-side) — una cuenta vieja que ya tenía su `yo_mismo` antes de
este cambio queda protegida recién la primera vez que esto se evalúa (no hay
backfill retroactivo, anotado como límite conocido, igual que el de abajo).

**Límite conocido, no resuelto todavía:** si un dependiente (ej. un menor)
crece y quiere tener su propia cuenta, hoy no hay un flujo para "liberar" su
RUT del índice y traspasarlo — queda anotado como trabajo futuro, no bloquea
el MVP.

## 7. Reglas de seguridad (Firestore Rules) — principios

- `personas/{id}`: solo `uidTitular` (o quien tenga acceso compartido
  otorgado vía PIN) puede leer/escribir.
- `historialMedico`: `create` permitido a quien tiene acceso a la persona;
  `update`/`delete` bloqueados siempre (append-only, sin excepción, ni para
  el propio titular).
- Nunca confiar validaciones sensibles solo al cliente — todo lo que
  determina permisos (otorgar acceso compartido por PIN, cálculos agregados)
  corre en Cloud Functions con el Admin SDK, igual que
  `validarPinVeterinario` en el sistema original.
- Dato sensible = dato médico real: a diferencia del sistema original
  (mascotas), acá sí aplican consideraciones de privacidad de datos de salud
  humana más estrictas (en EE.UU. sería HIPAA; en otros países, la ley de
  protección de datos de salud local) — conviene desde el diseño: cifrado en
  tránsito (ya lo da Firebase), minimizar qué campos se exponen en la ficha
  pública de QR, y dar al usuario control total de borrado de su cuenta y
  datos.

## 7.1 Documentos legales

Política de Privacidad y Términos de Uso, redactados conforme a la Ley N°
19.628 sobre Protección de la Vida Privada (vigente) y pensados ya en
términos de la Ley N° 21.719 (moderniza la 19.628, crea la Agencia de
Protección de Datos Personales) que entra en vigencia en diciembre de 2026.

- **Responsable del tratamiento de datos**: Ana Rayen Castillo Painenao, RUT
  21.393.050-8, como persona natural (todavía no hay una empresa
  constituida). Contacto: `serangelia.oficial@gmail.com`.
- Implementados como páginas dentro de la app (no solo un documento aparte):
  `/privacidad` y `/terminos`, rutas públicas (sin `authGuard`, legibles sin
  iniciar sesión). Contenido en `pages/legal/contenido-legal.ts` (array de
  secciones título+párrafos+lista, para no tener un bloque de HTML gigante
  por página) y dos componentes de página (`politica-privacidad`,
  `terminos-uso`) que solo iteran ese contenido.
- **Consentimiento expreso al crear la cuenta (implementado):** dos
  casillas obligatorias en el registro (Términos; Política de Privacidad +
  tratamiento de datos personales y de salud propios y de las personas a
  cargo), con mensaje de error si no se marcan. Se guarda
  `usuarios/{uid}.consentimientos` = { version: ULTIMA_ACTUALIZACION,
  fechas }. Si la cuenta no tiene la versión vigente (cuentas de Google
  nuevas, cuentas anteriores a esto, o cuando cambian los textos y se
  actualiza ULTIMA_ACTUALIZACION) se la manda a completar-registro a
  aceptar antes de usar la app (`AuthService.registroIncompleto`, revisado
  en el login y al abrir el shell).
- Enlazados desde el pie del formulario de Login/registro y desde una
  tarjeta "Legal" en Configuración.
- La Política cubre: qué datos se recopilan (incluyendo que los datos de
  salud son "datos sensibles" bajo la ley chilena, que requieren
  consentimiento expreso), para qué se usan, con quién se comparten
  (Firebase/Google Cloud como encargado del tratamiento — implica
  transferencia internacional de datos), cuánto se guardan, los derechos
  ARCO+ del usuario y cómo ejercerlos, y dirección/comuna explícitamente
  excluidas del carnet público de emergencia (sección 4.6) por riesgo de
  seguridad.
- **Pendiente, no bloquea el MVP**: hoy la eliminación de cuenta completa se
  resuelve por correo (no hay todavía un botón de autoservicio "Eliminar mi
  cuenta" en la app) — la Política ya lo deja así de claro; construir ese
  flujo de autoservicio queda pendiente como parte de la expansión de
  Configuración.

## 8. Pantallas principales

- Login/registro
- Completar registro (RUT) → lleva directo a crear la Persona "yo mismo/a"
  con sus datos personales (`/personas/nueva?bienvenida=1`), así ninguna
  cuenta nueva queda sin sus datos esenciales.
- Home: aviso "Completa tus datos personales" si la cuenta todavía no tiene
  su "yo mismo/a"; accesos rápidos (agregar persona, subir documento, ver
  agenda, ver medicamentos activos) + próximos eventos (vacunas/citas/
  medicamentos de los próximos días, de todas las personas); "Mis personas"
  marca con "!" a quien le faltan datos esenciales. Sin "Cerrar sesión" ni
  engranaje propio (Ajustes ya está en la navegación principal).
- Listar personas (perfiles bajo la cuenta)
- Detalle de persona: arriba solo lo urgente (edad, relación, grupo
  sanguíneo/alergias/crónicas como chips, contacto de emergencia con un toque
  para llamar, aviso de datos faltantes); abajo los módulos Historial
  clínico / Vacunas / Medicamentos / Exámenes / Documentos / Especialidades /
  Carnet / QR de pérdida. El engranaje lleva a "Datos personales".
- Datos personales de una persona (`/personas/:id/datos`): todos sus datos
  en secciones de solo lectura (identificación, contacto, vivienda, contacto
  de emergencia, salud urgente, previsión) + "Editar datos personales"
  (persona-form) + administración del perfil (compartir con PIN, eliminar),
  esto último solo visible para el titular. "Editar avatar"
  (`shared/editor-avatar/`, modal tipo Duolingo: pestañas piel/cara/cabello/
  lentes/ropa, cada opción se elige "a ojo" viendo cómo queda, sin texto) se
  abre desde el círculo de avatar en persona-form — ver sección 3.2. Para "yo mismo/a" también se
  llega desde Ajustes → Cuenta → "Mis datos personales".
- Historial clínico: timeline de entradas, botón "Nueva entrada" con
  selector de tipo (consulta/receta/vacunación/examen/cirugía/indicaciones de
  alta/solicitud de examen) que cambia los campos del formulario
  dinámicamente
- Calendario (compartido, todas las personas)
- Detalle de cita
- Mis medicamentos (tratamientos activos + historial de tomas)
- Subir documento
- Especialidades: listado + vista "por especialidad" (carpeta de un
  médico/tratamiento con sus documentos, entradas, citas y exámenes)
- Ficha de emergencia / QR (configurar qué se muestra + generar PDF + ver
  cómo la ve un extraño)
- Configuración de cuenta: cuenta (+ acceso a "Mis datos personales"), color/tamaño de letra, notificaciones
  (4.5), seguridad (PIN de reingreso rápido, sección 6.1), calendario (4.3),
  legal (7.1). "Cerrar sesión" es deliberadamente
  poco vistoso — un link de texto simple al final de todo, no un botón
  destacado — con una confirmación antes de ejecutar (pedido explícito del
  usuario: que no sea lo primero que salta a la vista en Ajustes). Es el
  único lugar de la app con "Cerrar sesión" (pedido explícito), salvo dos
  salidas de emergencia que no se pueden quitar: "Completar registro" (antes
  de tener RUT no se llega a Ajustes) y "¿Olvidaste tu PIN?" en la pantalla
  de bloqueo.
- Política de Privacidad / Términos de Uso (sección 7.1, públicas sin login)

**Layout responsivo** (pedido explícito: escritorio bien distribuido y
responsive). Tokens en `src/styles.scss`: `--ancho-contenido` (1120px en
escritorio, 760px en tablet) y `--margen-lateral` (20/28/40px). Todos los
"cuerpos" de pantalla (`.home-cuerpo`, `.form-cuerpo`, `.lista-cuerpo`,
etc.) comparten ese ancho y quedan alineados entre pantallas, y el título
de la barra superior (`ion-toolbar`) empieza en el mismo borde. Esas
reglas globales van prefijadas con `.shell__contenido ion-content` porque
los estilos de componente (`.x[_ngcontent-…]`) tienen más especificidad
que una clase global sola. Rangos: celular < 600px (una columna); tablet
600–899px (barra inferior, grillas de 2–4 columnas: accesos de Home en 4,
módulos de persona en auto-fill, Personas como grilla de tarjetas);
escritorio ≥ 900px (panel lateral); pantalla ancha ≥ 1200px (Home con
"Mis personas" como columna lateral fija, detalle de persona con el
resumen urgente fijo a la izquierda y los módulos a la derecha). La clase
global `.columnas-tarjetas` reparte tarjetas en dos columnas tipo masonry
(column-count) desde 1100px — usada en el formulario de persona, "Datos
personales" y Ajustes. Verificado con capturas en 1440/1280/1024/768/390px
sin scroll horizontal.

**Probar con emuladores** (no toca el proyecto real): `firebase emulators:start
--only auth,firestore,storage` (requiere Java 21+) + `ng serve`, y en el
navegador `localStorage.setItem('serangelia.emuladores', '1')` antes de
recargar — `core/firebase.ts` conecta los emuladores solo si
`environment.production` es false y esa clave está puesta.

**Validaciones de formulario** (pedido explícito del usuario: mensajes
claros, no solo bloquear en silencio): `core/validadores.ts` centraliza los
patrones reutilizados entre pantallas (nombre: solo letras/espacios/tilde/
apóstrofo/guión; teléfono: dígitos/espacios/guión con "+" inicial
opcional) — se usan tanto como atributo `pattern` nativo en el `ion-input`
(feedback inmediato del teclado/navegador) como validados de nuevo en
TypeScript antes de enviar (mensaje en español específico por campo, ej.
"El nombre solo puede tener letras y espacios", no un genérico "dato
inválido").

**Implementado en todos los formularios** (login, completar registro,
canjear PIN, persona, cita, vacuna, medicamento, examen, documento,
especialidad, nueva entrada de historial, QR de pérdida) con
`ValidacionFormulario` (`core/validadores.ts`): cada campo declara su regla
(`reglas.requerido`, `reglas.correo`, `reglas.telefono`, `reglas.nombre`,
`reglas.noFutura`, `reglas.rango`, `reglas.largoMaximo`, `errorArchivo`
para tipo/tamaño de archivo, encadenables con `primerError`) y los mensajes
salen de `MENSAJES` ("Este campo es obligatorio.", "Ingresa un correo
válido, por ejemplo nombre@correo.com.", etc.) para que digan lo mismo en
toda la app. Patrón en la plantilla: `[class.campo-invalido]` en el
`ion-item` (borde rojo), `(ionBlur)="v.campo('x')"` valida al salir del
campo, `(ngModelChange)="v.revalidar('x')"` borra el error apenas se
corrige (sin marcar errores mientras se escribe por primera vez), y el
mensaje va debajo en `<p class="texto-error-campo">`. Al enviar,
`v.todo()` marca todos los campos de una vez; el botón de guardar nunca se
deshabilita por datos faltantes (si no, el usuario no sabría qué le falta).
Los obligatorios llevan "*" en la etiqueta. Los errores de guardado nunca
muestran el mensaje técnico de Firebase (viene en inglés): siempre un texto
en español ("No se pudo guardar… Revisa tu conexión e intenta de nuevo.").
Nota técnica: el atributo HTML `pattern` se interpreta con el flag
`v` (unicode sets) de `RegExp`, que es más estricto que el modo normal de
JS — un rango manual de acentos (`À-ÖØ-öø-ÿ`) o un `-` suelto al final de
una clase mezclado con un escape (`\s`, `\p{L}`) tira
"Invalid character (in) class" ahí; `core/validadores.ts` ya resuelve esto
(usa `\p{L}` en vez de rangos manuales, y escapa el guión como `\-`) — para
agregar un patrón nuevo conviene probarlo con `new RegExp(patron, 'v')`
antes de usarlo en un `pattern`.

## 9. Fuera de alcance explícito (para no inflar el MVP)

- Ningún tipo de cuenta profesional/clínica/negocio.
- Sin chat con terceros ni directorio público de profesionales.
- Sin reserva de horas con un tercero real — "citas" son autogestionadas por
  el propio usuario (equivalente a cuando, en el sistema original, el dueño
  agenda una cita él mismo, no la "reserva abierta" con un profesional
  externo).
- Integración real con Google Calendar (OAuth, sync bidireccional) queda
  para una fase posterior — el MVP exporta a `.ics` como paso intermedio.
