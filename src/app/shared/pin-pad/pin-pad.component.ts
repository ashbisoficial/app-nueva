import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/**
 * Teclado numérico reutilizable para el PIN de reingreso rápido (sección
 * 6.1 bis / Configuración → Seguridad): se usa tanto en la pantalla de
 * bloqueo como al crear/cambiar el PIN. Emite pinCompleto() cuando se
 * ingresaron `largo` dígitos; el padre decide qué hacer (verificar contra
 * el hash guardado, o pedir confirmación si se está creando uno nuevo).
 */
@Component({
  selector: 'app-pin-pad',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './pin-pad.component.html',
  styleUrl: './pin-pad.component.scss',
})
export class PinPadComponent {
  @Input() largo = 6;
  @Input() error = false;
  @Output() pinCompleto = new EventEmitter<string>();

  readonly digitos = signal<string>('');
  readonly teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'borrar'];

  tocar(tecla: string): void {
    if (tecla === '') return;
    if (tecla === 'borrar') {
      this.digitos.update((d) => d.slice(0, -1));
      return;
    }
    if (this.digitos().length >= this.largo) return;
    const nuevo = this.digitos() + tecla;
    this.digitos.set(nuevo);
    if (nuevo.length === this.largo) {
      this.pinCompleto.emit(nuevo);
      setTimeout(() => this.digitos.set(''), 150);
    }
  }

  limpiar(): void {
    this.digitos.set('');
  }
}
