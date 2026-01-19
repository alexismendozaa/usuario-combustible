/**
 * Contexto de autenticación
 * Maneja el estado global de autenticación del usuario
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService, User } from '../services/api/authService';
import { STORAGE_KEYS } from '../config/constants';
import { saveSecureValue, getSecureValue } from '../services/api/secureStorageHelper';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario al iniciar
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        // Intentar obtener usuario del servidor
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          // Actualizar datos almacenados
          await saveSecureValue(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
        } catch (error: any) {
          console.warn('Failed to get current user, trying stored user:', error.message);
          // Si falla (ej: sesión expirada), intentar cargar desde almacenamiento local
          const storedUser = await authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          } else {
            // Si no hay usuario almacenado, hacer logout
            console.log('No stored user found, clearing auth');
            await authService.logout();
            setUser(null);
          }
        }
      } else {
        // Si isAuthenticated es false, asegurarse de que user es null
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // En caso de error, empezar sesión limpia
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    await authService.register({ email, password, name });
    // No hacer login automático, el usuario debe verificar email primero
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      await saveSecureValue(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const requestPasswordReset = async (email: string) => {
    await authService.forgotPassword({ email });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};