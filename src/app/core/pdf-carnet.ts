import { jsPDF } from 'jspdf';
import type { CampoFichaPublica, Persona } from '../models';

const ETIQUETAS: Record<CampoFichaPublica, string> = {
  nombre: 'Nombre',
  fechaNacimiento: 'Fecha de nacimiento',
  grupoSanguineo: 'Grupo sanguíneo',
  alergias: 'Alergias',
  enfermedadesCronicas: 'Enfermedades crónicas',
  medicamentosPermanentes: 'Medicación permanente',
  contactoEmergencia: 'Contacto de emergencia',
  telefonoEmergencia: 'Teléfono de emergencia',
};

function valorCampo(persona: Persona, campo: CampoFichaPublica): string {
  const v = persona[campo];
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  return v ? String(v) : '—';
}

/** Genera el PDF del carnet de emergencia (jsPDF, 100% client-side) y dispara su descarga. */
export function generarPdfCarnet(persona: Persona, campos: CampoFichaPublica[], qrDataUrl: string): void {
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
