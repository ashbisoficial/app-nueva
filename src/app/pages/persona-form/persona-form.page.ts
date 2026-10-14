import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import type { Persona } from '../../models';
import { PersonasService } from '../../services/personas.service';

@Component({
  selector: 'app-persona-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
  ],
  templateUrl: './persona-form.page.html',
})
export class PersonaFormPage implements OnInit {
  personaId: string | null = null;
  guardando = signal(false);

  nombre = '';
  fechaNacimiento = '';
  sexo = '';
  grupoSanguineo = '';
  contactoEmergencia = '';
  telefonoEmergencia = '';
  alergiasTexto = '';
  enfermedadesTexto = '';
  medicamentosTexto = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private personasSvc: PersonasService
  ) {}

  async ngOnInit(): Promise<void> {
    this.personaId = this.route.snapshot.paramMap.get('id');
    if (!this.personaId) return;
    const persona = await this.personasSvc.obtener(this.personaId);
    if (!persona) return;
    this.nombre = persona.nombre;
    this.fechaNacimiento = persona.fechaNacimiento;
    this.sexo = persona.sexo;
    this.grupoSanguineo = persona.grupoSanguineo ?? '';
    this.contactoEmergencia = persona.contactoEmergencia ?? '';
    this.telefonoEmergencia = persona.telefonoEmergencia ?? '';
    this.alergiasTexto = (persona.alergias ?? []).join(', ');
    this.enfermedadesTexto = (persona.enfermedadesCronicas ?? []).join(', ');
    this.medicamentosTexto = (persona.medicamentosPermanentes ?? []).join(', ');
  }

  private aLista(texto: string): string[] {
    return texto
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  async guardar(): Promise<void> {
    this.guardando.set(true);
    try {
      const datos: Omit<Persona, 'id' | 'uidTitular'> = {
        nombre: this.nombre.trim(),
        fechaNacimiento: this.fechaNacimiento,
        sexo: this.sexo,
        grupoSanguineo: this.grupoSanguineo || undefined,
        contactoEmergencia: this.contactoEmergencia || undefined,
        telefonoEmergencia: this.telefonoEmergencia || undefined,
        alergias: this.aLista(this.alergiasTexto),
        enfermedadesCronicas: this.aLista(this.enfermedadesTexto),
        medicamentosPermanentes: this.aLista(this.medicamentosTexto),
      };

      if (this.personaId) {
        await this.personasSvc.actualizar(this.personaId, datos);
        await this.router.navigateByUrl(`/personas/${this.personaId}`);
      } else {
        const uid = this.auth.usuario()?.uid;
        if (!uid) return;
        const id = await this.personasSvc.crear(uid, datos);
        await this.router.navigateByUrl(`/personas/${id}`);
      }
    } finally {
      this.guardando.set(false);
    }
  }
}
