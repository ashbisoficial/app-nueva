import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Único guard de la app: solo verifica "¿hay sesión?" — no distingue tipos de
 * cuenta porque no existen (sección 5 del spec). Espera a que Firebase Auth
 * resuelva el estado inicial antes de decidir, para no expulsar al usuario
 * en un refresh de página mientras el SDK todavía está cargando la sesión.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  return new Promise<boolean | UrlTree>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user ? true : router.parseUrl('/login'));
    });
  });
};
