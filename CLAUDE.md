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
