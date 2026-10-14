import { jsPDF } from 'jspdf';
import type { Persona } from '../models';

const ETIQUETAS: Record<string, string> = {
  nombre: 'Nombre',
  fechaNacimiento: 'Fecha de nacimiento',
  grupoSanguineo: 'Grupo sanguíneo',
  alergias: 'Alergias',
  enfermedadesCronicas: 'Enfermedades crónicas',
  medicamentosPermanentes: 'Medicación permanente',
  contactoEmergencia: 'Contacto de emergencia',
  telefonoEmergencia: 'Teléfono de emergencia',
};

function valorCampo(persona: Persona, campo: string): string {
  const v = (persona as unknown as Record<string, unknown>)[campo];
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  return v ? String(v) : '—';
}

async function urlADataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Genera el PDF del carnet de emergencia (jsPDF, 100% client-side) y dispara su descarga. */
export function generarPdfCarnet(persona: Persona, campos: string[], qrDataUrl: string): void {
  const doc = new jsPDF({ unit: 'mm', format: [85, 120] });

  doc.setFontSize(14);
  doc.text('Ficha de emergencia', 42.5, 10, { align: 'center' });

  doc.setFontSize(11);
  doc.text(persona.nombre, 42.5, 17, { align: 'center' });

  let y = 25;
  doc.setFontSize(9);
  for (const campo of campos) {
    const texto = `${ETIQUETAS[campo]}: ${valorCampo(persona, campo)}`;
    const lineas = doc.splitTextToSize(texto, 70);
    doc.text(lineas, 7, y);
    y += lineas.length * 4.5;
  }

  doc.addImage(qrDataUrl, 'PNG', 22.5, Math.max(y + 4, 70), 40, 40);

  doc.save(`ficha-emergencia-${persona.nombre.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Genera el PDF del QR de pérdida (sección 4.6): pensado para que lo lea un
 * desconocido que encuentra a la persona, no un médico — prioriza nombre,
 * foto, una condición en una frase y el contacto de emergencia bien grande.
 */
export async function generarPdfPerdida(persona: Persona, qrDataUrl: string): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: [85, 120] });

  doc.setFillColor(168, 92, 104); // --rose-strong
  doc.rect(0, 0, 85, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('Si me encontraste, por favor', 42.5, 7, { align: 'center' });
  doc.text('contacta a mi familia', 42.5, 12.5, { align: 'center' });

  doc.setTextColor(61, 44, 46); // --fg
  let y = 24;

  if (persona.fotoUrl) {
    const fotoDataUrl = await urlADataUrl(persona.fotoUrl);
    if (fotoDataUrl) {
      doc.addImage(fotoDataUrl, 22.5, y, 40, 40);
      y += 44;
    }
  }

  doc.setFontSize(15);
  doc.text(persona.nombre, 42.5, y, { align: 'center' });
  y += 8;

  if (persona.condicionPerdida) {
    doc.setFontSize(10);
    const lineas = doc.splitTextToSize(persona.condicionPerdida, 70);
    doc.text(lineas, 42.5, y, { align: 'center' });
    y += lineas.length * 5 + 4;
  }

  if (persona.contactoEmergencia) {
    doc.setFontSize(13);
    doc.text(persona.contactoEmergencia, 42.5, y, { align: 'center' });
    y += 7;
  }
  if (persona.telefonoEmergencia) {
    doc.setFontSize(16);
    doc.text(persona.telefonoEmergencia, 42.5, y, { align: 'center' });
    y += 9;
  }

  doc.addImage(qrDataUrl, 'PNG', 22.5, Math.max(y + 3, 78), 40, 40);

  doc.save(`qr-perdida-${persona.nombre.replace(/\s+/g, '_')}.pdf`);
}
