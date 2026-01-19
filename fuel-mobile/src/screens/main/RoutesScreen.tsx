/**
 * Screen de Lista de Rutas
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVehicle } from '../../context/VehicleContext';
import { routeService, RouteSummary } from '../../services/api/routeService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { formatDuration } from '../../utils/location';

export default function RoutesScreen() {
  const navigation = useNavigation();
  const { selectedVehicleId } = useVehicle();
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoutes = async () => {
    try {
      const data = await routeService.list();
      setRoutes(data);
    } catch (error) {
      console.error('Error loading routes:', error);
      Alert.alert('Error', 'No se pudieron cargar las rutas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  // Filtrar rutas por vehículo seleccionado
  const filteredRoutes = selectedVehicleId
    ? routes.filter(r => r.vehicleId === selectedVehicleId)
    : [];

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar ruta', '¿Estás seguro de que deseas eliminar esta ruta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await routeService.delete(id);
            loadRoutes();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar la ruta');
          }
        },
      },
    ]);
  };

  if (loading || !selectedVehicleId) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.background}>
      <ImageBackground
        source={require('../../../assets/images/auth/fondo-light.png')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Rutas</Text>
        </View>
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.routeCard}
            onPress={() =>
              navigation.navigate('RouteDetail' as never, { routeId: item.id })
            }
          >
            <View style={styles.routeHeader}>
              <Text style={styles.routeName}>{item.name || 'Ruta sin nombre'}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.routeDate}>
              {new Date(item.startedAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <View style={styles.routeStats}>
              <Text style={styles.routeStat}>
                Distancia: {Number(item.distanceKm).toFixed(2)} km
              </Text>
              <Text style={styles.routeStat}>Duración: {formatDuration(item.durationSec)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay rutas registradas para este vehículo</Text>
            <Button
              title="Iniciar Ruta"
              onPress={() => navigation.navigate('RouteTracker' as never)}
              style={styles.addButton}
            />
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />
      {filteredRoutes.length > 0 && (
        <View style={styles.fabContainer}>
          <Button
            title="Iniciar Ruta"
            onPress={() => navigation.navigate('RouteTracker' as never)}
            style={styles.fab}
          />
        </View>
      )}
        </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 0,
  },
  backgroundImageStyle: {
    top: 36,
    borderRadius: 0,
  },
  headerTitleContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  routeDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeStat: {
    fontSize: 14,
    color: '#ff4d00',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  addButton: {
    minWidth: 200,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
  },
  fab: {
    minWidth: 140,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 28,
  },
});