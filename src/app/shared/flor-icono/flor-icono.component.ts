import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import type { FormaFlor } from '../../core/temas';

interface Punto {
  x: number;
  y: number;
  r: number;
}

/**
 * Ilustración vectorial de cada flor de la colección (sección 2.2), usada en
 * el selector de paletas de Configuración en vez de un círculo de color
 * liso. Cada "forma" es la silueta real de esa flor (rosa en espiral,
 * girasol con centro grande, hibisco con el pistilo que sobresale, lirio en
 * forma de estrella, campanita del copihue, etc.) — no son fotografías,
 * pero sí se reconocen como esa flor en particular, no formas genéricas
 * repetidas entre flores distintas.
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

  // Rosa: dos coronas de pétalos en espiral, la interior rotada a medio paso.
  readonly rosaExterior = Array.from({ length: 6 }, (_, i) => i * 60);
  readonly rosaInterior = Array.from({ length: 5 }, (_, i) => i * 72 + 30);

  // Girasol / Caléndula / Dalia: pétalos radiales, cada una con su propio conteo/ancho.
  readonly girasolPetalos = Array.from({ length: 10 }, (_, i) => i * 36);
  readonly calendulaExterior = Array.from({ length: 14 }, (_, i) => i * (360 / 14));
  readonly calendulaInterior = Array.from({ length: 12 }, (_, i) => i * (360 / 12) + 15);
  readonly daliaExterior = Array.from({ length: 10 }, (_, i) => i * 36);
  readonly daliaMedio = Array.from({ length: 8 }, (_, i) => i * 45 + 22);
  readonly daliaInterior = Array.from({ length: 6 }, (_, i) => i * 60);

  // Lirio: estrella de 6 puntas + estambres finos entre pétalos.
  readonly lirioPetalos = Array.from({ length: 6 }, (_, i) => i * 60);
  readonly lirioEstambres = Array.from({ length: 3 }, (_, i) => i * 120 + 35);

  // Hibisco / Bailarina: corona simple de 5 pétalos.
  readonly cincoPetalos = Array.from({ length: 5 }, (_, i) => i * 72);

  // Racimos (lilas/hortensia): muchas florecitas de 4 pétalos distribuidas en el área.
  readonly racimoPequeno: Punto[] = [
    { x: 50, y: 22, r: 7 },
    { x: 38, y: 32, r: 7 },
    { x: 62, y: 32, r: 7 },
    { x: 32, y: 46, r: 7.5 },
    { x: 50, y: 44, r: 7.5 },
    { x: 68, y: 46, r: 7.5 },
    { x: 40, y: 60, r: 7.5 },
    { x: 60, y: 60, r: 7.5 },
    { x: 50, y: 70, r: 7 },
  ];

  readonly racimoGrande: Punto[] = [
    { x: 50, y: 50, r: 9 },
    { x: 32, y: 42, r: 8.5 },
    { x: 68, y: 42, r: 8.5 },
    { x: 32, y: 60, r: 8.5 },
    { x: 68, y: 60, r: 8.5 },
    { x: 50, y: 28, r: 8 },
    { x: 50, y: 72, r: 8 },
    { x: 24, y: 50, r: 7 },
    { x: 76, y: 50, r: 7 },
    { x: 40, y: 26, r: 6.5 },
    { x: 60, y: 26, r: 6.5 },
    { x: 40, y: 74, r: 6.5 },
    { x: 60, y: 74, r: 6.5 },
  ];
}
