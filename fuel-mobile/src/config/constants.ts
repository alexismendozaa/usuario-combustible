/**
 * Configuración de constantes de la aplicación
 */

import { Platform } from 'react-native';

// URL base de la API
// Configuración automática según el entorno:
// - iOS Simulator/Android Emulator: IP de red local (el simulador de iOS puede acceder a localhost del Mac)
// - Android Emulator específicamente usa 10.0.2.2
// - Dispositivo físico: IP de red local
const getApiBaseUrl = () => {
  // Permitir override desde variable de entorno
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  // Para desarrollo en emulador/simulador
  // En producción, cambiar a la URL real del servidor
  if (__DEV__) {
    // Android emulator necesita 10.0.2.2 para acceder al localhost del host
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
    // iOS simulator y otros pueden usar la IP de red local
    return 'http://192.168.0.102:3000';
  }
  
  // Fallback para producción
  return 'http://192.168.0.102:3000';
};

export const API_BASE_URL = getApiBaseUrl();

console.log('API_BASE_URL configurada:', API_BASE_URL);

// Claves para SecureStore
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// Timeouts y configuraciones
export const CONFIG = {
  ACCESS_TOKEN_TTL: 15 * 60 * 1000, // 15 minutos (usado para refrescar antes de expirar)
  REFRESH_TOKEN_TTL: 30 * 24 * 60 * 60 * 1000, // 30 días
  GPS_UPDATE_INTERVAL: 5000, // 5 segundos para tracking de rutas
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Rutas de navegación
export const ROUTES = {
  AUTH: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    VERIFY_EMAIL: 'VerifyEmail',
    FORGOT_PASSWORD: 'ForgotPassword',
    RESET_PASSWORD: 'ResetPassword',
  },
  MAIN: {
    DASHBOARD: 'Dashboard',
    VEHICLES: 'Vehicles',
    REFUELS: 'Refuels',
    STATIONS: 'Stations',
    ROUTES: 'Routes',
    MAINTENANCE: 'Maintenance',
    PAYMENTS: 'Payments',
    PROFILE: 'Profile',
  },
} as const;