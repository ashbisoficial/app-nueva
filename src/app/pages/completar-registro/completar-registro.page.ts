import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonInput, IonItem, IonList, IonSpinner, IonText } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { formatearRut } from '../../core/rut';

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

  onRutInput(valor: string): void {
    this.rut = formatearRut(valor);
  }

  async confirmar(): Promise<void> {
    this.error.set(null);
    this.cargando.set(true);
    try {
      await this.auth.reclamarRut(this.rut);
      await this.router.navigateByUrl('/');
    } catch (e) {
      const codigo = (e as Error).message;
      if (codigo === 'rut-invalido') {
        this.error.set('Ese RUT no es válido. Revisa los números y el dígito verificador.');
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
