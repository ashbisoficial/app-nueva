import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Capa 1 de recordatorios (sección 4.5): notificaciones locales programadas en
 * el dispositivo con @capacitor/local-notifications. No dependen de red ni de
 * servidor. En navegador de escritorio el plugin puede no estar soportado —
 * cada llamada se envuelve en try/catch para no romper el resto de la app.
 */
@Injectable({ providedIn: 'root' })
export class RecordatoriosLocalesService {
  /** Convierte un string en un entero positivo estable, para los ids numéricos que pide Capacitor. */
  private idNumerico(texto: string): number {
    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
      hash = (hash * 31 + texto.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) || 1;
  }

  private async pedirPermiso(): Promise<boolean> {
    try {
      const estado = await LocalNotifications.checkPermissions();
      if (estado.display === 'granted') return true;
      const resultado = await LocalNotifications.requestPermissions();
      return resultado.display === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Programa un recordatorio repetido por cada horario, uno por día, mientras el
   * tratamiento esté activo. No hay forma de poner una fecha límite automática
   * en el plugin: cuando el tratamiento termina o se da de baja hay que llamar
   * a cancelarMedicamento() explícitamente (ver sección 4.4 del spec).
   */
  async programarMedicamento(medicamentoId: string, nombre: string, horarios: string[]): Promise<void> {
    if (!(await this.pedirPermiso())) return;
    try {
      const notifications = horarios.map((horario, i) => {
        const [horas, minutos] = horario.split(':').map(Number);
        return {
          id: this.idNumerico(`${medicamentoId}-${i}`),
          title: 'Hora de tomar tu medicamento',
          body: `${nombre} — ${horario}`,
          schedule: { on: { hour: horas, minute: minutos } },
        };
      });
      await LocalNotifications.schedule({ notifications });
    } catch {
      // Entorno sin soporte para notificaciones locales (ej. navegador de escritorio); se ignora.
    }
  }

  async cancelarMedicamento(medicamentoId: string, cantidadHorarios: number): Promise<void> {
    try {
      const notifications = Array.from({ length: cantidadHorarios }, (_, i) => ({
        id: this.idNumerico(`${medicamentoId}-${i}`),
      }));
      await LocalNotifications.cancel({ notifications });
    } catch {
      // ignorado
    }
  }

  /** Programa un único recordatorio para una cita, al momento de crearla. */
  async programarCita(citaId: string, titulo: string, fechaHoraISO: string): Promise<void> {
    if (!(await this.pedirPermiso())) return;
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.idNumerico(citaId),
            title: 'Cita médica',
            body: titulo,
            schedule: { at: new Date(fechaHoraISO) },
          },
        ],
      });
    } catch {
      // ignorado
    }
  }

  async cancelarCita(citaId: string): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: this.idNumerico(citaId) }] });
    } catch {
      // ignorado
    }
  }
}
