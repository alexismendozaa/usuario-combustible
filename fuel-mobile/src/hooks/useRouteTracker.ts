/**
 * Hook para tracking de rutas GPS
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { requestLocationPermissions, getCurrentLocation } from '../utils/location';
import { RoutePoint } from '../services/api/routeService';
import { CONFIG } from '../config/constants';

interface UseRouteTrackerOptions {
  onLocationUpdate?: (point: RoutePoint) => void;
  updateInterval?: number;
}

export interface RouteTrackerState {
  isTracking: boolean;
  points: RoutePoint[];
  startTime: Date | null;
  error: string | null;
}

export function useRouteTracker(options: UseRouteTrackerOptions = {}) {
  const {
    onLocationUpdate,
    updateInterval = CONFIG.GPS_UPDATE_INTERVAL,
  } = options;

  const [state, setState] = useState<RouteTrackerState>({
    isTracking: false,
    points: [],
    startTime: null,
    error: null,
  });

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    try {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        setState((prev) => ({
          ...prev,
          error: 'Permisos de ubicación no otorgados',
        }));
        return;
      }

      const startTime = new Date();
      setState({
        isTracking: true,
        points: [],
        startTime,
        error: null,
      });

      // Obtener ubicación inicial
      const initialLocation = await getCurrentLocation();
      if (initialLocation) {
        const initialPoint: RoutePoint = {
          lat: initialLocation.latitude,
          lng: initialLocation.longitude,
          ts: new Date(initialLocation.timestamp).toISOString(),
        };
        setState((prev) => ({
          ...prev,
          points: [initialPoint],
        }));
        onLocationUpdate?.(initialPoint);
      }

      // Configurar watch para actualizaciones periódicas
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Actualizar cada 10 metros
          timeInterval: updateInterval,
        },
        (location) => {
          const point: RoutePoint = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            ts: new Date(location.timestamp).toISOString(),
          };
          setState((prev) => ({
            ...prev,
            points: [...prev.points, point],
          }));
          onLocationUpdate?.(point);
        }
      );
    } catch (error) {
      console.error('Error starting tracking:', error);
      setState((prev) => ({
        ...prev,
        isTracking: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, [onLocationUpdate, updateInterval]);

  const stopTracking = useCallback(() => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isTracking: false,
    }));
  }, []);

  const resetTracking = useCallback(() => {
    stopTracking();
    setState({
      isTracking: false,
      points: [],
      startTime: null,
      error: null,
    });
  }, [stopTracking]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    resetTracking,
  };
}