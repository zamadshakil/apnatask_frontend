import { typedApi } from './api';

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
    const { data, error } = await typedApi.GET('/api/v2/locations/reverse', {
      params: { query: { latitude, longitude } },
    });
    if (error || !data) {
      return { latitude, longitude, address: '', area: '', city: '' };
    }
    return data;
  },
  async search(query) {
    const normalized = query.trim();
    if (normalized.length < 2) return [];
    const { data, error } = await typedApi.GET('/api/v2/locations/search', {
      params: { query: { query: normalized } },
    });
    return error || !data ? [] : data;
  },
};
