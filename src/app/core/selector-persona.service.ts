import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { PersonasService } from '../services/personas.service';

/** Pide elegir una Persona de la cuenta cuando una acción rápida (Home, Agenda) no sabe para quién es. */
@Injectable({ providedIn: 'root' })
export class SelectorPersonaService {
  private personasSvc = inject(PersonasService);
  private alertCtrl = inject(AlertController);

  /** Devuelve el personaId elegido, o null si no hay personas o el usuario cancela. */
  async elegir(uid: string, titulo = '¿Para quién?'): Promise<string | null> {
    const personas = await new Promise<{ id: string; nombre: string }[]>((resolve) => {
      const sub = this.personasSvc.misPersonas$(uid).subscribe((p) => {
        resolve(p);
        sub.unsubscribe();
      });
    });

    if (personas.length === 0) {
      const alert = await this.alertCtrl.create({
        header: 'Agregá una persona primero',
        message: 'Necesitás tener al menos un perfil creado.',
        buttons: ['Ok'],
      });
      await alert.present();
      return null;
    }

    if (personas.length === 1) return personas[0].id;

    return new Promise<string | null>((resolve) => {
      this.alertCtrl
        .create({
          header: titulo,
          inputs: personas.map((p, i) => ({
            type: 'radio' as const,
            label: p.nombre,
            value: p.id,
            checked: i === 0,
          })),
          buttons: [
            { text: 'Cancelar', role: 'cancel', handler: () => resolve(null) },
            { text: 'Continuar', handler: (personaId: string) => resolve(personaId) },
          ],
        })
        .then((alert) => alert.present());
    });
  }
}
