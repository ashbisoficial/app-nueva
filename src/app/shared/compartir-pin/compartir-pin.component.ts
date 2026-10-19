import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import type { PinAcceso } from '../../models';
import { PersonasService } from '../../services/personas.service';

interface Opcion<T> {
  valor: T;
  etiqueta: string;
}

/**
 * "Compartir perfil" (sección 6): genera un PIN de 6 dígitos con permiso,
 * vencimiento y límite de usos, y lo comparte por WhatsApp, por el menú de
 * compartir del sistema o copiándolo. Se abre con ModalController desde el
 * detalle de la Persona y desde "Datos personales".
 */
@Component({
  selector: 'app-compartir-pin',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, IonSpinner],
  templateUrl: './compartir-pin.component.html',
  styleUrl: './compartir-pin.component.scss',
})
export class CompartirPinComponent implements OnInit {
  @Input({ required: true }) personaId = '';
  @Input() personaNombre = '';

  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private auth = inject(AuthService);
  private personasSvc = inject(PersonasService);

  readonly permisos: Opcion<'lectura' | 'escritura'>[] = [
    { valor: 'lectura', etiqueta: 'Solo ver' },
    { valor: 'escritura', etiqueta: 'Ver y agregar datos' },
  ];
  readonly vigencias: Opcion<number>[] = [
    { valor: 1, etiqueta: '1 hora' },
    { valor: 24, etiqueta: '24 horas' },
    { valor: 24 * 7, etiqueta: '7 días' },
  ];
  readonly usos: Opcion<number>[] = [
    { valor: 1, etiqueta: '1 persona' },
    { valor: 3, etiqueta: '3 personas' },
    { valor: 5, etiqueta: '5 personas' },
  ];

  modo = signal<'lectura' | 'escritura'>('lectura');
  horas = signal(24);
  usosMax = signal(1);

  cargando = signal(true);
  generando = signal(false);
  error = signal<string | null>(null);
  pin = signal<PinAcceso | null>(null);

  readonly puedeCompartirNativo = typeof navigator !== 'undefined' && 'share' in navigator;

  async ngOnInit(): Promise<void> {
    const uid = this.auth.uidActual;
    try {
      if (uid) this.pin.set(await this.personasSvc.pinVigente(this.personaId, uid));
    } catch {
      // Sin PIN vigente legible: se muestra el formulario para generar uno.
    } finally {
      this.cargando.set(false);
    }
  }

  cerrar(): void {
    void this.modalCtrl.dismiss();
  }

  async generar(): Promise<void> {
    const uid = this.auth.uidActual;
    if (!uid) return;
    this.error.set(null);
    this.generando.set(true);
    try {
      this.pin.set(
        await this.personasSvc.crearPin(this.personaId, uid, {
          modo: this.modo(),
          horas: this.horas(),
          usosMax: this.usosMax(),
        })
      );
    } catch {
      this.error.set('No se pudo generar el PIN. Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.generando.set(false);
    }
  }

  async revocar(): Promise<void> {
    const pin = this.pin();
    if (!pin) return;
    const alert = await this.alertCtrl.create({
      header: 'Anular PIN',
      message: 'El código dejará de funcionar de inmediato. Quienes ya lo usaron mantienen su acceso.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Anular',
          role: 'destructive',
          handler: async () => {
            await this.personasSvc.revocarPin(pin.pin);
            this.pin.set(null);
          },
        },
      ],
    });
    await alert.present();
  }

  nuevoPin(): void {
    this.pin.set(null);
  }

  /** Dígitos del PIN separados en dos grupos de 3, para leerlo/dictarlo más fácil. */
  grupos(pin: string): string[] {
    return [pin.slice(0, 3), pin.slice(3)];
  }

  private enlace(pin: string): string {
    return `${window.location.origin}/canjear-pin?pin=${pin}`;
  }

  textoParaCompartir(p: PinAcceso): string {
    const vence = p.expiraEn.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
    const restantes = p.usosMax - p.usos;
    const quien = this.personaNombre ? `el perfil de salud de ${this.personaNombre}` : 'un perfil de salud';
    return [
      `Te comparto ${quien} en Serangelia.`,
      '',
      `1. Abre este enlace: ${this.enlace(p.pin)}`,
      '2. Inicia sesión o crea tu cuenta.',
      `3. Ingresa el PIN: ${p.pin}`,
      '',
      `Vence el ${vence} y sirve para ${restantes === 1 ? '1 persona' : `${restantes} personas`}.`,
    ].join('\n');
  }

  compartirWhatsApp(p: PinAcceso): void {
    window.open(`https://wa.me/?text=${encodeURIComponent(this.textoParaCompartir(p))}`, '_blank', 'noopener');
  }

  async compartirNativo(p: PinAcceso): Promise<void> {
    try {
      await navigator.share({ title: 'PIN de Serangelia', text: this.textoParaCompartir(p) });
    } catch {
      // El usuario cerró el menú de compartir: no es un error.
    }
  }

  async copiar(p: PinAcceso): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.textoParaCompartir(p));
      await this.aviso('Mensaje con el PIN copiado. Pégalo donde quieras enviarlo.');
    } catch {
      await this.aviso(`No se pudo copiar. El PIN es ${p.pin}.`);
    }
  }

  private async aviso(mensaje: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, position: 'bottom' });
    await toast.present();
  }
}
