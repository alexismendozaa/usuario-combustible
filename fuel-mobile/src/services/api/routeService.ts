/**
 * Servicio de rutas GPS
 */

import apiClient from './apiClient';

export interface RoutePoint {
  lat: number;
  lng: number;
  ts: string; // ISO date string
}

export interface CreateRouteData {
  vehicleId?: string;
  name?: string;
  points: RoutePoint[];
}

export interface Route {
  id: string;
  userId: string;
  vehicleId?: string;
  name?: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  distanceKm: number;
  points: RoutePoint[];
  createdAt: string;
}

export interface RouteSummary {
  id: string;
  userId: string;
  vehicleId?: string;
  name?: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  distanceKm: number;
  createdAt: string;
}

class RouteService {
  /**
   * Crear ruta con puntos GPS
   */
  async create(data: CreateRouteData): Promise<RouteSummary> {
    const response = await apiClient.post<RouteSummary>('/routes', data);
    return response.data;
  }

  /**
   * Listar rutas del usuario (resumen)
   */
  async list(): Promise<RouteSummary[]> {
    const response = await apiClient.get<RouteSummary[]>('/routes');
    return response.data;
  }

  /**
   * Obtener ruta completa con puntos GPS
   */
  async getById(id: string): Promise<Route> {
    const response = await apiClient.get<Route>(`/routes/${id}`);
    return response.data;
  }

  /**
   * Eliminar ruta
   */
  async delete(id: string): Promise<{ ok: boolean }> {
    const response = await apiClient.delete<{ ok: boolean }>(`/routes/${id}`);
    return response.data;
  }
}

export const routeService = new RouteService();