import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { User } from 'firebase/auth';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
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
import { PersonasService } from '../../services/personas.service';

@Component({
  selector: 'app-personas-lista',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonFab,
    IonFabButton,
  ],
  templateUrl: './personas-lista.page.html',
})
export class PersonasListaPage {
  private auth = inject(AuthService);
  private personasSvc = inject(PersonasService);

  personas$ = toObservable(this.auth.usuario).pipe(
    filter((u): u is User => !!u),
    switchMap((u) => this.personasSvc.misPersonas$(u.uid))
  );
}
