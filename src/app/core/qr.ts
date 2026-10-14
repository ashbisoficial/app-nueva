import QRCode from 'qrcode';

export async function generarQrDataUrl(texto: string): Promise<string> {
  return QRCode.toDataURL(texto, { margin: 1, width: 300 });
}

export function urlFichaPublica(token: string): string {
  return `${window.location.origin}/ficha-publica/${token}`;
}

export function urlFichaPerdida(token: string): string {
  return `${window.location.origin}/ficha-perdida/${token}`;
}
