/**
 * Servicio de recargas de combustible
 */

import apiClient from './apiClient';

export interface CreateRefuelData {
  vehicleId: string;
  filledAt?: string; // ISO date string
  odometerKm: number;
  liters: number;
  totalCost: number;
  paymentMethod?: string;
  fullTank?: boolean;
  note?: string;
  lat?: number;
  lng?: number;
}

export interface UpdateRefuelData extends Partial<CreateRefuelData> {}

export interface Refuel {
  id: string;
  userId: string;
  vehicleId: string;
  filledAt: string;
  odometerKm: number;
  liters: number;
  totalCost: number;
  paymentMethod?: string;
  fullTank?: boolean;
  note?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

class RefuelService {
  /**
   * Crear recarga
   */
  async create(data: CreateRefuelData): Promise<Refuel> {
    const response = await apiClient.post<Refuel>('/refuels', data);
    return response.data;
  }

  /**
   * Listar recargas (opcionalmente filtradas por vehículo)
   */
  async list(vehicleId?: string): Promise<Refuel[]> {
    const url = vehicleId ? `/refuels?vehicleId=${vehicleId}` : '/refuels';
    const response = await apiClient.get<Refuel[]>(url);
    return response.data;
  }

  /**
   * Obtener recarga por ID
   */
  async getById(id: string): Promise<Refuel> {
    const response = await apiClient.get<Refuel>(`/refuels/${id}`);
    return response.data;
  }

  /**
   * Actualizar recarga
   */
  async update(id: string, data: UpdateRefuelData): Promise<Refuel> {
    const response = await apiClient.patch<Refuel>(`/refuels/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar recarga
   */
  async delete(id: string): Promise<{ ok: boolean }> {
    const response = await apiClient.delete<{ ok: boolean }>(`/refuels/${id}`);
    return response.data;
  }
}

export const refuelService = new RefuelService();