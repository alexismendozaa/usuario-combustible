/**
 * Servicio de autenticación
 * Maneja login, registro, verificación de email, recuperación de contraseña
 */

import { apiClient } from './apiClient';
import apiClientInstance from './apiClient';
import { 
  saveSecureValue, 
  getSecureValue, 
  removeSecureValue, 
  clearAllTokens 
} from './secureStorageHelper';
import { STORAGE_KEYS } from '../../config/constants';

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}

export interface User {
  userId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

class AuthService {
  /**
   * Registro de usuario
   */
  async register(data: RegisterData): Promise<{ message: string }> {
    const response = await apiClientInstance.post('/auth/register', data);
    return response.data;
  }

  /**
   * Login de usuario
   */
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const response = await apiClientInstance.post<LoginResponse>('/auth/login', data);

      // Validar que tenemos los tokens
      if (!response.data.accessToken || !response.data.refreshToken) {
        throw new Error('No se recibieron tokens de autenticación');
      }

      // Guardar tokens usando helper con fallback
      await saveSecureValue(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
      await saveSecureValue(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);

      // Guardar datos de usuario
      await saveSecureValue(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(response.data.user)
      );

      return response.data;
    } catch (error: any) {
      // Extraer el mensaje del servidor primero
      const serverMessage = error?.response?.data?.message;
      
      if (serverMessage) {
        // Si el servidor envió un mensaje específico, usarlo
        const err = new Error(serverMessage);
        (err as any).response = error.response;
        throw err;
      }
      
      // Si no hay mensaje del servidor, usar genéricos
      if (error?.response?.status === 401) {
        throw new Error('Correo o contraseña incorrectos');
      }
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error('No se pudo iniciar sesión. Intenta nuevamente.');
    }
  }

  /**
   * Verificar email con token
   */
  async verifyEmail(data: VerifyEmailData): Promise<{ ok: boolean; message: string }> {
    const response = await apiClientInstance.post('/auth/verify-email', data);
    return response.data;
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const response = await apiClientInstance.post('/auth/forgot-password', data);
    return response.data;
  }

  /**
   * Resetear contraseña con token
   */
  async resetPassword(data: ResetPasswordData): Promise<{ ok: boolean }> {
    const response = await apiClientInstance.post('/auth/reset-password', data);
    return response.data;
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClientInstance.get<User>('/users/me');
    return response.data;
  }

  /**
   * Logout - limpiar tokens
   */
  async logout(): Promise<void> {
    try {
      // Intentar notificar al servidor (puede fallar, pero continuar con limpieza local)
      try {
        const refreshToken = await getSecureValue(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          await apiClientInstance.post('/auth/logout', { refreshToken });
        }
      } catch (serverError) {
        console.log('Server logout notification failed (continuing with cleanup):', serverError);
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar tokens usando helper
      const tokenKeys = Object.values(STORAGE_KEYS);
      await clearAllTokens(tokenKeys);
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await getSecureValue(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  }

  /**
   * Obtener datos de usuario guardados
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await getSecureValue(STORAGE_KEYS.USER_DATA);
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo usuario almacenado:', error);
      return null;
    }
  }
}

export const authService = new AuthService();