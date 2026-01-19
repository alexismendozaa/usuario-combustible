/**
 * Cliente HTTP configurado con Axios
 * Incluye interceptores para manejo automático de JWT y refresh tokens
 * Con soporte para Android (SecureStore + AsyncStorage fallback)
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../../config/constants';
import { 
  saveSecureValue, 
  getSecureValue, 
  removeSecureValue, 
  clearAllTokens 
} from './secureStorageHelper';

// Interfaz para la respuesta del refresh token
interface RefreshTokenResponse {
  accessToken: string;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Interceptor de solicitudes: añade el token de acceso
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const token = await getSecureValue(STORAGE_KEYS.ACCESS_TOKEN);
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Error getting access token:', error);
        }
        // No sobrescribir Content-Type si es FormData (se establece automáticamente)
        if (config.data instanceof FormData && config.headers) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor de respuestas: maneja errores 401 y refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // No intentar refresh en rutas de autenticación
        const authPaths = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/verify-email', '/auth/forgot-password', '/auth/reset-password'];
        const isAuthPath = authPaths.some(path => originalRequest.url?.includes(path));

        // Si es 401 y no hemos intentado refrescar ya, y NO es una ruta de auth
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthPath) {
          if (this.isRefreshing) {
            // Si ya hay un refresh en proceso, esperar
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            let refreshToken: string | null = null;
            try {
              refreshToken = await getSecureValue(STORAGE_KEYS.REFRESH_TOKEN);
            } catch (error) {
              // Silent
            }
            
            if (!refreshToken) {
              await this.clearTokens();
              this.processQueue(new Error('No refresh token available'), null);
              this.isRefreshing = false;
              return Promise.reject(new Error('Session expired. Please login again.'));
            }

            // Intentar refrescar el token
            const response = await axios.post<RefreshTokenResponse>(
              `${API_BASE_URL}/auth/refresh`,
              { refreshToken }
            );

            const { accessToken } = response.data;

            if (!accessToken) {
              throw new Error('Server did not return new access token');
            }

            // Guardar nuevo access token
            await saveSecureValue(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

            // Procesar cola de peticiones fallidas
            this.processQueue(null, accessToken);

            // Reintentar petición original
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            
            return this.client(originalRequest);
          } catch (refreshError: any) {
            // Si el refresh falla, limpiar tokens y redirigir a login
            this.processQueue(refreshError, null);
            await this.clearTokens();
            this.isRefreshing = false;
            // El error se propagará y el componente podrá manejar el logout
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: unknown, token: string | null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private async clearTokens() {
    const tokenKeys = Object.values(STORAGE_KEYS);
    await clearAllTokens(tokenKeys);
  }

  // Métodos públicos para acceso al cliente
  get instance(): AxiosInstance {
    return this.client;
  }

  // Helper para limpiar tokens (útil para logout)
  async clearAuth(): Promise<void> {
    await this.clearTokens();
  }
}

export const apiClient = new ApiClient();
export default apiClient.instance;