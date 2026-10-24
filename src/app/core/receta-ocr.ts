import type { MedicamentoOrden } from '../models';

/**
 * Lee el texto de una foto de receta con OCR 100% client-side (Tesseract.js,
 * gratis, sin servidor ni key) — se importa de forma dinámica para que su
 * peso (varios MB de WASM + datos del idioma) no infle el bundle de
 * historial-nueva, se descarga recién cuando alguien toca "Leer receta".
 *
 * Limitación conocida (pedido explícito del usuario, probado con letra
 * manuscrita real antes de decidir si conviene pasar a una IA con visión
 * pagada): Tesseract anda razonable con texto impreso/digital, pero falla
 * seguido con letra manuscrita de médico — por eso parsearMedicamentos()
 * nunca reemplaza lo que ya hay, solo agrega filas para revisar, y
 * analizarFotoReceta() siempre deja ver el texto crudo reconocido por si
 * el parseo no encontró nada útil.
 */
export async function leerTextoReceta(archivo: File): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('spa');
  try {
    const {
      data: { text },
    } = await worker.recognize(archivo);
    return text;
  } finally {
    await worker.terminate();
  }
}

const PATRON_DOSIS =
  /\d+[.,]?\d*\s?(mg|mcg|µg|ml|g|UI|u\.i\.|comprimidos?|cápsulas?|cap\.?|tabletas?|gotas?|puff|ampollas?)\b/i;
// OCR real suele perder tildes ("dia" en vez de "día") — por eso "d[ií]a", no solo "día".
const PATRON_FRECUENCIA =
  /(cada\s+\d+\s*(horas?|hrs?|h\b)|\d+\s*(veces?|v\.?)\s*(al\s+d[ií]a|\/\s*d[ií]a|por\s+d[ií]a)|\d-\d-\d|c\/\d+\s*h)/i;

/**
 * Heurística de texto libre, no un parser confiable: busca líneas que
 * contengan algo que parezca una dosis (un patrón de número+unidad, ej.
 * "500 mg") y de ahí separa nombre/dosis/frecuencia. Una receta real tiene
 * formatos muy distintos entre sí — esto es un punto de partida para que la
 * persona edite, nunca el resultado final.
 */
export function parsearMedicamentos(textoOcr: string): MedicamentoOrden[] {
  const lineas = textoOcr
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const detectados: MedicamentoOrden[] = [];
  for (const linea of lineas) {
    const dosisMatch = linea.match(PATRON_DOSIS);
    if (!dosisMatch || dosisMatch.index === undefined) continue;

    const frecuenciaMatch = linea.match(PATRON_FRECUENCIA);
    const nombre = linea
      .slice(0, dosisMatch.index)
      .replace(/^[\d.\-)}\]:\s•*]+/, '') // numeración/viñetas al inicio, con garabatos típicos del OCR ("1.", "-", "•", "1}")
      .trim();
    if (!nombre) continue;

    detectados.push({
      nombre,
      dosis: dosisMatch[0].trim(),
      frecuencia: frecuenciaMatch ? frecuenciaMatch[0].trim() : '',
    });
  }
  return detectados;
}
