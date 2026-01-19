/**
 * Servicio de usuario
 * Maneja actualización de perfil, avatar, etc.
 */

import apiClient from './apiClient';

export interface UpdateNameData {
  name: string;
}

export interface UpdateEmailData {
  newEmail: string;
  currentPassword?: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

class UserService {
  /**
   * Actualizar nombre del usuario
   */
  async updateName(data: UpdateNameData): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>('/users/me/name', data);
    return response.data;
  }

  /**
   * Solicitar cambio de email
   */
  async requestEmailChange(data: UpdateEmailData): Promise<{ message: string }> {
    const response = await apiClient.patch('/users/me/email', data);
    return response.data;
  }

  /**
   * Cambiar contraseña
   */
  async updatePassword(data: UpdatePasswordData): Promise<{ ok: boolean; message: string }> {
    const response = await apiClient.patch('/users/me/password', data);
    return response.data;
  }

  /**
   * Eliminar cuenta
   */
  async deleteAccount(password: string): Promise<{ ok: boolean; message: string }> {
    const response = await apiClient.delete('/users/me', {
      data: { password }
    });
    return response.data;
  }

  /**
   * Subir avatar
   */
  async uploadAvatar(uri: string): Promise<{ ok: boolean; user: UserProfile }> {
    // Crear FormData para multipart/form-data
    const formData = new FormData();
    
    // Obtener nombre del archivo desde la URI
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post<{ ok: boolean; user: UserProfile }>(
      '/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Eliminar avatar
   */
  async deleteAvatar(): Promise<{ ok: boolean }> {
    const response = await apiClient.delete<{ ok: boolean }>('/users/me/avatar');
    return response.data;
  }
}

export const userService = new UserService();