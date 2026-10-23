/// <reference types="google.maps" />
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    google?: typeof google;
  }
}

let cargaPlaces: Promise<google.maps.PlacesLibrary> | null = null;

/**
 * Carga el script de Google Maps JS una sola vez (perezoso: solo se llama
 * desde pantallas que de verdad necesitan el buscador de direcciones, nunca
 * en el arranque de la app) y devuelve la librería "places" ya lista para
 * usar `PlaceAutocompleteElement`. Si falla (sin internet, bloqueador de
 * anuncios, key mal configurada), el error se propaga para que quien llama
 * decida no mostrar el buscador — el resto del formulario de dirección
 * sigue siendo 100% editable a mano, nunca depende de esto.
 */
export function cargarLibreriaPlaces(): Promise<google.maps.PlacesLibrary> {
  if (cargaPlaces) return cargaPlaces;

  cargaPlaces = new Promise<google.maps.PlacesLibrary>((resolve, reject) => {
    if (!environment.googleMapsApiKey) {
      reject(new Error('google-maps-sin-key'));
      return;
    }
    if (window.google?.maps) {
      window.google.maps.importLibrary('places').then(resolve as (lib: unknown) => void, reject);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places&v=weekly&language=es&region=CL&loading=async`;
    script.async = true;
    script.onerror = () => reject(new Error('google-maps-script-no-cargo'));
    script.onload = () => {
      window.google!.maps.importLibrary('places').then(resolve as (lib: unknown) => void, reject);
    };
    document.head.appendChild(script);
  });

  return cargaPlaces;
}
