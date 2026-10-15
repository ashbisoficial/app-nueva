import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import type { FormaFlor } from '../../core/temas';

/**
 * Ilustración vectorial simple de cada flor de la colección (sección 2.2),
 * usada en el selector de paletas de Configuración en vez de un círculo de
 * color liso. Una sola forma SVG por "familia" de flor (redonda/racimo/
 * puntiaguda/trompeta/corazón/campana/exótica), coloreada con el primario y
 * secundario de cada tema — no son ilustraciones botánicamente exactas,
 * son un ícono reconocible y agradable a tamaño chico.
 */
@Component({
  selector: 'app-flor-icono',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flor-icono.component.html',
  styleUrl: './flor-icono.component.scss',
})
export class FlorIconoComponent {
  @Input({ required: true }) forma!: FormaFlor;
  @Input({ required: true }) primario!: string;
  @Input({ required: true }) secundario!: string;

  readonly petalosRedonda = Array.from({ length: 6 }, (_, i) => i * 60);
  readonly petalosPuntiaguda = Array.from({ length: 12 }, (_, i) => i * 30);
  readonly petalosTrompeta = Array.from({ length: 6 }, (_, i) => i * 60);

  readonly racimoBlossoms = [
    { x: 50, y: 48, r: 11 },
    { x: 33, y: 40, r: 9 },
    { x: 67, y: 40, r: 9 },
    { x: 30, y: 60, r: 8 },
    { x: 70, y: 60, r: 8 },
    { x: 50, y: 26, r: 8 },
    { x: 50, y: 68, r: 9 },
  ];
}
