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

  // QR / ficha de emergencia — equivalente a qrCarnetToken/qrPerdidaToken
  qrFichaToken?: string;            // token random, válido para siempre, enlaza a vista pública de solo lectura
  qrFichaCamposPublicos?: string[]; // opt-in: qué secciones se muestran al escanear (alergias, contacto, medicación — NUNCA el historial completo)

  pinAccesoCompartido?: string;    // opcional, ver sección 6 (compartir con persona de confianza)
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
  creadoPor, personaId, personaNombre  // denormalizado para mostrar en una agenda agregada de toda la familia
}
```

### 3.7 `personas/{id}/examenes/{id}` — exámenes programados/realizados

Distinto del resultado que vive en el historial.

```ts
{ id, tipo, fechaProgramada?, realizado?, fechaRealizado?, lugar?, notas?, ordenUrl?, resultadoUrl?, creadoPor }
```

### 3.8 `personas/{id}/documentos/{id}` — documentos sueltos

Documentos que no encajan como "entrada de historial" (carnet de vacunación
físico escaneado, seguro médico, certificados, etc.).

```ts
{ id, nombre, categoria: 'seguro'|'certificado'|'carnet'|'otro', archivoUrl, subidoEn, notas? }
```

## 4. Funcionalidades por módulo

### 4.1 Gestión de documentos

- Pantalla "Subir documento": elegir a qué Persona corresponde, categoría,
  archivo (foto con cámara o desde galería, o PDF), sube a Storage
  (`personas/{id}/documentos/...`), crea el registro en Firestore.
- El historial médico (3.3) también permite adjuntar un PDF/foto por entrada
  (resultado de examen, orden firmada escaneada).
- Listado filtrable por persona y por categoría; vista de detalle con el
  archivo embebido + metadata.

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

### 4.6 Carnet / ficha de emergencia (QR)

- Cada Persona tiene un `qrFichaToken` único y permanente.
- Vista pública (sin login) en `/ficha-publica/{token}`: muestra solo lo que
  el titular marcó como público en `qrFichaCamposPublicos` (opt-in explícito,
  nunca mostrar el historial clínico completo) — típicamente: nombre, grupo
  sanguíneo, alergias, medicación crónica, contacto de emergencia.
- Generación de PDF de carnet descargable/imprimible (jsPDF, 100%
  client-side) con esos mismos datos + el QR embebido, para llevarlo
  físicamente o guardarlo en el teléfono.
- Casos de uso: emergencia médica donde la persona no puede hablar, llevarlo
  a la escuela/trabajo, etc.

## 5. Autenticación y estructura de cuenta

- Firebase Auth: email/contraseña + Google Sign-In (OAuth).
- Una sola colección de usuarios, sin campo de rol. El `authGuard` de rutas
  solo verifica "¿hay sesión?", no distingue tipos de cuenta.
- Cada usuario ve solo sus propias Personas (`where uidTitular == miUid`)
  salvo que use el mecanismo de compartir (sección 6).

## 6. Compartir un perfil con otra persona (opcional)

Útil para parejas/cuidadores. Reutilizando la idea de "co-dueño" del sistema
original pero renombrada: un `pinAccesoCompartido` de 6 dígitos por Persona,
generado por el titular. Quien tenga el PIN puede pedir acceso de solo
lectura (o lectura+escritura, a elección del titular) a esa ficha concreta,
sin necesitar que el titular comparta la cuenta completa — útil, por ejemplo,
para que ambos padres administren el perfil de un hijo, o un cuidador de un
adulto mayor pueda ver/cargar información sin tener la contraseña de la
cuenta principal.

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
  Calendario / Vacunas / Medicamentos / Documentos / Ficha QR
- Historial clínico: timeline de entradas, botón "Nueva entrada" con
  selector de tipo (consulta/receta/vacunación/examen/cirugía/indicaciones de
  alta/solicitud de examen) que cambia los campos del formulario
  dinámicamente
- Calendario (compartido, todas las personas)
- Detalle de cita
- Mis medicamentos (tratamientos activos + historial de tomas)
- Subir documento
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
