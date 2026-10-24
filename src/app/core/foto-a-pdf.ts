import { jsPDF } from 'jspdf';

function archivoADataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onloadend = () => resolve(lector.result as string);
    lector.onerror = () => reject(new Error('no-se-pudo-leer-la-foto'));
    lector.readAsDataURL(archivo);
  });
}

function dimensionesImagen(dataUrl: string): Promise<{ ancho: number; alto: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ ancho: img.naturalWidth, alto: img.naturalHeight });
    img.onerror = () => reject(new Error('no-se-pudo-leer-la-foto'));
    img.src = dataUrl;
  });
}

/**
 * Combina una o más fotos en un único PDF (una foto por página, tamaño A4,
 * cada imagen escalada para entrar completa sin recortarse) — 100%
 * client-side con jsPDF, mismo patrón que el carnet de emergencia
 * (core/pdf-carnet.ts). Sección 4.1 del spec: la cámara es solo un método de
 * captura para digitalizar un papel; esto arma el PDF final del "escaneo".
 */
export async function fotosAPdf(fotos: File[], nombreArchivo: string): Promise<File> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const margen = 10;

  for (let i = 0; i < fotos.length; i++) {
    const dataUrl = await archivoADataUrl(fotos[i]);
    const { ancho, alto } = await dimensionesImagen(dataUrl);
    if (i > 0) doc.addPage();

    const anchoDisponible = anchoPagina - margen * 2;
    const altoDisponible = altoPagina - margen * 2;
    const escala = Math.min(anchoDisponible / ancho, altoDisponible / alto);
    const anchoFinal = ancho * escala;
    const altoFinal = alto * escala;
    const x = (anchoPagina - anchoFinal) / 2;
    const y = (altoPagina - altoFinal) / 2;

    const formato = fotos[i].type === 'image/png' ? 'PNG' : 'JPEG';
    doc.addImage(dataUrl, formato, x, y, anchoFinal, altoFinal);
  }

  const blob = doc.output('blob');
  return new File([blob], nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`, {
    type: 'application/pdf',
  });
}
