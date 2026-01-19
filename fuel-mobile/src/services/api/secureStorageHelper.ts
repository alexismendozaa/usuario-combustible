/**
 * Helper para almacenamiento seguro con fallback
 * En Android, SecureStore puede no estar disponible, por lo que usamos AsyncStorage como fallback
 * En iOS siempre usamos SecureStore
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Flag para verificar disponibilidad de SecureStore
let isSecureStoreAvailable: boolean | null = null;

/**
 * Verifica si SecureStore está disponible en el dispositivo
 * En Android puede fallar, por lo que necesitamos detectarlo
 */
async function checkSecureStoreAvailability(): Promise<boolean> {
  if (isSecureStoreAvailable !== null) {
    return isSecureStoreAvailable;
  }

  try {
    // Intentar escribir y leer un valor de prueba
    const testKey = '__secure_store_test__';
    const testValue = 'test';
    
    await SecureStore.setItemAsync(testKey, testValue);
    const retrieved = await SecureStore.getItemAsync(testKey);
    
    if (retrieved === testValue) {
      await SecureStore.deleteItemAsync(testKey);
      isSecureStoreAvailable = true;
      return true;
    }
  } catch (error) {
    // Silent fail
  }

  isSecureStoreAvailable = false;
  return false;
}

/**
 * Guarda un valor de forma segura
 * Intenta SecureStore primero, fallback a AsyncStorage
 */
export async function saveSecureValue(key: string, value: string): Promise<void> {
  const useSecure = await checkSecureStoreAvailability();

  try {
    if (useSecure) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    // Fallback doble: si SecureStore falla, intenta AsyncStorage
    if (useSecure) {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (asyncStorageError) {
        throw asyncStorageError;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Recupera un valor de forma segura
 * Intenta SecureStore primero, luego AsyncStorage
 */
export async function getSecureValue(key: string): Promise<string | null> {
  const useSecure = await checkSecureStoreAvailability();

  try {
    if (useSecure) {
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        return value;
      }
    } else {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        return value;
      }
    }
  } catch (error) {
    // Intenta el otro método como fallback
    if (useSecure) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          return value;
        }
      } catch (asyncStorageError) {
        // Silent fail
      }
    }
  }

  return null;
}

/**
 * Elimina un valor de forma segura
 * Intenta eliminar de ambos almacenamientos
 */
export async function removeSecureValue(key: string): Promise<void> {
  const useSecure = await checkSecureStoreAvailability();

  try {
    if (useSecure) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }

    // También intentar eliminar del otro almacenamiento
    try {
      if (useSecure) {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // Ignorar si no existe en el otro
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Elimina múltiples tokens (limpieza de autenticación)
 */
export async function clearAllTokens(tokenKeys: string[]): Promise<void> {
  try {
    await Promise.all(tokenKeys.map((key) => removeSecureValue(key)));
  } catch (error) {
    throw error;
  }
}

export default {
  saveSecureValue,
  getSecureValue,
  removeSecureValue,
  clearAllTokens,
  checkSecureStoreAvailability,
};