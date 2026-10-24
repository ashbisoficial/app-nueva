import { createAvatar } from '@dicebear/core';
// Directo desde el paquete del estilo, no desde `@dicebear/collection` —
// ese paquete incluye TODOS los estilos de DiceBear (decenas), y acá solo
// se usa "avataaars". Importarlo así saca del bundle todo lo demás.
import * as avataaars from '@dicebear/avataaars';
import type { AvatarOpciones } from '../models';

/**
 * Avatar tipo "muñequito" (como Duolingo), armado con DiceBear
 * (`@dicebear/collection`, estilo "avataaars" — MIT, 100% client-side, sin
 * servidor ni costo). Reemplaza la foto de perfil como identidad visual por
 * defecto de una Persona (sección 2.1 del spec: baja fricción, nada de
 * subir/recortar una foto real solo para "verse bien" en la app) — la foto
 * real queda reservada únicamente para el QR de pérdida (sección 4.6), que
 * sí la necesita porque ahí el objetivo es que un desconocido reconozca a
 * la persona en la vida real.
 *
 * Se guarda la configuración elegida (`Persona.avatarConfig`), nunca el SVG
 * ya armado — así cambia de tamaño/calidad sin problema y pesa casi nada en
 * Firestore. El SVG se arma al vuelo en el cliente con `avatarDataUri()`.
 */

export const AVATAR_PIEL = ['614335', 'd08b5b', 'ae5d29', 'edb98a', 'ffdbb4', 'fd9841', 'f8d25c'];
export const AVATAR_CABELLO_COLOR = [
  'a55728',
  '2c1b18',
  'b58143',
  'd6b370',
  '724133',
  '4a312c',
  'f59797',
  'ecdcbf',
  'c93305',
  'e8e1e1',
];
export const AVATAR_ROPA_COLOR = [
  '262e33',
  '65c9ff',
  '5199e4',
  '25557c',
  'e6e6e6',
  '929598',
  '3c4f5c',
  'b1e2ff',
  'a7ffc4',
  'ffafb9',
  'ff488e',
  'ff5c5c',
];

export const AVATAR_CABELLO_ESTILO = [
  'shortFlat',
  'shortRound',
  'shortWaved',
  'shortCurly',
  'shaggy',
  'shaggyMullet',
  'theCaesar',
  'theCaesarAndSidePart',
  'sides',
  'shavedSides',
  'straight01',
  'straight02',
  'straightAndStrand',
  'curly',
  'curvy',
  'bob',
  'bun',
  'longButNotTooLong',
  'miaWallace',
  'frida',
  'fro',
  'froBand',
  'bigHair',
  'dreads',
  'dreads01',
  'dreads02',
  'frizzle',
  'hat',
  'hijab',
  'turban',
];
export const AVATAR_OJOS = ['default', 'happy', 'side', 'squint', 'surprised', 'wink', 'winkWacky', 'xDizzy', 'closed', 'cry', 'eyeRoll', 'hearts'];
export const AVATAR_CEJAS = [
  'defaultNatural',
  'raisedExcitedNatural',
  'flatNatural',
  'angryNatural',
  'sadConcernedNatural',
  'upDownNatural',
  'frownNatural',
  'unibrowNatural',
];
export const AVATAR_BOCA = ['default', 'smile', 'twinkle', 'serious', 'concerned', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'tongue', 'vomit'];
/** Vacío = sin lentes. */
export const AVATAR_LENTES = ['', 'round', 'wayfarers', 'prescription01', 'prescription02', 'sunglasses', 'kurt'];
export const AVATAR_ROPA = ['shirtCrewNeck', 'shirtVNeck', 'shirtScoopNeck', 'hoodie', 'overall', 'blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt'];

export const AVATAR_POR_DEFECTO: AvatarOpciones = {
  piel: AVATAR_PIEL[3],
  cabelloEstilo: 'shortFlat',
  cabelloColor: AVATAR_CABELLO_COLOR[1],
  cejas: 'defaultNatural',
  ojos: 'default',
  boca: 'smile',
  lentes: '',
  ropa: 'shirtCrewNeck',
  ropaColor: AVATAR_ROPA_COLOR[6],
};

export interface OpcionPrevia {
  valor: string;
  src: string;
}

/** Arma el data URI del SVG a partir de la configuración elegida — listo para un `<img [src]>`. */
export function avatarDataUri(opciones: AvatarOpciones | undefined): string {
  const o = opciones ?? AVATAR_POR_DEFECTO;
  // `AvatarOpciones` guarda `string` a propósito (es lo que viaja por Firestore
  // y lo que arma AVATAR_CABELLO_ESTILO/etc. más arriba) en vez de los tipos
  // literales exactos de "avataaars" — siempre vienen de esos mismos catálogos,
  // así que el cast es seguro; duplicar esos ~90 valores como unión de tipos
  // solo para conformar a DiceBear no aporta nada.
  const avatar = createAvatar(avataaars, {
    seed: 'serangelia',
    top: [o.cabelloEstilo],
    hairColor: [o.cabelloColor],
    eyebrows: [o.cejas],
    eyes: [o.ojos],
    mouth: [o.boca],
    accessories: o.lentes ? [o.lentes] : [],
    accessoriesProbability: o.lentes ? 100 : 0,
    accessoriesColor: ['262e33'],
    skinColor: [o.piel],
    clothing: [o.ropa],
    clothesColor: [o.ropaColor],
    facialHairProbability: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  return avatar.toDataUri();
}

/**
 * Miniaturas para elegir "a ojo" (sin textos — cada opción se ve tal cual
 * va a quedar, como el selector de Duolingo), armadas una sola vez contra
 * AVATAR_POR_DEFECTO con solo ese campo variando — así no cambian según lo
 * que ya eligió la persona en otras pestañas.
 */
function previas(campo: keyof AvatarOpciones, valores: string[]): OpcionPrevia[] {
  return valores.map((valor) => ({ valor, src: avatarDataUri({ ...AVATAR_POR_DEFECTO, [campo]: valor }) }));
}

export const AVATAR_PREVIAS_CABELLO = previas('cabelloEstilo', AVATAR_CABELLO_ESTILO);
export const AVATAR_PREVIAS_OJOS = previas('ojos', AVATAR_OJOS);
export const AVATAR_PREVIAS_CEJAS = previas('cejas', AVATAR_CEJAS);
export const AVATAR_PREVIAS_BOCA = previas('boca', AVATAR_BOCA);
export const AVATAR_PREVIAS_LENTES = previas('lentes', AVATAR_LENTES);
export const AVATAR_PREVIAS_ROPA = previas('ropa', AVATAR_ROPA);
