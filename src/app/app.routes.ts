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
    path: 'privacidad',
    loadComponent: () =>
      import('./pages/legal/politica-privacidad/politica-privacidad.page').then((m) => m.PoliticaPrivacidadPage),
  },
  {
    path: 'terminos',
    loadComponent: () => import('./pages/legal/terminos-uso/terminos-uso.page').then((m) => m.TerminosUsoPage),
  },
  {
    path: 'ficha-publica/:token',
    loadComponent: () => import('./pages/ficha-publica/ficha-publica.page').then((m) => m.FichaPublicaPage),
  },
  {
    path: 'ficha-perdida/:token',
    loadComponent: () => import('./pages/ficha-perdida/ficha-perdida.page').then((m) => m.FichaPerdidaPage),
  },
  {
    path: 'completar-registro',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/completar-registro/completar-registro.page').then((m) => m.CompletarRegistroPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./pages/configuracion/configuracion.page').then((m) => m.ConfiguracionPage),
      },
      {
        path: 'canjear-pin',
        loadComponent: () => import('./pages/canjear-pin/canjear-pin.page').then((m) => m.CanjearPinPage),
      },
      {
        path: 'agenda',
        loadComponent: () => import('./pages/agenda/agenda.page').then((m) => m.AgendaPage),
      },
      {
        path: 'agenda/:personaId/nueva',
        loadComponent: () => import('./pages/cita-form/cita-form.page').then((m) => m.CitaFormPage),
      },
      {
        path: 'agenda/:personaId/:citaId',
        loadComponent: () => import('./pages/cita-form/cita-form.page').then((m) => m.CitaFormPage),
      },
      {
        path: 'personas',
        loadComponent: () =>
          import('./pages/personas-lista/personas-lista.page').then((m) => m.PersonasListaPage),
      },
      {
        path: 'personas/nueva',
        loadComponent: () => import('./pages/persona-form/persona-form.page').then((m) => m.PersonaFormPage),
      },
      {
        path: 'personas/:id',
        loadComponent: () =>
          import('./pages/persona-detalle/persona-detalle.page').then((m) => m.PersonaDetallePage),
      },
      {
        path: 'personas/:id/editar',
        loadComponent: () => import('./pages/persona-form/persona-form.page').then((m) => m.PersonaFormPage),
      },
      {
        path: 'personas/:id/historial',
        loadComponent: () => import('./pages/historial/historial.page').then((m) => m.HistorialPage),
      },
      {
        path: 'personas/:id/historial/nueva',
        loadComponent: () =>
          import('./pages/historial-nueva/historial-nueva.page').then((m) => m.HistorialNuevaPage),
      },
      {
        path: 'personas/:id/vacunas',
        loadComponent: () => import('./pages/vacunas/vacunas.page').then((m) => m.VacunasPage),
      },
      {
        path: 'personas/:id/medicamentos',
        loadComponent: () => import('./pages/medicamentos/medicamentos.page').then((m) => m.MedicamentosPage),
      },
      {
        path: 'personas/:id/examenes',
        loadComponent: () => import('./pages/examenes/examenes.page').then((m) => m.ExamenesPage),
      },
      {
        path: 'personas/:id/documentos',
        loadComponent: () => import('./pages/documentos/documentos.page').then((m) => m.DocumentosPage),
      },
      {
        path: 'personas/:id/especialidades',
        loadComponent: () =>
          import('./pages/especialidades/especialidades.page').then((m) => m.EspecialidadesPage),
      },
      {
        path: 'personas/:id/especialidades/:especialidadId',
        loadComponent: () =>
          import('./pages/especialidad-carpeta/especialidad-carpeta.page').then((m) => m.EspecialidadCarpetaPage),
      },
      {
        path: 'personas/:id/ficha',
        loadComponent: () =>
          import('./pages/ficha-emergencia/ficha-emergencia.page').then((m) => m.FichaEmergenciaPage),
      },
      {
        path: 'personas/:id/ficha-perdida',
        loadComponent: () =>
          import('./pages/ficha-perdida-config/ficha-perdida-config.page').then(
            (m) => m.FichaPerdidaConfigPage
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
