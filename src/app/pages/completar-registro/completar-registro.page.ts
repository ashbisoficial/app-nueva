import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonInput, IonItem, IonList, IonSpinner, IonText } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { formatearRut, validarRut } from '../../core/rut';
import { MENSAJES, ValidacionFormulario, primerError, reglas } from '../../core/validadores';

@Component({
  selector: 'app-completar-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonList, IonItem, IonInput, IonButton, IonSpinner, IonText],
  templateUrl: './completar-registro.page.html',
  styleUrl: './completar-registro.page.scss',
})
export class CompletarRegistroPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  rut = '';
  cargando = signal(false);
  error = signal<string | null>(null);

  readonly v = new ValidacionFormulario({
    rut: () => primerError(reglas.requerido(this.rut), validarRut(this.rut) ? null : MENSAJES.rut),
  });

  onRutInput(valor: string): void {
    this.rut = formatearRut(valor);
    this.v.revalidar('rut');
  }

  async confirmar(): Promise<void> {
    this.error.set(null);
    if (!this.v.todo()) return;
    this.cargando.set(true);
    try {
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
