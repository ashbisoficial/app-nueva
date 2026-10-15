import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TERMINOS_USO, ULTIMA_ACTUALIZACION } from '../contenido-legal';

@Component({
  selector: 'app-terminos-uso',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent],
  templateUrl: './terminos-uso.page.html',
  styleUrl: '../legal.page.scss',
})
export class TerminosUsoPage {
  readonly secciones = TERMINOS_USO;
  readonly ultimaActualizacion = ULTIMA_ACTUALIZACION;
}
