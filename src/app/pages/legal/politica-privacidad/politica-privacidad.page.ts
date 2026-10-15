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
import { POLITICA_PRIVACIDAD, ULTIMA_ACTUALIZACION } from '../contenido-legal';

@Component({
  selector: 'app-politica-privacidad',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent],
  templateUrl: './politica-privacidad.page.html',
  styleUrl: '../legal.page.scss',
})
export class PoliticaPrivacidadPage {
  readonly secciones = POLITICA_PRIVACIDAD;
  readonly ultimaActualizacion = ULTIMA_ACTUALIZACION;
}
