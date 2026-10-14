import { Injectable, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly usuario = signal<User | null>(null);
  /** true mientras Firebase todavía no resolvió si hay sesión o no */
  readonly cargandoSesion = signal(true);

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.usuario.set(user);
      this.cargandoSesion.set(false);
    });
  }

  async registrar(email: string, password: string, nombre: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: nombre });
    await this.crearUsuarioFirestoreSiNoExiste(cred.user.uid, email, nombre);
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async loginConGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await this.crearUsuarioFirestoreSiNoExiste(
      cred.user.uid,
      cred.user.email ?? '',
      cred.user.displayName ?? ''
    );
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  private async crearUsuarioFirestoreSiNoExiste(uid: string, email: string, nombre: string): Promise<void> {
    const ref = doc(db, 'usuarios', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    const usuario: Usuario = { uid, email, nombre, fechaRegistro: serverTimestamp() };
    await setDoc(ref, usuario);
  }
}
