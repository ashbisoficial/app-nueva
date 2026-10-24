import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import {
  AVATAR_CABELLO_COLOR,
  AVATAR_PIEL,
  AVATAR_POR_DEFECTO,
  AVATAR_PREVIAS_BOCA,
  AVATAR_PREVIAS_CABELLO,
  AVATAR_PREVIAS_CEJAS,
  AVATAR_PREVIAS_LENTES,
  AVATAR_PREVIAS_OJOS,
  AVATAR_PREVIAS_ROPA,
  AVATAR_ROPA_COLOR,
  avatarDataUri,
} from '../../core/avatar-dicebear';
import type { AvatarOpciones } from '../../models';

type Pestana = 'piel' | 'cara' | 'cabello' | 'lentes' | 'ropa';

/**
 * Editor de avatar tipo Duolingo (sección 2.1/4.6 del spec): cada pestaña
 * elige una pieza (piel, cara, cabello, lentes, ropa) con la vista previa
 * grande arriba actualizándose al toque — sin texto en las opciones, se
 * elige "a ojo" viendo directamente cómo queda, igual que el editor de
 * Google Avatar. Se abre con ModalController desde persona-form.
 */
@Component({
  selector: 'app-editor-avatar',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent],
  templateUrl: './editor-avatar.component.html',
  styleUrl: './editor-avatar.component.scss',
})
export class EditorAvatarComponent {
  @Input() set valorInicial(v: AvatarOpciones | undefined) {
    this.opciones = { ...AVATAR_POR_DEFECTO, ...v };
  }

  private modalCtrl = inject(ModalController);

  opciones: AvatarOpciones = { ...AVATAR_POR_DEFECTO };
  pestana: Pestana = 'piel';

  readonly pestanas: { valor: Pestana; icono: string }[] = [
    { valor: 'piel', icono: 'body-outline' },
    { valor: 'cara', icono: 'happy-outline' },
    { valor: 'cabello', icono: 'cut-outline' },
    { valor: 'lentes', icono: 'glasses-outline' },
    { valor: 'ropa', icono: 'shirt-outline' },
  ];

  readonly catalogoPiel = AVATAR_PIEL;
  readonly catalogoCabelloColor = AVATAR_CABELLO_COLOR;
  readonly catalogoRopaColor = AVATAR_ROPA_COLOR;
  readonly previasCabello = AVATAR_PREVIAS_CABELLO;
  readonly previasOjos = AVATAR_PREVIAS_OJOS;
  readonly previasCejas = AVATAR_PREVIAS_CEJAS;
  readonly previasBoca = AVATAR_PREVIAS_BOCA;
  readonly previasLentes = AVATAR_PREVIAS_LENTES;
  readonly previasRopa = AVATAR_PREVIAS_ROPA;

  get vistaPrevia(): string {
    return avatarDataUri(this.opciones);
  }

  elegir<K extends keyof AvatarOpciones>(campo: K, valor: AvatarOpciones[K]): void {
    this.opciones = { ...this.opciones, [campo]: valor };
  }

  cerrar(): void {
    void this.modalCtrl.dismiss(null, 'cancelar');
  }

  confirmar(): void {
    void this.modalCtrl.dismiss(this.opciones, 'guardar');
  }
}
