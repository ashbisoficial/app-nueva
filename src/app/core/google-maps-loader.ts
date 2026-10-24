/// <reference types="google.maps" />
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    google?: typeof google;
  }
}

let iniciado = false;

/**
 * Snippet de arranque oficial de Google ("Dynamic Library Import"), tal
 * cual lo entrega la consola de Cloud al crear una key de Maps — define
 * `google.maps.importLibrary` sin el cual NO existe esa función (cargar el
 * script a mano con `?libraries=places` no alcanza: ese query param solo
 * sirve para precargar, pero `importLibrary` lo define este bootstrap).
 * Verificado con Playwright contra la API real antes de integrarlo acá.
 */
function iniciarBootstrap(): void {
  if (iniciado) return;
  iniciado = true;
  (
    (g) => {
      let h: Promise<void> | undefined;
      let a: HTMLScriptElement;
      let k: string;
      const p = 'The Google Maps JavaScript API';
      const c = 'google';
      const l = 'importLibrary';
      const q = '__ib__';
      const m = document;
      let b = window as unknown as Record<string, unknown>;
      b = (b[c] as Record<string, unknown>) || ((b[c] as Record<string, unknown>) = {});
      const d = (b['maps'] as Record<string, unknown>) || ((b['maps'] as Record<string, unknown>) = {});
      const r = new Set<string>();
      const e = new URLSearchParams();
      const u = () =>
        h ||
        (h = new Promise<void>((f, n) => {
          a = m.createElement('script');
          e.set('libraries', [...r] + '');
          for (k in g as Record<string, string>) e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), (g as Record<string, string>)[k]);
          e.set('callback', c + '.maps.' + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          (d as Record<string, unknown>)[q] = f;
          a.onerror = () => {
            h = undefined as unknown as Promise<void>;
            n(new Error(p + ' no se pudo cargar.'));
          };
          m.head.append(a);
        }));
      if (d[l]) {
        // ya estaba inicializado (no debería pasar, `iniciado` lo evita)
      } else {
        (d as Record<string, unknown>)[l] = (f: string, ...n: unknown[]) =>
          r.add(f) && u().then(() => (d[l] as (...args: unknown[]) => unknown)(f, ...n));
      }
    }
  )({
    key: environment.googleMapsApiKey,
    v: 'weekly',
    language: 'es',
    region: 'CL',
  });
}

let cargaPlaces: Promise<google.maps.PlacesLibrary> | null = null;

/**
 * Carga la librería "places" una sola vez (perezoso: solo se llama desde
 * pantallas que de verdad necesitan el buscador de direcciones, nunca en el
 * arranque de la app). Si falla (sin internet, bloqueador de anuncios, key
 * mal configurada), el error se propaga para que quien llama decida no
 * mostrar el buscador — el resto del formulario de dirección sigue siendo
 * 100% editable a mano, nunca depende de esto.
 */
export function cargarLibreriaPlaces(): Promise<google.maps.PlacesLibrary> {
  if (cargaPlaces) return cargaPlaces;

  if (!environment.googleMapsApiKey) {
    cargaPlaces = Promise.reject(new Error('google-maps-sin-key'));
    return cargaPlaces;
  }

  iniciarBootstrap();
  cargaPlaces = window.google!.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>;
  return cargaPlaces;
}
