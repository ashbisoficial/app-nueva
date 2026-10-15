import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { switchMap } from 'rxjs';
import { PersonasService } from '../../services/personas.service';

@Component({
  selector: 'app-persona-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
  ],
  templateUrl: './persona-detalle.page.html',
  styleUrl: './persona-detalle.page.scss',
})
export class PersonaDetallePage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private personasSvc = inject(PersonasService);
  private alertCtrl = inject(AlertController);

  personaId = this.route.snapshot.paramMap.get('id') ?? '';

  persona = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.personasSvc.persona$(params.get('id') ?? '')))
  );

  readonly modulos = [
    { label: 'Historial clínico', ruta: 'historial', icono: 'document-text-outline' },
    { label: 'Vacunas', ruta: 'vacunas', icono: 'medical-outline' },
    { label: 'Medicamentos activos', ruta: 'medicamentos', icono: 'medkit-outline' },
    { label: 'Exámenes', ruta: 'examenes', icono: 'flask-outline' },
    { label: 'Documentos', ruta: 'documentos', icono: 'folder-outline' },
    { label: 'Especialidades', ruta: 'especialidades', icono: 'pricetag-outline' },
    { label: 'Carnet de emergencia', ruta: 'ficha', icono: 'qr-code-outline' },
    { label: 'QR de pérdida', ruta: 'ficha-perdida', icono: 'alert-circle-outline' },
  ];

  async compartirPorPin(): Promise<void> {
    const pin = await this.personasSvc.generarPinCompartido(this.personaId);
    const alert = await this.alertCtrl.create({
      header: 'PIN de acceso compartido',
      message: `Comparte este código con la persona de confianza: <strong>${pin}</strong>. Lo puede canjear desde "Tengo un PIN" en el inicio. Es de un solo uso por generación: si generas uno nuevo, el anterior deja de servir.`,
      buttons: ['Listo'],
    });
    await alert.present();
  }

  async confirmarEliminar(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar persona',
      message: 'Se va a eliminar este perfil y dejará de verse en la cuenta. ¿Continuar?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.personasSvc.eliminar(this.personaId);
            await this.router.navigateByUrl('/personas');
          },
        },
      ],
    });
    await alert.present();
  }
}
