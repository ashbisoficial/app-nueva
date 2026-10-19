/*
 * Service worker de notificaciones push (Firebase Cloud Messaging, web).
 *
 * El SDK de Firebase registra este archivo en /firebase-messaging-sw.js al
 * pedir el token (core/push.service.ts). No importa el SDK de Firebase acá a
 * propósito: solo hace falta mostrar la notificación que manda la Cloud
 * Function (recordatoriosDiarios / enviarPushPrueba) y abrir la app al
 * tocarla, y así no hay que mantener sincronizada una versión del SDK
 * cargada desde un CDN.
 */
self.addEventListener('push', (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { notification: { title: 'Serangelia', body: event.data ? event.data.text() : '' } };
  }
  const notificacion = datos.notification || {};
  const url = (datos.data && datos.data.url) || (datos.fcmOptions && datos.fcmOptions.link) || '/';
  event.waitUntil(
    self.registration.showNotification(notificacion.title || 'Serangelia', {
      body: notificacion.body || '',
      icon: '/assets/icon/icono-192.png',
      badge: '/assets/icon/badge-96.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const ventana of ventanas) {
        if ('focus' in ventana) {
          ventana.navigate(url);
          return ventana.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
