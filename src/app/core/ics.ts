/** Exportar una cita a un archivo .ics (sección 4.3: paso intermedio antes de integrar Google Calendar). */
export interface EventoIcs {
  titulo: string;
  fechaInicio: string;
  fechaFin?: string;
  lugar?: string;
  notas?: string;
}

function formatearFechaIcs(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapar(texto: string): string {
  return texto.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
}

export function generarIcs(evento: EventoIcs): string {
  const inicio = new Date(evento.fechaInicio);
  const fin = evento.fechaFin ? new Date(evento.fechaFin) : new Date(inicio.getTime() + 60 * 60000);

  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//app-nueva//ES',
    'BEGIN:VEVENT',
    `DTSTART:${formatearFechaIcs(inicio.toISOString())}`,
    `DTEND:${formatearFechaIcs(fin.toISOString())}`,
    `SUMMARY:${escapar(evento.titulo)}`,
    evento.lugar ? `LOCATION:${escapar(evento.lugar)}` : '',
    evento.notas ? `DESCRIPTION:${escapar(evento.notas)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lineas.join('\r\n');
}

export function descargarIcs(evento: EventoIcs, nombreArchivo = 'cita.ics'): void {
  const blob = new Blob([generarIcs(evento)], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
