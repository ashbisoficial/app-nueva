import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'ficha-publica/:token',
    loadComponent: () => import('./pages/ficha-publica/ficha-publica.page').then((m) => m.FichaPublicaPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'configuracion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/configuracion/configuracion.page').then((m) => m.ConfiguracionPage),
  },
  {
    path: 'canjear-pin',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/canjear-pin/canjear-pin.page').then((m) => m.CanjearPinPage),
  },
  {
    path: 'agenda',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/agenda/agenda.page').then((m) => m.AgendaPage),
  },
  {
    path: 'agenda/:personaId/nueva',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cita-form/cita-form.page').then((m) => m.CitaFormPage),
  },
  {
    path: 'agenda/:personaId/:citaId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cita-form/cita-form.page').then((m) => m.CitaFormPage),
  },
  {
    path: 'personas',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/personas-lista/personas-lista.page').then((m) => m.PersonasListaPage),
  },
  {
    path: 'personas/nueva',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/persona-form/persona-form.page').then((m) => m.PersonaFormPage),
  },
  {
    path: 'personas/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/persona-detalle/persona-detalle.page').then((m) => m.PersonaDetallePage),
  },
  {
    path: 'personas/:id/editar',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/persona-form/persona-form.page').then((m) => m.PersonaFormPage),
  },
  {
    path: 'personas/:id/historial',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/historial/historial.page').then((m) => m.HistorialPage),
  },
  {
    path: 'personas/:id/historial/nueva',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/historial-nueva/historial-nueva.page').then((m) => m.HistorialNuevaPage),
  },
  {
    path: 'personas/:id/vacunas',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/vacunas/vacunas.page').then((m) => m.VacunasPage),
  },
  {
    path: 'personas/:id/medicamentos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/medicamentos/medicamentos.page').then((m) => m.MedicamentosPage),
  },
  {
    path: 'personas/:id/examenes',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/examenes/examenes.page').then((m) => m.ExamenesPage),
  },
  {
    path: 'personas/:id/documentos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/documentos/documentos.page').then((m) => m.DocumentosPage),
  },
  {
    path: 'personas/:id/especialidades',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/especialidades/especialidades.page').then((m) => m.EspecialidadesPage),
  },
  {
    path: 'personas/:id/especialidades/:especialidadId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/especialidad-carpeta/especialidad-carpeta.page').then((m) => m.EspecialidadCarpetaPage),
  },
  {
    path: 'personas/:id/ficha',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ficha-emergencia/ficha-emergencia.page').then((m) => m.FichaEmergenciaPage),
  },
  { path: '**', redirectTo: '' },
];
