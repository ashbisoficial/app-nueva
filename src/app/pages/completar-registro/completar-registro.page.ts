import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonCheckbox, IonContent, IonInput, IonItem, IonList, IonSpinner, IonText } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { formatearRut, validarRut } from '../../core/rut';
import { MENSAJES, ValidacionFormulario, primerError, reglas } from '../../core/validadores';

@Component({
  selector: 'app-completar-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonList, IonItem, IonInput, IonButton, IonCheckbox, IonSpinner, IonText],
  templateUrl: './completar-registro.page.html',
  styleUrl: './completar-registro.page.scss',
})
export class CompletarRegistroPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  rut = '';
  cargando = signal(false);
  error = signal<string | null>(null);

  /** Qué falta del alta: cuentas de Google nuevas (sin RUT ni consentimiento) o cuentas antiguas (solo consentimiento). */
  pideRut = signal(true);
  pideConsentimiento = signal(true);
  aceptaTerminos = false;
  aceptaPrivacidad = false;

  readonly v = new ValidacionFormulario({
    rut: () =>
      this.pideRut() ? primerError(reglas.requerido(this.rut), validarRut(this.rut) ? null : MENSAJES.rut) : null,
    terminos: () =>
      this.pideConsentimiento() && !this.aceptaTerminos ? 'Debes aceptar los Términos de Uso para continuar.' : null,
    privacidad: () =>
      this.pideConsentimiento() && !this.aceptaPrivacidad
        ? 'Debes aceptar la Política de Privacidad y el tratamiento de tus datos para continuar.'
        : null,
  });

  constructor() {
    const uid = this.auth.uidActual;
    if (uid) {
      void this.auth.obtenerUsuario(uid).then((u) => {
        this.pideRut.set(!u?.rut);
        this.pideConsentimiento.set(!AuthService.consentimientoVigente(u));
        if (!AuthService.registroIncompleto(u)) void this.router.navigateByUrl('/');
      });
    }
  }

  onRutInput(valor: string): void {
    this.rut = formatearRut(valor);
    this.v.revalidar('rut');
  }

  async confirmar(): Promise<void> {
    this.error.set(null);
    if (!this.v.todo()) return;
    this.cargando.set(true);
    try {
      if (this.pideConsentimiento()) await this.auth.registrarConsentimiento();
      if (!this.pideRut()) {
        await this.router.navigateByUrl('/', { replaceUrl: true });
        return;
      }
      await this.auth.reclamarRut(this.rut);
      // Siguiente paso obligatorio del alta: los datos personales de "yo mismo/a".
      await this.router.navigate(['/personas/nueva'], { queryParams: { bienvenida: 1 }, replaceUrl: true });
    } catch (e) {
      const codigo = (e as Error).message;
      if (codigo === 'rut-invalido') {
        this.error.set(MENSAJES.rut);
      } else if (codigo === 'rut-duplicado') {
        this.error.set('Ya existe una cuenta registrada con este RUT.');
      } else {
        this.error.set('No se pudo guardar. Intenta de nuevo.');
      }
    } finally {
      this.cargando.set(false);
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
