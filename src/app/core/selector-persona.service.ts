import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { PersonasService } from '../services/personas.service';
import { nombreCompleto } from '../shared/persona-nombre';

/** Pide elegir una Persona de la cuenta cuando una acción rápida (Home, Agenda) no sabe para quién es. */
@Injectable({ providedIn: 'root' })
export class SelectorPersonaService {
  private personasSvc = inject(PersonasService);
  private alertCtrl = inject(AlertController);

  /** Devuelve el personaId elegido, o null si no hay personas o el usuario cancela. */
  async elegir(uid: string, titulo = '¿Para quién?'): Promise<string | null> {
    const personas = await new Promise<{ id: string; nombres?: string; apellidos?: string; nombre?: string }[]>(
      (resolve) => {
        const sub = this.personasSvc.misPersonas$(uid).subscribe((p) => {
          resolve(p);
          sub.unsubscribe();
        });
      }
    );

    if (personas.length === 0) {
      const alert = await this.alertCtrl.create({
        header: 'Agrega una persona primero',
        message: 'Necesitas tener al menos un perfil creado.',
        buttons: ['Aceptar'],
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
            label: nombreCompleto(p),
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
