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
import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import { normalizarRut, validarRut } from './rut';
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

  /** uid de la sesión actual leído directamente del SDK, sin esperar a que el signal se actualice. */
  get uidActual(): string | undefined {
    return auth.currentUser?.uid;
  }

  async obtenerUsuario(uid: string): Promise<Usuario | undefined> {
    const snap = await getDoc(doc(db, 'usuarios', uid));
    return snap.exists() ? (snap.data() as Usuario) : undefined;
  }

  /**
   * Reclama un RUT para la cuenta logueada (sección 6.1 del spec): garantiza
   * que no exista otra cuenta con el mismo RUT. Se llama después de
   * registrarse o de un primer login con Google, no durante el registro en
   * sí — así el mismo código cubre ambos métodos de alta.
   */
  async reclamarRut(rut: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('sin-sesion');

    const rutNormalizado = normalizarRut(rut);
    if (!validarRut(rutNormalizado)) throw new Error('rut-invalido');

    const batch = writeBatch(db);
    batch.set(doc(db, 'rutsRegistrados', rutNormalizado), { uid: user.uid, creadoEn: serverTimestamp() });
    batch.set(doc(db, 'usuarios', user.uid), { rut: rutNormalizado }, { merge: true });

    try {
      await batch.commit();
    } catch {
      throw new Error('rut-duplicado');
    }
  }

  private async crearUsuarioFirestoreSiNoExiste(uid: string, email: string, nombre: string): Promise<void> {
    const ref = doc(db, 'usuarios', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    const usuario: Usuario = { uid, email, nombre, fechaRegistro: serverTimestamp() };
    await setDoc(ref, usuario);
  }
}
