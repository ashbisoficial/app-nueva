import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { User } from 'firebase/auth';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { HomeService } from '../../services/home.service';
import { PersonasService } from '../../services/personas.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  auth = inject(AuthService);
  private personasSvc = inject(PersonasService);
  private homeSvc = inject(HomeService);

  private usuario$ = toObservable(this.auth.usuario);

  personas$ = this.usuario$.pipe(
    filter((u): u is User => !!u),
    switchMap((u) => this.personasSvc.misPersonas$(u.uid))
  );

  eventos$ = this.usuario$.pipe(
    filter((u): u is User => !!u),
    switchMap((u) => this.homeSvc.proximosEventos$(u.uid))
  );

  async logout(): Promise<void> {
    await this.auth.logout();
  }

  iconoEvento(tipo: string): string {
    if (tipo === 'cita') return 'calendar-outline';
    if (tipo === 'vacuna') return 'medical-outline';
    return 'medkit-outline';
  }
}
