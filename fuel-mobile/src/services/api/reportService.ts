/**
 * Servicio de reportes
 */

import apiClient from './apiClient';

export interface VehicleSummary {
  vehicleId: string;
  refuels: number;
  totalLiters: number;
  totalCost: number;
  totalDistanceKm: number;
  avgKmPerLiter: number | null;
  avgCostPerKm: number | null;
}

export interface MonthlyMetrics {
  month: string;
  vehicleId: string;
  refuels: number;
  totalLiters: number;
  totalCost: number;
  totalDistanceKm: number;
  avgKmPerLiter?: number | null;
  avgCostPerKm?: number | null;
}

export interface TimelineEvent {
  id: string;
  type: 'refuel' | 'maintenance';
  date: string;
  description: string;
  vehicleId: string;
  vehicleName?: string;
}

class ReportService {
  /**
   * Obtener resumen de vehículo
   */
  async getVehicleSummary(vehicleId: string): Promise<VehicleSummary> {
    const response = await apiClient.get<VehicleSummary>(`/reports/vehicles/${vehicleId}/summary`);
    return response.data;
  }

  /**
   * Obtener métricas mensuales
   */
  async getMonthlyMetrics(vehicleId: string, month: string): Promise<MonthlyMetrics> {
    const response = await apiClient.get<MonthlyMetrics>(
      `/reports/vehicles/${vehicleId}/monthly?month=${month}`
    );
    return response.data;
  }

  /**
   * Obtener timeline de eventos
   */
  async getTimeline(vehicleId: string, limit?: number): Promise<TimelineEvent[]> {
    const url = limit
      ? `/reports/vehicles/${vehicleId}/timeline?limit=${limit}`
      : `/reports/vehicles/${vehicleId}/timeline`;
    const response = await apiClient.get<TimelineEvent[]>(url);
    return response.data;
  }
}

export const reportService = new ReportService();