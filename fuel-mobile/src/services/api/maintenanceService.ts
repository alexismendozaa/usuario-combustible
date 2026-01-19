/**
 * Servicio de mantenimientos
 */

import apiClient from './apiClient';

export interface CreateMaintenanceItemData {
  vehicleId: string;
  title: string;
  notes?: string;
  intervalKm?: number;
  intervalMonths?: number;
  lastDoneOdometerKm?: number;
  lastDoneAt?: string; // ISO date string
}

export interface UpdateMaintenanceItemData extends Partial<CreateMaintenanceItemData> {}

export interface MaintenanceItem {
  id: string;
  userId: string;
  vehicleId: string;
  title: string;
  notes?: string;
  intervalKm?: number;
  intervalMonths?: number;
  lastDoneOdometerKm?: number;
  lastDoneAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceLogData {
  doneAt?: string; // ISO date string
  odometerKm?: number;
  cost?: number;
  note?: string;
}

export interface MaintenanceLog {
  id: string;
  maintenanceItemId: string;
  vehicleId: string;
  doneAt: string;
  odometerKm?: number;
  cost?: number;
  note?: string;
  createdAt: string;
}

class MaintenanceService {
  /**
   * Crear tarea de mantenimiento
   */
  async createItem(data: CreateMaintenanceItemData): Promise<MaintenanceItem> {
    const response = await apiClient.post<MaintenanceItem>('/maintenance/items', data);
    return response.data;
  }

  /**
   * Listar tareas de mantenimiento (opcionalmente filtradas por vehículo)
   */
  async listItems(vehicleId?: string): Promise<MaintenanceItem[]> {
    const url = vehicleId ? `/maintenance/items?vehicleId=${vehicleId}` : '/maintenance/items';
    const response = await apiClient.get<MaintenanceItem[]>(url);
    return response.data;
  }

  /**
   * Obtener tarea por ID
   */
  async getItemById(id: string): Promise<MaintenanceItem> {
    const response = await apiClient.get<MaintenanceItem>(`/maintenance/items/${id}`);
    return response.data;
  }

  /**
   * Actualizar tarea
   */
  async updateItem(id: string, data: UpdateMaintenanceItemData): Promise<MaintenanceItem> {
    const response = await apiClient.patch<MaintenanceItem>(`/maintenance/items/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar tarea
   */
  async deleteItem(id: string): Promise<{ ok: boolean }> {
    const response = await apiClient.delete<{ ok: boolean }>(`/maintenance/items/${id}`);
    return response.data;
  }

  /**
   * Registrar log de mantenimiento (marcar como realizado)
   */
  async createLog(itemId: string, data: CreateMaintenanceLogData): Promise<MaintenanceLog> {
    const response = await apiClient.post<MaintenanceLog>(
      `/maintenance/items/${itemId}/log`,
      data
    );
    return response.data;
  }

  /**
   * Obtener historial de logs de una tarea
   */
  async getLogs(itemId: string): Promise<MaintenanceLog[]> {
    const response = await apiClient.get<MaintenanceLog[]>(`/maintenance/items/${itemId}/logs`);
    return response.data;
  }

  /**
   * Obtener tareas pendientes
   */
  async getDue(vehicleId?: string, odometerKm?: number): Promise<MaintenanceItem[]> {
    let url = '/maintenance/due';
    const params = new URLSearchParams();
    if (vehicleId) params.append('vehicleId', vehicleId);
    if (odometerKm !== undefined) params.append('odometerKm', odometerKm.toString());
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await apiClient.get<MaintenanceItem[]>(url);
    return response.data;
  }
}

export const maintenanceService = new MaintenanceService();