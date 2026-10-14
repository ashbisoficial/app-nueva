import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

initializeApp();
const db = getFirestore();

function fechaDeManana(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function enviarPush(uid: string, titulo: string, cuerpo: string): Promise<void> {
  try {
    const usuarioSnap = await db.collection('usuarios').doc(uid).get();
    const token = usuarioSnap.data()?.['fcmToken'];
    if (!token) return;
    await getMessaging().send({ token, notification: { title: titulo, body: cuerpo } });
  } catch (error) {
    console.error(`No se pudo enviar push a ${uid}`, error);
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
        const persona = await db.collection('personas').doc(personaId).get();
        const uidTitular = persona.data()?.['uidTitular'];
        if (!uidTitular) continue;
        await enviarPush(
          uidTitular,
          'Vacuna próxima',
          `${persona.data()?.['nombre']}: ${doc.data()['tipo']} mañana.`
        );
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
        await enviarPush(cita['creadoPor'], 'Cita médica mañana', `${cita['titulo']} (${cita['personaNombre']})`);
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

const VALIDEZ_PIN_MS = 24 * 60 * 60 * 1000;

/**
 * Canjea un PIN de acceso compartido (sección 6 del spec). Corre con el Admin
 * SDK porque otorgar acceso a un perfil ajeno nunca puede depender solo del
 * cliente — ver sección 7 (reglas de seguridad).
 */
export const canjearPin = onCall<{ pin: string }>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Hay que iniciar sesión para canjear un PIN.');
  }

  const pin = (request.data?.pin ?? '').trim();
  if (!/^\d{6}$/.test(pin)) {
    throw new HttpsError('invalid-argument', 'El PIN debe tener 6 dígitos.');
  }

  const snap = await db.collection('personas').where('pinAccesoCompartido', '==', pin).limit(1).get();
  if (snap.empty) {
    throw new HttpsError('not-found', 'PIN inválido o vencido.');
  }

  const personaRef = snap.docs[0].ref;
  const persona = snap.docs[0].data();

  const generadoEn = persona['pinGeneradoEn']?.toMillis?.() ?? 0;
  if (Date.now() - generadoEn > VALIDEZ_PIN_MS) {
    throw new HttpsError('deadline-exceeded', 'Este PIN venció. Pedí uno nuevo.');
  }

  if (persona['uidTitular'] === request.auth.uid) {
    throw new HttpsError('failed-precondition', 'Ya sos el titular de este perfil.');
  }

  await personaRef.update({
    uidsConAcceso: FieldValue.arrayUnion(request.auth.uid),
  });

  return { personaId: personaRef.id, personaNombre: persona['nombre'] as string };
});
