import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

/** Evita que alguien ya logueado vuelva a ver la pantalla de login/registro. */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);

  return new Promise<boolean | UrlTree>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user ? router.parseUrl('/') : true);
    });
  });
};
