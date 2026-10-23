import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

initializeApp();
const db = getFirestore();

function fechaDeManana(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Nombre mostrable de una Persona (misma lógica que shared/persona-nombre.ts del cliente). */
function nombrePersona(persona: FirebaseFirestore.DocumentData | undefined): string {
  if (!persona) return '';
  const completo = [persona['nombres'], persona['apellidos']]
    .filter((p: unknown) => typeof p === 'string' && p.trim())
    .join(' ')
    .trim();
  return completo || ((persona['nombre'] as string | undefined) ?? '');
}

/**
 * Tokens FCM del usuario: `fcmTokens` (uno por dispositivo/navegador donde
 * activó las notificaciones) + el campo legado `fcmToken`.
 */
function tokensDe(usuario: FirebaseFirestore.DocumentData | undefined): string[] {
  const tokens = new Set<string>(Array.isArray(usuario?.['fcmTokens']) ? usuario['fcmTokens'] : []);
  if (typeof usuario?.['fcmToken'] === 'string') tokens.add(usuario['fcmToken']);
  return [...tokens];
}

/** Envía un push a todos los dispositivos del usuario y limpia los tokens que ya no sirven. */
async function enviarPush(uid: string, titulo: string, cuerpo: string, url = '/'): Promise<number> {
  try {
    const ref = db.collection('usuarios').doc(uid);
    const tokens = tokensDe((await ref.get()).data());
    if (!tokens.length) return 0;
    const respuesta = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title: titulo, body: cuerpo },
      webpush: { fcmOptions: { link: url }, notification: { icon: '/assets/icon/icono-192.png' } },
      data: { url },
    });
    const invalidos = respuesta.responses
      .map((r, i) => (!r.success && /registration-token-not-registered|invalid-argument|invalid-registration-token/.test(r.error?.code ?? '') ? tokens[i] : null))
      .filter((t): t is string => !!t);
    if (invalidos.length) await ref.update({ fcmTokens: FieldValue.arrayRemove(...invalidos) });
    return respuesta.successCount;
  } catch (error) {
    console.error(`No se pudo enviar push a ${uid}`, error);
    return 0;
  }
}

/**
 * Capa 2 de recordatorios (sección 4.5 del spec): corre una vez al día y barre
 * TODAS las subcolecciones vacunas/citas/medicamentosActivos de TODAS las
 * personas de TODOS los usuarios con collectionGroup, en vez de iterar usuario
 * por usuario. Cada ítem se procesa en su propio try/catch para que un fallo
 * puntual no corte el resto del lote.
 */
export const recordatoriosDiarios = onSchedule(
  { schedule: 'every day 09:00', timeZone: 'America/Santiago' },
  async () => {
    const fecha = fechaDeManana();

    const vacunasSnap = await db.collectionGroup('vacunas').where('proximaFecha', '==', fecha).get();
    for (const doc of vacunasSnap.docs) {
      try {
        const personaId = doc.ref.parent.parent?.id;
        if (!personaId) continue;
        const persona = (await db.collection('personas').doc(personaId).get()).data();
        const uidTitular = persona?.['uidTitular'];
        if (!uidTitular) continue;
        await enviarPush(uidTitular, 'Vacuna mañana', `${nombrePersona(persona)}: ${doc.data()['tipo']}.`, `/personas/${personaId}/vacunas`);
      } catch (error) {
        console.error('Error procesando recordatorio de vacuna', doc.id, error);
      }
    }

    const inicioDia = `${fecha}T00:00`;
    const finDia = `${fecha}T23:59`;
    const citasSnap = await db
      .collectionGroup('citas')
      .where('fechaInicio', '>=', inicioDia)
      .where('fechaInicio', '<=', finDia)
      .get();
    for (const doc of citasSnap.docs) {
      try {
        const cita = doc.data();
        const hora = String(cita['fechaInicio']).slice(11, 16);
        await enviarPush(
          cita['creadoPor'],
          'Cita médica mañana',
          `${cita['titulo']}${hora ? ` a las ${hora}` : ''} (${cita['personaNombre']})`,
          '/agenda'
        );
      } catch (error) {
        console.error('Error procesando recordatorio de cita', doc.id, error);
      }
    }

    const medsSnap = await db.collectionGroup('medicamentosActivos').where('fechaFin', '==', fecha).get();
    for (const doc of medsSnap.docs) {
      try {
        const med = doc.data();
        await enviarPush(med['creadoPor'], 'Tratamiento por terminar', `${med['nombre']} termina mañana.`);
      } catch (error) {
        console.error('Error procesando fin de tratamiento', doc.id, error);
      }
    }
  }
);

/** Botón "Enviar notificación de prueba" de Ajustes: confirma que este dispositivo recibe avisos. */
export const enviarPushPrueba = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Hay que iniciar sesión.');
  const enviados = await enviarPush(
    request.auth.uid,
    'Notificaciones activadas',
    'Así te van a llegar los recordatorios de citas, vacunas y tratamientos.',
    '/configuracion'
  );
  if (!enviados) {
    throw new HttpsError('failed-precondition', 'No hay ningún dispositivo con notificaciones activas en tu cuenta.');
  }
  return { enviados };
});

/**
 * Canjea un PIN de acceso compartido (sección 6 del spec). Corre con el Admin
 * SDK porque otorgar acceso a un perfil ajeno nunca puede depender solo del
 * cliente — ver sección 7 (reglas de seguridad).
 *
 * Cada PIN vive en pinesAcceso/{pin} (solo lo puede leer el titular que lo
 * generó, nunca quien ya tiene acceso compartido — así nadie puede reenviar un
 * PIN ajeno) con vencimiento (`expiraEn`) y límite de usos (`usosMax`): cada
 * canje suma un uso dentro de una transacción, y al llegar al límite el PIN
 * se borra. Canjear de nuevo un perfil al que ya se tiene acceso no gasta un uso.
 */
export const canjearPin = onCall<{ pin: string }>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Hay que iniciar sesión para canjear un PIN.');
  }
  const uid = request.auth.uid;

  const pin = (request.data?.pin ?? '').trim();
  if (!/^\d{6}$/.test(pin)) {
    throw new HttpsError('invalid-argument', 'El PIN debe tener 6 dígitos.');
  }

  const pinRef = db.collection('pinesAcceso').doc(pin);
  return db.runTransaction(async (tx) => {
    const pinSnap = await tx.get(pinRef);
    if (!pinSnap.exists) throw new HttpsError('not-found', 'PIN inválido o vencido.');
    const datos = pinSnap.data()!;

    const expiraEn = (datos['expiraEn'] as Timestamp | undefined)?.toMillis() ?? 0;
    if (Date.now() > expiraEn) {
      tx.delete(pinRef);
      throw new HttpsError('deadline-exceeded', 'Este PIN venció. Pide uno nuevo.');
    }

    const personaRef = db.collection('personas').doc(datos['personaId']);
    const personaSnap = await tx.get(personaRef);
    if (!personaSnap.exists) {
      tx.delete(pinRef);
      throw new HttpsError('not-found', 'El perfil de este PIN ya no existe.');
    }
    const persona = personaSnap.data()!;
    if (persona['uidTitular'] === uid) {
      throw new HttpsError('failed-precondition', 'Ya eres el titular de este perfil.');
    }

    const yaTeniaAcceso = (persona['uidsConAcceso'] ?? []).includes(uid);
    if (!yaTeniaAcceso) {
      const usos = (datos['usos'] ?? 0) + 1;
      const usosMax = datos['usosMax'] ?? 1;
      tx.update(personaRef, {
        uidsConAcceso: FieldValue.arrayUnion(uid),
        modoAccesoCompartido: datos['modo'] === 'escritura' ? 'escritura' : 'lectura',
      });
      if (usos >= usosMax) tx.delete(pinRef);
      else tx.update(pinRef, { usos });
    }

    return { personaId: personaRef.id, personaNombre: nombrePersona(persona) };
  });
});

/** Campos que se pueden exponer en cada QR público (sección 4.6) — nunca dirección, historial ni archivos. */
const CAMPOS_EMERGENCIA = [
  'nombre',
  'fechaNacimiento',
  'grupoSanguineo',
  'alergias',
  'enfermedadesCronicas',
  'medicamentosPermanentes',
  'pesoKg',
  'estaturaCm',
  'dispositivosMedicos',
  'donanteOrganos',
  'prevision',
  'medicoTratante',
  'telefonoMedicoTratante',
  'notasEmergencia',
  'contactoEmergencia',
  'telefonoEmergencia',
];
const CAMPOS_PERDIDA = ['nombre', 'fotoUrl', 'condicionPerdida', 'contactoEmergencia', 'telefonoEmergencia'];

/**
 * Vista pública de un QR (carnet de emergencia o QR de pérdida), sin login.
 * Antes la página pública leía el documento de la Persona directo desde el
 * cliente, lo que (a) no funcionaba para alguien sin sesión — las reglas
 * exigen estar autenticado — y (b) de haberse permitido, habría expuesto el
 * documento completo. Esta función devuelve SOLO los campos que el titular
 * marcó como públicos para ese QR.
 */
export const fichaPublica = onCall<{ token: string; tipo: 'emergencia' | 'perdida' }>(async (request) => {
  const token = String(request.data?.token ?? '');
  const tipo = request.data?.tipo === 'perdida' ? 'perdida' : 'emergencia';
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) throw new HttpsError('invalid-argument', 'Código inválido.');

  const campoToken = tipo === 'perdida' ? 'qrPerdidaToken' : 'qrFichaToken';
  const campoLista = tipo === 'perdida' ? 'qrPerdidaCamposPublicos' : 'qrFichaCamposPublicos';
  const permitidos = tipo === 'perdida' ? CAMPOS_PERDIDA : CAMPOS_EMERGENCIA;

  const snap = await db.collection('personas').where(campoToken, '==', token).limit(1).get();
  if (snap.empty) return { persona: null };
  const p = snap.docs[0].data();

  const elegidos: string[] = (Array.isArray(p[campoLista]) ? p[campoLista] : []).filter((c: string) =>
    permitidos.includes(c)
  );
  const publica: Record<string, unknown> = { [campoLista]: elegidos };
  for (const campo of elegidos) {
    if (campo === 'nombre') {
      publica['nombres'] = p['nombres'] ?? '';
      publica['apellidos'] = p['apellidos'] ?? '';
      if (p['nombre']) publica['nombre'] = p['nombre'];
    } else if (p[campo] !== undefined) {
      publica[campo] = p[campo];
    }
  }
  if (elegidos.includes('contactoEmergencia') && p['contactoEmergenciaParentesco']) {
    publica['contactoEmergenciaParentesco'] = p['contactoEmergenciaParentesco'];
  }
  return { persona: publica };
});

// ---------------------------------------------------------------------------
// Suscripción de calendario (.ics)
// ---------------------------------------------------------------------------

function escaparIcs(texto: string): string {
  return texto.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** "2026-10-24T10:30" → "20261024T103000" (hora local de Chile, con TZID). */
function fechaHoraIcs(iso: string): string {
  return iso.replace(/[-:]/g, '').slice(0, 13).padEnd(13, '0') + '00';
}

function fechaIcs(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

function diaSiguiente(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Feed de calendario por cuenta: /calendario/{token}.ics (rewrite de Hosting).
 * Permite "suscribirse" desde Google Calendar (u otra app) con un enlace, sin
 * OAuth: Google vuelve a leer este feed cada algunas horas. El token es
 * secreto y propio de la cuenta (usuarios/{uid}.calendarioToken); generar uno
 * nuevo desde Ajustes invalida el enlace anterior. Incluye citas, próximas
 * dosis de vacunas y fin de tratamientos de todas las personas que ve la
 * cuenta (propias y compartidas por PIN).
 */
export const calendarioIcs = onRequest({ cors: false }, async (req, res) => {
  const coincidencia = /\/calendario\/([A-Za-z0-9_-]{16,64})(\.ics)?$/.exec(req.path);
  if (!coincidencia) {
    res.status(404).send('No encontrado');
    return;
  }
  const usuarios = await db.collection('usuarios').where('calendarioToken', '==', coincidencia[1]).limit(1).get();
  if (usuarios.empty) {
    res.status(404).send('Este enlace de calendario ya no es válido.');
    return;
  }
  const uid = usuarios.docs[0].id;

  const [propias, compartidas] = await Promise.all([
    db.collection('personas').where('uidTitular', '==', uid).get(),
    db.collection('personas').where('uidsConAcceso', 'array-contains', uid).get(),
  ]);
  const personas = [...propias.docs, ...compartidas.docs];

  const ahora = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const eventos: string[] = [];
  const agregar = (lineas: string[]) => eventos.push(['BEGIN:VEVENT', `DTSTAMP:${ahora}`, ...lineas, 'END:VEVENT'].join('\r\n'));

  for (const persona of personas) {
    const nombre = nombrePersona(persona.data()).split(' ')[0] ?? '';
    const [citas, vacunas, meds] = await Promise.all([
      persona.ref.collection('citas').get(),
      persona.ref.collection('vacunas').get(),
      persona.ref.collection('medicamentosActivos').get(),
    ]);
    for (const c of citas.docs) {
      const cita = c.data();
      if (!cita['fechaInicio']) continue;
      const lineas = [
        `UID:cita-${c.id}@serangelia`,
        `SUMMARY:${escaparIcs(`${cita['titulo']}${nombre ? ` (${nombre})` : ''}`)}`,
        `DTSTART;TZID=America/Santiago:${fechaHoraIcs(cita['fechaInicio'])}`,
        cita['fechaFin']
          ? `DTEND;TZID=America/Santiago:${fechaHoraIcs(cita['fechaFin'])}`
          : 'DURATION:PT1H',
      ];
      if (cita['lugar']) lineas.push(`LOCATION:${escaparIcs(cita['lugar'])}`);
      agregar(lineas);
    }
    for (const v of vacunas.docs) {
      const vacuna = v.data();
      if (!vacuna['proximaFecha']) continue;
      agregar([
        `UID:vacuna-${v.id}@serangelia`,
        `SUMMARY:${escaparIcs(`Vacuna: ${vacuna['tipo']}${nombre ? ` (${nombre})` : ''}`)}`,
        `DTSTART;VALUE=DATE:${fechaIcs(vacuna['proximaFecha'])}`,
        `DTEND;VALUE=DATE:${diaSiguiente(vacuna['proximaFecha'])}`,
      ]);
    }
    for (const m of meds.docs) {
      const med = m.data();
      if (!med['fechaFin']) continue;
      agregar([
        `UID:fin-${m.id}@serangelia`,
        `SUMMARY:${escaparIcs(`Termina tratamiento: ${med['nombre']}${nombre ? ` (${nombre})` : ''}`)}`,
        `DTSTART;VALUE=DATE:${fechaIcs(med['fechaFin'])}`,
        `DTEND;VALUE=DATE:${diaSiguiente(med['fechaFin'])}`,
      ]);
    }
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Serangelia//Agenda//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Serangelia',
    'X-WR-TIMEZONE:America/Santiago',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
    ...eventos,
    'END:VCALENDAR',
  ].join('\r\n');

  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Cache-Control', 'private, max-age=900');
  res.status(200).send(ics);
});
