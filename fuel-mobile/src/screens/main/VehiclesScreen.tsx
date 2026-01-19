/**
 * Screen de Lista de Vehículos
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { vehicleService, Vehicle } from '../../services/api/vehicleService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { VEHICLE_TYPES } from '../../types/index';

const getVehicleIcon = (type?: string): string => {
  const vehicleType = VEHICLE_TYPES.find(vt => vt.value === type);
  return vehicleType?.icon || 'car'; // Default a car
};

export default function VehiclesScreen() {
  const navigation = useNavigation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.list();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Error', 'No se pudieron cargar los vehículos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // Refetch cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      loadVehicles();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadVehicles();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar vehículo',
      `¿Estás seguro de que deseas eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await vehicleService.delete(id);
              loadVehicles();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el vehículo');
            }
          },
        },
      ]
    );
  };

  if (loading) {
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
          <Text style={styles.headerTitle}>Vehículos</Text>
        </View>
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.vehicleCard}
            onPress={() => navigation.navigate('VehicleDetail' as never, { vehicleId: item.id })}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={getVehicleIcon(item.model) as any} 
                size={40} 
                color="#ff4d00" 
              />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{item.name}</Text>
              {item.brand && item.model && (
                <Text style={styles.vehicleDetails}>
                  {item.brand} {item.year ? `(${item.year})` : ''}
                </Text>
              )}
              {item.plate && <Text style={styles.vehiclePlate}>Placa: {item.plate}</Text>}
              <Text style={styles.vehicleOdometer}>{item.odometerKm} km</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.name)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tienes vehículos registrados</Text>
            <Button
              title="Agregar Vehículo"
              onPress={() => navigation.navigate('VehicleForm' as never)}
              style={[styles.addButton, styles.primaryButton]}
            />
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[styles.listContent, vehicles.length === 0 ? null : { paddingBottom: 100 }]}
      />
      {vehicles.length > 0 && (
        <View style={styles.fabContainer}>
          <Button
            title="+ Agregar"
            onPress={() => navigation.navigate('VehicleForm' as never)}
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
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  vehicleOdometer: {
    fontSize: 14,
    color: '#ff4d00',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 14,
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
  primaryButton: {
    backgroundColor: '#ff4d00',
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