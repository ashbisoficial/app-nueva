# app-nueva — Especificación técnica

"Versión humana" de Ashbis: sistema de gestión de salud personal/familiar.

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

**Multi-perfil bajo una sola cuenta.** Una cuenta puede llevar el registro de
varias "personas" (uno mismo + hijos + familiares a cargo) — equivalente
directo al concepto "una cuenta de dueño con varias mascotas" del sistema
original (Ashbis).

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
  café-rosado oscuro, nunca negro puro). Hay paletas alternativas
  predefinidas (ej. "Cielo", "Menta", "Atardecer") para quien prefiera otra
  base. Técnicamente esto se resuelve con tokens de color (variables CSS) por
  tema, nunca colores hardcodeados en los componentes — ver el borrador de
  paleta y tipografía en el artifact "Identidad visual Sergalia" para los
  valores concretos propuestos (pendiente de aprobación).
- **Tipografía.** Fuente cálida y "familiar", no corporativa fría. Entre las
  opciones evaluadas, **Atkinson Hyperlegible** (diseñada por el Braille
  Institute específicamente para legibilidad en baja visión) es la
  recomendada dado el rango etario — cubre bien tanto a adultos mayores como
  al resto sin sacrificar personalidad.
- **Tamaño de letra / tamaño de interfaz.** Ajustable desde Configuración
  (ej. tres pasos: chico/normal/grande) y aplicado a toda la app vía un
  token de escala, no pantalla por pantalla.

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
interface Persona {
  id: string;
  uidTitular: string;        // quién administra este perfil (equivalente a uidUsuario)
  nombre: string;
  fechaNacimiento: string;
  sexo: string;
  fotoUrl?: string;

  // Salud crítica — equivalente a alergias/enfermedadesCronicas/medicamentosPermanentes
  grupoSanguineo?: string;
  alergias?: string[];
  enfermedadesCronicas?: string[];
  medicamentosPermanentes?: string[];

  // Contacto de emergencia
  contactoEmergencia?: string;
  telefonoEmergencia?: string;

  // QR del carnet de emergencia — datos médicos para mostrarle a un médico
  qrFichaToken?: string;            // token random, válido para siempre, enlaza a vista pública de solo lectura
  qrFichaCamposPublicos?: string[]; // opt-in: qué secciones se muestran al escanear (alergias, contacto, medicación — NUNCA el historial completo NI archivos/documentos)

  // QR de pérdida — para personas con demencia/Alzheimer que se pueden
  // desorientar o perderse (sección 4.6). Token y campos visibles
  // independientes del carnet: el enfoque acá es "si me encontraron, a quién
  // llamar", no el historial médico.
  qrPerdidaToken?: string;
  qrPerdidaCamposPublicos?: string[]; // típicamente: nombre, foto, contacto de emergencia, condición relevante (ej. "tiene Alzheimer")

  pinAccesoCompartido?: string;    // opcional, ver sección 6 (familiares / compartir con persona de confianza)
  pinGeneradoEn?: any;
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

### 4.6 Carnet / fichas QR (emergencia y pérdida)

**Regla general para ambos QR:** la vista pública nunca da acceso a
documentos ni archivos, ni siquiera como enlace — solo a los campos de texto
que el titular marcó como públicos explícitamente. Ver los propios
documentos/exámenes/historial requiere estar logueado en la cuenta con
acceso a esa Persona; no hay forma de llegar a esos archivos escaneando un
QR, bajo ningún escenario.

**Carnet de emergencia** (dato médico, para un médico):
- Cada Persona tiene un `qrFichaToken` único y permanente.
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

**Esto ya está resuelto por el mecanismo de PIN** (sección 3.2): un
`pinAccesoCompartido` de 6 dígitos por Persona, generado por el titular.
Quien canjea el PIN (mediante invitación: el titular comparte el código, la
otra persona lo ingresa estando logueada en su propia cuenta) queda agregado
a `uidsConAcceso` de esa Persona, con acceso de solo lectura o
lectura+escritura según lo que eligió el titular — y esa Persona pasa a
aparecer también en el listado de "Mis personas" de quien canjeó el PIN. No
hace falta compartir la cuenta completa ni la contraseña.

Sirve tanto para el caso de arriba (hijo ↔ padres, cada uno con cuenta
propia) como para parejas o cuidadores que administran el perfil de un
adulto mayor.

## 6.1 Una cuenta por persona real

**Decisión tomada: opción liviana.** No se hace verificación de identidad
real (KYC) por ahora — queda descartada esa opción (costo por verificación +
integración con un proveedor externo aparte de Firebase).

Lo que sí se construye:

- Al registrarse, se pide el RUT/cédula de la persona (además de
  nombre/email). Se valida el formato y se guarda en `usuarios/{uid}` como
  `rut`. Reglas de Firestore + una Cloud Function en el flujo de registro
  bloquean que se cree una segunda cuenta con el mismo RUT — es una
  validación de unicidad, no una verificación contra un registro real: si
  alguien pone un RUT ajeno o inventado a propósito, el sistema no lo detecta.
- "Dato biométrico" = biometría **local del dispositivo** (Face
  ID/huella vía `@capacitor-community/biometric-auth` o similar), usada solo
  para desbloquear la app ya logueada en ese teléfono — no verifica que la
  persona sea realmente la dueña del RUT. Se ofrece como opción en
  Configuración, no como requisito para registrarse.

Una vez que esto esté construido, hay que reflejarlo en los Términos y
Condiciones y la Política de Privacidad (que se guarda el RUT, con qué base
legal, por cuánto tiempo, quién lo puede ver) — se redactan después de tener
el flujo de registro con RUT implementado, no antes.

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

## 8. Pantallas principales

- Login/registro
- Home: accesos rápidos (agregar persona, subir documento, ver agenda, ver
  medicamentos activos) + próximos eventos (vacunas/citas/medicamentos de los
  próximos días, de todas las personas)
- Listar personas (perfiles bajo la cuenta)
- Detalle de persona: datos básicos, accesos a Historial clínico /
  Calendario / Vacunas / Medicamentos / Documentos / Especialidades / Ficha QR
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
- Configuración de cuenta

## 9. Fuera de alcance explícito (para no inflar el MVP)

- Ningún tipo de cuenta profesional/clínica/negocio.
- Sin chat con terceros ni directorio público de profesionales.
- Sin reserva de horas con un tercero real — "citas" son autogestionadas por
  el propio usuario (equivalente a cuando, en el sistema original, el dueño
  agenda una cita él mismo, no la "reserva abierta" con un profesional
  externo).
- Integración real con Google Calendar (OAuth, sync bidireccional) queda
  para una fase posterior — el MVP exporta a `.ics` como paso intermedio.
