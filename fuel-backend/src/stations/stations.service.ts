import { Injectable } from '@nestjs/common';
import axios from 'axios';

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  center?: { lat: number; lon: number }; // para ways/relations
};

@Injectable()
export class StationsService {
  // cache simple (key -> {expiresAt, data})
  private cache = new Map<string, { expiresAt: number; data: any }>();

  /**
   * Realiza reintentos automáticos con backoff exponencial
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelayMs = 1000,
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          throw error;
        }
        // Backoff exponencial: 1s, 2s, 4s
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError;
  }

  async nearby(lat: number, lng: number, radiusMeters = 2000) {
    const radius = Math.min(Math.max(radiusMeters, 200), 10000); // 200m..10km
    const cacheKey = `${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;

    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    // Overpass QL: amenity=fuel alrededor del punto
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="fuel"](around:${radius},${lat},${lng});
        way["amenity"="fuel"](around:${radius},${lat},${lng});
        relation["amenity"="fuel"](around:${radius},${lat},${lng});
      );
      out center tags;
    `.trim();

    // Realiza reintentos con backoff exponencial
    const { data } = await this.retryWithBackoff(
      () =>
        axios.post('https://overpass-api.de/api/interpreter', query, {
          headers: { 'Content-Type': 'text/plain' },
        }),
      3, // máximo 3 reintentos
      1000, // delay inicial 1s
    );

    const elements: OverpassElement[] = data?.elements ?? [];

    const stations = elements
      .map((el) => {
        const cLat = el.lat ?? el.center?.lat;
        const cLng = el.lon ?? el.center?.lon;
        const tags = el.tags ?? {};
        return {
          id: `${el.type}/${el.id}`,
          name: tags.name ?? 'Gasolinera',
          brand: tags.brand ?? null,
          operator: tags.operator ?? null,
          lat: cLat,
          lng: cLng,
          address:
            (tags['addr:full'] ??
              [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']]
                .filter(Boolean)
                .join(' ')
                .trim()) ||
            null,
        };
      })
      .filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number');

    const result = { count: stations.length, stations };

    // cache 60s (para no spamear)
    this.cache.set(cacheKey, { expiresAt: Date.now() + 60_000, data: result });

    return result;
  }
}
