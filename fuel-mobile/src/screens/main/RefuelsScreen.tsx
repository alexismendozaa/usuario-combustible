/**
 * Screen de Lista de Recargas
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ImageBackground } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { refuelService, Refuel } from '../../services/api/refuelService';
import { useVehicle } from '../../context/VehicleContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';

export default function RefuelsScreen() {
  const navigation = useNavigation();
  const { selectedVehicleId } = useVehicle();
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRefuels = async () => {
    try {
      const data = await refuelService.list();
      setRefuels(data);
    } catch (error) {
      console.error('Error loading refuels:', error);
      Alert.alert('Error', 'No se pudieron cargar las recargas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRefuels();
  }, []);

  // Refetch cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      loadRefuels();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRefuels();
  };

  // Filtrar recargas por vehículo seleccionado
  const filteredRefuels = selectedVehicleId
    ? refuels.filter(r => r.vehicleId === selectedVehicleId)
    : [];

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
          <Text style={styles.headerTitle}>Recargas</Text>
        </View>
        <FlatList
        data={filteredRefuels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.refuelCard}
            onPress={() => {
              // TODO: Navigate to refuel detail/edit
            }}
          >
            <View style={styles.refuelHeader}>
              <Text style={styles.refuelDate}>
                {new Date(item.filledAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.refuelInfo}>
              <Text style={styles.refuelLiters}>{Number(item.liters)} gal</Text>
              <Text style={styles.refuelCost}>${Number(item.totalCost).toFixed(2)}</Text>
            </View>
            <Text style={styles.refuelOdometer}>Odómetro: {item.odometerKm} km</Text>
            {item.note && <Text style={styles.refuelNote}>{item.note}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay recargas registradas para este vehículo</Text>
            <Button
              title="Agregar Recarga"
              onPress={() => navigation.navigate('RefuelForm' as never)}
              style={[styles.addButton, styles.primaryButton]}
            />
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />
      {filteredRefuels.length > 0 && (
        <View style={styles.fabContainer}>
          <Button
            title="+ Agregar"
            onPress={() => navigation.navigate('RefuelForm' as never)}
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
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 16,
  },
  refuelCard: {
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
  refuelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refuelDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  refuelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refuelLiters: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff4d00',
  },
  refuelCost: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  refuelOdometer: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  refuelNote: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
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
  },  primaryButton: {
    backgroundColor: '#ff4d00',
  },  fabContainer: {
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