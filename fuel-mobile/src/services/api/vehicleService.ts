/**
 * Servicio de vehículos
 */

import apiClient from './apiClient';

export interface CreateVehicleData {
  name: string;
  brand?: string;
  model?: string;
  year?: number;
  plate?: string;
  fuelType?: string;
  odometerKm?: number;
  tankCapacity?: number;
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {}

export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  brand?: string;
  model?: string;
  year?: number;
  plate?: string;
  fuelType?: string;
  odometerKm: number;
  tankCapacity?: number;
  createdAt: string;
  updatedAt: string;
}

class VehicleService {
  /**
   * Crear vehículo
   */
  async create(data: CreateVehicleData): Promise<Vehicle> {
    const response = await apiClient.post<Vehicle>('/vehicles', data);
    return response.data;
  }

  /**
   * Listar vehículos del usuario
   */
  async list(): Promise<Vehicle[]> {
    const response = await apiClient.get<Vehicle[]>('/vehicles');
    return response.data;
  }

  /**
   * Obtener vehículo por ID
   */
  async getById(id: string): Promise<Vehicle> {
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  }

  /**
   * Actualizar vehículo
   */
  async update(id: string, data: UpdateVehicleData): Promise<Vehicle> {
    const response = await apiClient.patch<Vehicle>(`/vehicles/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar vehículo
   */
  async delete(id: string): Promise<{ ok: boolean }> {
    const response = await apiClient.delete<{ ok: boolean }>(`/vehicles/${id}`);
    return response.data;
  }
}

export const vehicleService = new VehicleService();