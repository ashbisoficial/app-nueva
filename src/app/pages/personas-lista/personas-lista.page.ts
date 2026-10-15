import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { User } from 'firebase/auth';
import { IonContent, IonIcon } from '@ionic/angular';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { PersonasService } from '../../services/personas.service';
import { BottomNavComponent } from '../../shared/bottom-nav/bottom-nav.component';
import { colorPersona, inicialPersona } from '../../shared/avatar';

@Component({
  selector: 'app-personas-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon, BottomNavComponent],
  templateUrl: './personas-lista.page.html',
  styleUrl: './personas-lista.page.scss',
})
export class PersonasListaPage {
  private auth = inject(AuthService);
  private personasSvc = inject(PersonasService);

  personas$ = toObservable(this.auth.usuario).pipe(
    filter((u): u is User => !!u),
    switchMap((u) => this.personasSvc.misPersonas$(u.uid))
  );

  readonly inicialPersona = inicialPersona;
  readonly colorPersona = colorPersona;
}
