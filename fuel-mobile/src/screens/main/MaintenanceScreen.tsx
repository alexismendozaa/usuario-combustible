/**
 * Screen de Mantenimientos
 * Permite ver, agregar y registrar mantenimientos
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useVehicle } from '../../context/VehicleContext';
import { maintenanceService, MaintenanceItem, CreateMaintenanceItemData } from '../../services/api/maintenanceService';
import { vehicleService, Vehicle } from '../../services/api/vehicleService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Picker, PickerOption } from '../../components/common/Picker';
import { MAINTENANCE_TYPES, getMaintenanceLabel } from '../../types/index';
import BottomNavigation from '../../components/common/BottomNavigation';

export default function MaintenanceScreen() {
  const navigation = useNavigation();
  const { selectedVehicleId: contextVehicleId } = useVehicle();
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedItemForLog, setSelectedItemForLog] = useState<MaintenanceItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [intervalKm, setIntervalKm] = useState('');
  const [intervalMonths, setIntervalMonths] = useState('');

  // Log form state
  const [logOdometerKm, setLogOdometerKm] = useState('');
  const [logCost, setLogCost] = useState('');
  const [logNote, setLogNote] = useState('');

  const loadData = async () => {
    try {
      const [itemsData, vehiclesData] = await Promise.all([
        maintenanceService.listItems(),
        vehicleService.list(),
      ]);
      setItems(itemsData);
      setVehicles(vehiclesData);
      if (vehiclesData.length > 0) {
        setSelectedVehicleId(vehiclesData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refetch cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setIntervalKm('');
    setIntervalMonths('');
  };

  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      Alert.alert('Error', 'Selecciona un vehículo');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Selecciona el tipo de mantenimiento');
      return;
    }

    setSubmitting(true);
    try {
      const data: CreateMaintenanceItemData = {
        vehicleId: selectedVehicleId,
        title: title.trim(),
        notes: notes.trim() || undefined,
        intervalKm: intervalKm ? parseInt(intervalKm) : undefined,
        intervalMonths: intervalMonths ? parseInt(intervalMonths) : undefined,
        // NO enviamos lastDoneOdometerKm ni lastDoneAt al crear
        // Solo se llenan cuando el usuario registra la realización
      };

      await maintenanceService.createItem(data);
      Alert.alert('Éxito', 'Mantenimiento creado correctamente');
      resetForm();
      setShowForm(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear el mantenimiento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogMaintenance = async () => {
    if (!selectedItemForLog) return;

    if (!logOdometerKm || !logCost) {
      Alert.alert('Error', 'Ingresa el kilometraje y el costo');
      return;
    }

    setSubmitting(true);
    try {
      await maintenanceService.createLog(selectedItemForLog.id, {
        doneAt: new Date().toISOString(),
        odometerKm: parseInt(logOdometerKm),
        cost: parseFloat(logCost),
        note: logNote.trim() || undefined,
      });

      Alert.alert('Éxito', 'Realización registrada correctamente');
      setShowLogModal(false);
      setSelectedItemForLog(null);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo registrar la realización');
    } finally {
      setSubmitting(false);
    }
  };


  const handleDeleteItem = (id: string) => {
    Alert.alert('Eliminar mantenimiento', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await maintenanceService.deleteItem(id);
            loadData();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el mantenimiento');
          }
        },
      },
    ]);
  };

  const vehicleOptions: PickerOption[] = vehicles.map((v) => ({
    label: `${v.name} (${v.brand || 'Sin marca'})`,
    value: v.id,
  }));

  // Filtrar items por vehículo seleccionado del contexto
  const filteredItems = contextVehicleId
    ? items.filter(i => i.vehicleId === contextVehicleId)
    : [];

  if (loading || !contextVehicleId) {
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
          <Text style={styles.headerTitle}>Mantenimientos</Text>
        </View>
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const vehicle = vehicles.find((v) => v.id === item.vehicleId);
            return (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleSection}>
                  <Text style={styles.itemTitle}>{getMaintenanceLabel(item.title)}</Text>
                  <Text style={styles.vehicleName}>
                    {vehicle?.name || 'Vehículo desconocido'}
                  </Text>
                  <View style={[styles.statusBadge, (item.lastDoneAt && item.lastDoneAt !== '') ? styles.statusDone : styles.statusPending]}>
                    <Text style={styles.statusText}>
                      {(item.lastDoneAt && item.lastDoneAt !== '') ? '✓ Realizado' : '⏱ Pendiente'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Botón de Eliminar */}
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteItem(item.id)}
              >
                <MaterialCommunityIcons name="delete-outline" size={20} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>

              {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}

              <View style={styles.itemDetails}>
                {item.intervalKm && (
                  <Text style={styles.detailText}>📏 Cada {item.intervalKm} km</Text>
                )}
                {item.intervalMonths && (
                  <Text style={styles.detailText}>📅 Cada {item.intervalMonths} meses</Text>
                )}
                {item.lastDoneAt && (
                  <Text style={styles.detailText}>
                    ✓ Última vez: {new Date(item.lastDoneAt).toLocaleDateString('es-ES')}
                  </Text>
                )}
                {item.lastDoneOdometerKm && (
                  <Text style={styles.detailText}>📊 En: {item.lastDoneOdometerKm} km</Text>
                )}
              </View>

              <Button
                title={item.lastDoneAt ? "Ya Realizado" : "Registrar Realización"}
                onPress={() => {
                  setSelectedItemForLog(item);
                  setLogOdometerKm('');
                  setLogCost('');
                  setLogNote('');
                  setShowLogModal(true);
                }}
                variant="secondary"
                style={styles.logButton}
                disabled={!!(item.lastDoneAt && item.lastDoneAt !== '')}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay mantenimientos registrados para este vehículo</Text>
            <Text style={styles.emptySubtext}>Agrega uno para empezar a hacer seguimiento</Text>
            <Button
              title="Agregar mantenimiento"
              onPress={() => setShowForm(true)}
              style={styles.addButton}
            />
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.fabContainer}>
        <Button
          title="+ Agregar"
          onPress={() => setShowForm(true)}
          style={styles.fab}
        />
      </View>

      {/* Modal de Formulario */}
      <Modal visible={showForm} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Mantenimiento</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              {/* Vehículo */}
              <Picker
                label="Vehículo"
                options={vehicleOptions}
                value={selectedVehicleId}
                onValueChange={setSelectedVehicleId}
                placeholder="Selecciona un vehículo"
                required
              />

              {/* Tipo de Mantenimiento */}
              <Picker
                label="Tipo de Mantenimiento"
                options={MAINTENANCE_TYPES}
                value={title}
                onValueChange={setTitle}
                placeholder="Selecciona el tipo"
                required
              />

              {/* Notas */}
              <Input
                label="Notas (Opcional)"
                placeholder="Especificaciones, detalles, etc."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              {/* Intervalo en KM */}
              <Input
                label="Intervalo (km) - Opcional"
                placeholder="Ej: 5000"
                value={intervalKm}
                onChangeText={setIntervalKm}
                keyboardType="number-pad"
              />

              {/* Intervalo en Meses */}
              <Input
                label="Intervalo (meses) - Opcional"
                placeholder="Ej: 6"
                value={intervalMonths}
                onChangeText={setIntervalMonths}
                keyboardType="number-pad"
              />

              {/* Botones */}
              <Button
                title="Crear"
                onPress={handleSubmit}
                loading={submitting}
                style={styles.submitButton}
              />

              <Button
                title="Cancelar"
                onPress={() => {
                  Alert.alert(
                    'Cancelar',
                    '¿Seguro que deseas cancelar?',
                    [
                      { text: 'No', style: 'cancel' },
                      { 
                        text: 'Sí', 
                        onPress: () => {
                          setShowForm(false);
                          resetForm();
                        }
                      }
                    ]
                  );
                }}
                variant="secondary"
                style={styles.cancelButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Registro de Realización */}
      <Modal visible={showLogModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Realización</Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              {selectedItemForLog && (
                <View style={styles.logItemInfo}>
                  <Text style={styles.logItemTitle}>{selectedItemForLog.title}</Text>
                  <Text style={styles.logItemVehicle}>
                    {vehicles.find((v) => v.id === selectedItemForLog.vehicleId)?.name || 'Vehículo'}
                  </Text>
                </View>
              )}

              <Input
                label="Kilometraje Actual"
                placeholder="Ej: 50000"
                value={logOdometerKm}
                onChangeText={setLogOdometerKm}
                keyboardType="numeric"
                required
              />

              <Input
                label="Costo Total ($)"
                placeholder="Ej: 45.50"
                value={logCost}
                onChangeText={setLogCost}
                keyboardType="decimal-pad"
                required
              />

              <Input
                label="Notas (Opcional)"
                placeholder="Detalles, observaciones, etc."
                value={logNote}
                onChangeText={setLogNote}
                multiline
                numberOfLines={3}
              />

              {/* Botones */}
              <Button
                title="Registrar"
                onPress={handleLogMaintenance}
                loading={submitting}
                style={styles.submitButton}
              />

              <Button
                title="Cancelar"
                onPress={() => {
                  Alert.alert(
                    'Cancelar',
                    '¿Seguro que deseas cancelar?',
                    [
                      { text: 'No', style: 'cancel' },
                      { 
                        text: 'Sí', 
                        onPress: () => {
                          setShowLogModal(false);
                          setSelectedItemForLog(null);
                        }
                      }
                    ]
                  );
                }}
                variant="secondary"
                style={styles.cancelButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    padding: 12,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitleSection: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  statusDone: {
    backgroundColor: '#34C759',
  },
  statusPending: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: '300',
  },
  itemNotes: {
    fontSize: 13,
    color: '#555555',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  itemDetails: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 4,
    lineHeight: 18,
  },
  logButton: {
    paddingVertical: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#C7C7CC',
    marginBottom: 12,
  },
  addButton: {
    marginTop: 8,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    fontSize: 28,
    color: '#C7C7CC',
    fontWeight: '300',
  },
  formContent: {
    padding: 16,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 32,
  },
  logItemInfo: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  logItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  logItemVehicle: {
    fontSize: 12,
    color: '#8E8E93',
  },
});