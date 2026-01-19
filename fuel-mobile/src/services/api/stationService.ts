/**
 * Servicio de estaciones de servicio (gasolineras)
 */

import apiClient from './apiClient';

export interface NearbyStationsParams {
  lat: number;
  lng: number;
  radius?: number; // metros, default 2000, rango 200-10000
}

export interface Station {
  id: string;
  name: string;
  brand?: string;
  operator?: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface NearbyStationsResponse {
  count: number;
  stations: Station[];
}

class StationService {
  /**
   * Obtener estaciones cercanas
   */
  async getNearby(params: NearbyStationsParams): Promise<NearbyStationsResponse> {
    const queryParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
    });
    
    if (params.radius !== undefined) {
      queryParams.append('radius', params.radius.toString());
    }

    const response = await apiClient.get<NearbyStationsResponse>(
      `/stations/nearby?${queryParams.toString()}`
    );
    return response.data;
  }
}

export const stationService = new StationService();