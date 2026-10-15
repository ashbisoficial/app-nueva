import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
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
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  cambiarModo(modo: string | number | undefined): void {
    this.modo.set(modo === 'registro' ? 'registro' : 'login');
    this.error.set(null);
  }

  async enviar(): Promise<void> {
    this.error.set(null);
    this.cargando.set(true);
    try {
      if (this.modo() === 'registro') {
        await this.auth.registrar(this.email, this.password, this.nombre);
      } else {
        await this.auth.login(this.email, this.password);
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
    await this.router.navigateByUrl(usuario?.rut ? '/' : '/completar-registro');
  }

  private mensajeError(e: unknown): string {
    const code = (e as { code?: string })?.code ?? '';
    if (code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'Email o contraseña incorrectos.';
    }
    if (code.includes('email-already-in-use')) {
      return 'Ya existe una cuenta con ese email.';
    }
    if (code.includes('weak-password')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    return 'Ocurrió un error. Intenta de nuevo.';
  }
}
