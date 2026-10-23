import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { MENSAJES, ValidacionFormulario, primerError, reglas } from '../../core/validadores';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonCheckbox,
    IonIcon,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonText,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  modo = signal<'login' | 'registro'>('login');
  email = '';
  password = '';
  nombre = '';
  aceptaTerminos = false;
  aceptaPrivacidad = false;
  cargando = signal(false);
  error = signal<string | null>(null);

  readonly v = new ValidacionFormulario({
    nombre: () =>
      this.modo() === 'registro' ? primerError(reglas.requerido(this.nombre), reglas.nombre(this.nombre)) : null,
    email: () => primerError(reglas.requerido(this.email), reglas.correo(this.email)),
    password: () =>
      primerError(
        reglas.requerido(this.password),
        // Al ingresar no se exige el largo: solo importa al crear la contraseña.
        this.modo() === 'registro' && this.password.length < 6 ? MENSAJES.contrasena : null
      ),
    terminos: () =>
      this.modo() === 'registro' && !this.aceptaTerminos ? 'Para crear la cuenta debes aceptar los Términos de Uso.' : null,
    privacidad: () =>
      this.modo() === 'registro' && !this.aceptaPrivacidad
        ? 'Para crear la cuenta debes aceptar la Política de Privacidad y el tratamiento de tus datos.'
        : null,
  });

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  cambiarModo(modo: string | number | undefined): void {
    this.modo.set(modo === 'registro' ? 'registro' : 'login');
    this.error.set(null);
    this.v.limpiar();
  }

  async enviar(): Promise<void> {
    this.error.set(null);
    if (!this.v.todo()) return;
    this.cargando.set(true);
    try {
      if (this.modo() === 'registro') {
        await this.auth.registrar(this.email.trim(), this.password, this.nombre.trim());
      } else {
        await this.auth.login(this.email.trim(), this.password);
      }
      await this.navegarSegunRut();
    } catch (e) {
      this.error.set(this.mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  async conGoogle(): Promise<void> {
    this.error.set(null);
    this.cargando.set(true);
    try {
      await this.auth.loginConGoogle();
      await this.navegarSegunRut();
    } catch (e) {
      this.error.set(this.mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  /** Si la cuenta todavía no tiene RUT (sección 6.1), hay que completarlo antes de entrar. */
  private async navegarSegunRut(): Promise<void> {
    const uid = this.auth.uidActual;
    const usuario = uid ? await this.auth.obtenerUsuario(uid) : undefined;
    await this.router.navigateByUrl(AuthService.registroIncompleto(usuario) ? '/completar-registro' : '/');
  }

  private mensajeError(e: unknown): string {
    const code = (e as { code?: string })?.code ?? '';
    if (code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('user-not-found')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (code.includes('email-already-in-use')) {
      return 'Ya existe una cuenta con ese correo. Prueba con "Ingresar".';
    }
    if (code.includes('invalid-email')) return MENSAJES.correo;
    if (code.includes('weak-password')) return MENSAJES.contrasena;
    if (code.includes('too-many-requests')) {
      return 'Demasiados intentos seguidos. Espera unos minutos e intenta de nuevo.';
    }
    if (code.includes('network-request-failed')) return 'No hay conexión a internet. Revísala e intenta de nuevo.';
    if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
      return 'Se cerró la ventana de Google antes de terminar. Intenta de nuevo.';
    }
    return 'Ocurrió un error. Intenta de nuevo.';
  }
}
