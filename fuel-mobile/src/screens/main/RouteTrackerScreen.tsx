/**
 * Screen de Rastreo de Ruta GPS
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouteTracker } from '../../hooks/useRouteTracker';
import { routeService } from '../../services/api/routeService';
import { calculateTotalDistance, formatDuration } from '../../utils/location';
import { Button } from '../../components/common/Button';
import { useVehicle } from '../../context/VehicleContext';
import { vehicleService } from '../../services/api/vehicleService';
import { Vehicle } from '../../services/api/vehicleService';

export default function RouteTrackerScreen() {
  const navigation = useNavigation();
  const { selectedVehicleId } = useVehicle();
  const { isTracking, points, startTime, startTracking, stopTracking, resetTracking } =
    useRouteTracker();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);

  // Actualizar el cronómetro cada segundo cuando está rastreando
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // Interceptar navegación hacia atrás
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isTracking) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Cancelar rastreo',
        '¿Deseas salir? Se perderán los datos de la ruta actual',
        [
          { text: 'Continuar rastreando', style: 'cancel' },
          {
            text: 'Salir y cancelar',
            style: 'destructive',
            onPress: () => {
              resetTracking();
              setRouteName('');
              setIsPaused(false);
              setPausedTime(0);
              setPauseStartTime(null);
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isTracking, resetTracking]);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      setSelectedVehicle(vehicle || null);
    }
  }, [selectedVehicleId, vehicles]);

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.list();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleStart = async () => {
    await startTracking();
  };

  const handleStop = () => {
    stopTracking();
    setShowSaveModal(true);
  };

  const handlePause = () => {
    if (isPaused) {
      // Reanudar
      if (pauseStartTime) {
        const pauseDuration = new Date().getTime() - pauseStartTime.getTime();
        setPausedTime(prev => prev + pauseDuration);
        setPauseStartTime(null);
      }
      setIsPaused(false);
    } else {
      // Pausar
      setPauseStartTime(new Date());
      setIsPaused(true);
    }
  };

  const handleSave = async () => {
    if (points.length < 2) {
      Alert.alert('Error', 'Se necesitan al menos 2 puntos para guardar una ruta');
      setShowSaveModal(false);
      return;
    }

    if (!startTime) {
      Alert.alert('Error', 'Tiempo de inicio no disponible');
      setShowSaveModal(false);
      return;
    }

    if (!routeName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la ruta');
      return;
    }

    if (!selectedVehicleId) {
      Alert.alert('Error', 'No hay un vehículo seleccionado. Selecciona uno desde el inicio.');
      setShowSaveModal(false);
      return;
    }

    setSaving(true);
    try {
      const sortedPoints = [...points].sort((a, b) => 
        new Date(a.ts).getTime() - new Date(b.ts).getTime()
      );
      
      await routeService.create({
        name: routeName.trim(),
        vehicleId: selectedVehicleId,
        points: sortedPoints.map(p => ({
          lat: p.lat,
          lng: p.lng,
          ts: p.ts,
        })),
      });

      setShowSaveModal(false);
      setRouteName('');
      resetTracking();
      
      Alert.alert(
        'Éxito', 
        'Ruta guardada correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error guardando ruta:', error);
      const errorMessage = error.response?.data?.message || error.message || 'No se pudo guardar la ruta';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const currentDuration = startTime
    ? Math.floor((currentTime.getTime() - startTime.getTime() - pausedTime - (isPaused && pauseStartTime ? currentTime.getTime() - pauseStartTime.getTime() : 0)) / 1000)
    : 0;

  const currentDistance =
    points.length >= 2
      ? calculateTotalDistance(points.map(p => ({ lat: p.lat, lng: p.lng })))
      : 0;

  return (
    <View style={styles.background}>
      <ImageBackground
        source={require('../../../assets/images/auth/fondo-light.png')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Rastrear Ruta</Text>
        </View>
        <View style={styles.container}>
          <View style={styles.content}>
            {selectedVehicle && (
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleLabel}>Vehículo seleccionado</Text>
                <Text style={styles.vehicleName}>{selectedVehicle.name}</Text>
              </View>
            )}

            {!selectedVehicleId && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>⚠️ No hay vehículo seleccionado. Selecciona uno desde el inicio.</Text>
              </View>
            )}

            {!isTracking && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre de la ruta</Text>
                <TextInput
                  style={styles.routeInput}
                  placeholder="Ej: Ruta al trabajo"
                  value={routeName}
                  onChangeText={setRouteName}
                />
              </View>
            )}

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Distancia</Text>
                <Text style={styles.statValue}>{currentDistance.toFixed(2)} km</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Duración</Text>
                <Text style={styles.statValue}>{formatDuration(currentDuration)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Puntos</Text>
                <Text style={styles.statValue}>{points.length}</Text>
              </View>
            </View>

        {!isTracking ? (
          <Button
            title="Iniciar Rastreo"
            onPress={handleStart}
            style={styles.button}
            disabled={!selectedVehicleId}
          />
        ) : (
          <>
            <Button
              title={isPaused ? "Reanudar" : "Pausar"}
              onPress={handlePause}
              variant={isPaused ? "primary" : "secondary"}
              style={styles.button}
            />
            <Button
              title="Terminar y Guardar"
              onPress={handleStop}
              variant="success"
              style={styles.button}
              disabled={points.length < 2}
            />
            <Button
              title="Cancelar"
              onPress={() => {
                Alert.alert(
                  'Cancelar rastreo',
                  '¿Deseas cancelar el rastreo? Se perderán los datos',
                  [
                    { text: 'No', style: 'cancel' },
                    { 
                      text: 'Sí, cancelar', 
                      onPress: () => {
                        resetTracking();
                        setRouteName('');
                        setIsPaused(false);
                        setPausedTime(0);
                        setPauseStartTime(null);
                      }, 
                      style: 'destructive' 
                    }
                  ]
                );
              }}
              variant="danger"
              style={styles.button}
            />
          </>
        )}
          </View>
        </View>
      </ImageBackground>

      {/* Modal para guardar ruta */}
      <Modal visible={showSaveModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guardar Ruta</Text>
              <TouchableOpacity onPress={() => {
                setShowSaveModal(false);
              }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Nombre: {routeName || 'Sin nombre'}</Text>
                <Text style={styles.summaryLabel}>Distancia: {currentDistance.toFixed(2)} km</Text>
                <Text style={styles.summaryLabel}>Duración: {formatDuration(currentDuration)}</Text>
                <Text style={styles.summaryLabel}>Puntos: {points.length}</Text>
              </View>

              <Button
                title="Guardar"
                onPress={handleSave}
                loading={saving}
                style={styles.modalButton}
              />

              <Button
                title="Cancelar"
                onPress={() => {
                  setShowSaveModal(false);
                }}
                variant="secondary"
                style={styles.modalButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingTop: 8,
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
  content: {
    flex: 1,
    padding: 24,
    paddingBottom: 100,
    justifyContent: 'center',
  },
  vehicleInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  vehicleLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFECB5',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  routeInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4d00',
  },
  button: {
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    fontSize: 24,
    color: '#8E8E93',
    paddingHorizontal: 8,
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  modalButton: {
    marginBottom: 12,
  },
});