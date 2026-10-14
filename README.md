# app-nueva

Sistema de gestión de salud personal/familiar — "versión humana" de Ashbis. Ver `CLAUDE.md` para la especificación técnica completa.

## Stack

Angular (standalone) + Ionic + Capacitor, con Firebase (Auth, Firestore, Storage, Functions, Cloud Messaging) como backend.

## Configuración inicial

1. Creá un proyecto en [Firebase Console](https://console.firebase.google.com/) y habilitá: Authentication (Email/Password + Google), Firestore, Storage y Cloud Messaging.
2. Copiá la configuración web del proyecto en `src/environments/environment.ts` y `src/environments/environment.prod.ts` (reemplazando los valores `REEMPLAZAR`).
3. Instalá dependencias:
   ```bash
   npm install
   npm --prefix functions install
   ```

## Desarrollo

```bash
npm start            # sirve la app en http://localhost:4200
```

## Build

```bash
npm run build                         # desarrollo
npx ng build --configuration production
```

El resultado queda en `dist/app-nueva/browser`.

## Deploy de Firebase (reglas, índices y funciones)

Requiere la [Firebase CLI](https://firebase.google.com/docs/cli) y estar logueado (`firebase login`) con el proyecto asociado (`firebase use --add`).

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
firebase deploy --only hosting   # sirve dist/app-nueva/browser, requiere build de producción previo
```

## Apps nativas (Capacitor)

El proyecto ya está inicializado con Capacitor (`capacitor.config.ts`). Para generar los proyectos nativos:

```bash
npx ng build --configuration production
npx cap add android
npx cap add ios
npx cap sync
npx cap open android   # o: npx cap open ios
```

## Estructura

- `src/app/models` — interfaces TypeScript del dominio (Persona, Entrada de historial, Vacuna, MedicamentoActivo, Cita, Examen, Documento, Especialidad).
- `src/app/core` — inicialización de Firebase, guards, helpers (QR, PDF, .ics, notificaciones locales).
- `src/app/services` — un servicio por colección/subcolección de Firestore.
- `src/app/pages` — una pantalla por carpeta (componentes standalone, lazy-loaded desde `app.routes.ts`).
- `firestore.rules` / `firestore.indexes.json` / `storage.rules` — reglas de seguridad e índices.
- `functions/` — Cloud Functions (`recordatoriosDiarios`, `canjearPin`).
