import { runtime } from '../config/runtime';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodedPlace extends Coordinates {
  address: string;
  area: string;
  city: string;
  label?: string;
}

export interface MapService {
  reverse(coordinates: Coordinates): Promise<GeocodedPlace>;
  search(query: string): Promise<GeocodedPlace[]>;
}

export const mapService: MapService = {
  async reverse({ latitude, longitude }) {
    if (!runtime.mapboxConfigured) {
      return { latitude, longitude, address: '', area: '', city: '' };
    }

    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${longitude}&latitude=${latitude}&country=PK&access_token=${runtime.mapboxToken}`,
    );
    if (!response.ok) throw new Error('Address lookup is unavailable. Select a place from the map search instead.');
    const json = await response.json() as {
      features?: Array<{ properties?: { full_address?: string; name?: string; context?: { place?: { name?: string }; neighborhood?: { name?: string } } } }>;
    };
    const place = json.features?.[0]?.properties;
    return {
      latitude,
      longitude,
      address: place?.full_address ?? place?.name ?? '',
      area: place?.context?.neighborhood?.name ?? place?.name ?? '',
      city: place?.context?.place?.name ?? '',
      label: [place?.full_address, place?.context?.place?.name].filter(Boolean).join(', '),
    };
  },
  async search(query) {
    if (!runtime.mapboxConfigured) return [];
    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&country=PK&limit=6&language=ur&access_token=${runtime.mapboxToken}`,
    );
    if (!response.ok) throw new Error('Address search is unavailable.');
    const json = await response.json() as {
      features?: Array<{
        geometry: { coordinates: [number, number] };
        properties?: { full_address?: string; name?: string; context?: { place?: { name?: string }; neighborhood?: { name?: string } } };
      }>;
    };
    return (json.features ?? []).map((feature) => {
      const address = feature.properties?.full_address ?? feature.properties?.name ?? '';
      const neighborhood = feature.properties?.context?.neighborhood?.name ?? '';
      const city = feature.properties?.context?.place?.name ?? '';
      return {
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        address,
        area: neighborhood || address,
        city,
        label: [address, neighborhood, city].filter(Boolean).join(' · '),
      };
    });
  },
};
