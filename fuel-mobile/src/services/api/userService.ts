/**
 * Servicio de usuario
 * Maneja actualización de perfil, avatar, etc.
 */


import apiClient from './apiClient';
import { Platform } from 'react-native';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { API_BASE_URL, STORAGE_KEYS } from '../../config/constants';
import { getSecureValue } from './secureStorageHelper';

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
   * Subir avatar usando FileSystem.uploadAsync (compatible con iOS y Android en Expo Go)
   */
  async uploadAvatar(uri: string): Promise<{ ok: boolean; user: UserProfile }> {
    // Determinar el nombre del archivo y tipo MIME
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const extension = match ? match[1].toLowerCase() : 'jpg';
    const mimeType = extension === 'png' ? 'image/png' : 
                     extension === 'gif' ? 'image/gif' : 
                     extension === 'webp' ? 'image/webp' : 'image/jpeg';

    // Obtener el token de autenticación
    const token = await getSecureValue(STORAGE_KEYS.ACCESS_TOKEN);

    try {
      // Usar uploadAsync que funciona en Expo Go
      const uploadResult = await LegacyFileSystem.uploadAsync(
        `${API_BASE_URL}/users/me/avatar`,
        uri,
        {
          httpMethod: 'POST',
          uploadType: LegacyFileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType: mimeType,
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        }
      );

      console.log('Upload result status:', uploadResult.status);
      console.log('Upload result body:', uploadResult.body);

      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        const responseData = JSON.parse(uploadResult.body);
        return responseData;
      } else {
        let errorMessage = 'Error al subir avatar';
        try {
          const errorData = JSON.parse(uploadResult.body);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Ignorar errores de parseo
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error en uploadAvatar:', error);
      throw error;
    }
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