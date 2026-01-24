/**
 * Screen de Dashboard / Inicio
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Dimensions, 
  TouchableOpacity, 
  ImageBackground,
  Image,
  Modal,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useVehicle } from '../../context/VehicleContext';
import { vehicleService, Vehicle } from '../../services/api/vehicleService';
import { refuelService, Refuel } from '../../services/api/refuelService';
import { reportService, VehicleSummary, MonthlyMetrics } from '../../services/api/reportService';
import { maintenanceService, MaintenanceItem } from '../../services/api/maintenanceService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { VEHICLE_TYPES, getMaintenanceLabel } from '../../types/index';

const screenWidth = Dimensions.get('window').width;

const getVehicleIcon = (
  type?: string
): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
  const vehicleType = VEHICLE_TYPES.find(vt => vt.value === type);
  return (vehicleType?.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']) || 'car';
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const { selectedVehicleId: contextVehicleId, setSelectedVehicle } = useVehicle();
  const navigation = useNavigation<any>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehicleSummary, setVehicleSummary] = useState<VehicleSummary | null>(null);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics[]>([]);
  const [recentRefuels, setRecentRefuels] = useState<Refuel[]>([]);
  const [pendingMaintenances, setPendingMaintenances] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);

  const loadVehicles = async () => {
    try {
      const vehiclesData = await vehicleService.list();
      setVehicles(vehiclesData);
      
      // Auto-seleccionar el vehículo del contexto o el primero
      const vehicleToSelect = vehiclesData.find(v => v.id === contextVehicleId) || vehiclesData[0];
      if (vehicleToSelect) {
        setSelectedVehicleId(vehicleToSelect.id);
        setSelectedVehicle(vehicleToSelect.id, vehicleToSelect.name);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setLoading(false);
    }
  };

  const loadVehicleData = async (vehicleId: string) => {
    if (!vehicleId) return;
    
    try {
      const [summary, refuelsData, maintenanceItems] = await Promise.all([
        reportService.getVehicleSummary(vehicleId),
        refuelService.list(),
        maintenanceService.listItems(),
      ]);
      
      setVehicleSummary(summary);
      // Filtrar solo las recargas de este vehículo
      const vehicleRefuels = refuelsData
        .filter(r => r.vehicleId === vehicleId)
        .sort((a, b) => new Date(b.filledAt).getTime() - new Date(a.filledAt).getTime())
        .slice(0, 5);
      setRecentRefuels(vehicleRefuels);

      // Filtrar mantenimientos pendientes de este vehículo (solo los NO realizados)
      const vehicleMaintenances = maintenanceItems.filter(
        m => m.vehicleId === vehicleId && (!m.lastDoneAt || m.lastDoneAt === '')
      );
      setPendingMaintenances(vehicleMaintenances);

      // Cargar últimos 6 meses de datos
      const monthlyData: MonthlyMetrics[] = [];
      const now = new Date();
      
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        try {
          const metrics = await reportService.getMonthlyMetrics(vehicleId, monthStr);
          monthlyData.unshift(metrics); // Agregar al inicio para mantener orden cronológico
        } catch (err) {
          // Ignorar errores por meses sin datos
          console.log(`No hay datos para ${monthStr}`);
        }
      }
      
      setMonthlyMetrics(monthlyData);
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      setLoading(true);
      loadVehicleData(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVehicles();
    if (selectedVehicleId) {
      loadVehicleData(selectedVehicleId);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  
  /**
   * Cálculo de combustible restante (estimado)
   * 
   * Lógica mejorada:
   * 1. Si el usuario llenó el tanque (fullTank=true), sabemos que después de esa
   *    recarga tenía el tanque lleno (tankCapacity galones)
   * 2. Calculamos cuántos galones se han consumido desde esa recarga usando
   *    el rendimiento promedio (avgKmPerLiter) y los km recorridos
   * 3. Restamos lo consumido del tanque lleno para obtener lo que queda
   * 
   * Si no hay tankCapacity configurada, no podemos calcular el %
   */
  type FuelStatus = 
    | { status: 'ok'; liters: number; percentage: number; isEstimate: boolean }
    | { status: 'no_tank_capacity' }
    | { status: 'no_refuels' }
    | { status: 'no_data' };

  const estimatedRemainingFuel = (): FuelStatus => {
    if (!selectedVehicle) {
      return { status: 'no_data' };
    }
    
    // Usar la capacidad del tanque del vehículo
    const tankCapacity = selectedVehicle.tankCapacity 
      ? Number(selectedVehicle.tankCapacity) 
      : null;
    
    // Si no hay capacidad de tanque configurada
    if (!tankCapacity) {
      return { status: 'no_tank_capacity' };
    }

    // Si no hay recargas
    if (!recentRefuels || recentRefuels.length === 0) {
      return { status: 'no_refuels' };
    }

    // Ordenar recargas por odómetro ascendente (de más antigua a más reciente)
    const sortedRefuels = [...recentRefuels].sort(
      (a, b) => a.odometerKm - b.odometerKm
    );
    
    // Obtener el rendimiento promedio
    const avgKmPerLiter = vehicleSummary?.avgKmPerLiter;
    
    // Si no hay rendimiento, usar estimación de 40 km/gal
    const kmPerLiter = avgKmPerLiter && avgKmPerLiter > 0 ? avgKmPerLiter : 40;
    const isEstimate = !avgKmPerLiter || avgKmPerLiter <= 0;
    
    // =====================================================
    // CÁLCULO DEL COMBUSTIBLE RESTANTE
    // =====================================================
    // Ir hacia atrás desde la recarga más reciente, acumulando galones
    // y restando el consumo entre recargas.
    // 
    // Ejemplo:
    // - Recarga 1: km 1000, 5 gal (rendimiento 100 km/gal)
    // - Recarga 2: km 1200, 2 gal (solo recorrió 200 km, gastó 2 gal, le quedaban 3)
    // - Ahora en km 1200: tiene 3 + 2 = 5 galones
    // 
    // Vamos de la más reciente hacia atrás:
    // - Empezamos con los galones de la última recarga
    // - Sumamos lo que quedaba de la anterior (galones - consumo del tramo)
    // - Paramos si el total supera la capacidad (el tanque se llenó)
    // =====================================================
    
    let totalFuel = 0;
    
    for (let i = sortedRefuels.length - 1; i >= 0; i--) {
      const refuel = sortedRefuels[i];
      const refuelLiters = Number(refuel.liters);
      
      // Sumar los galones de esta recarga
      totalFuel += refuelLiters;
      
      // Si llegamos a la capacidad del tanque, no puede haber más
      if (totalFuel >= tankCapacity) {
        totalFuel = tankCapacity;
        break;
      }
      
      // Si hay una recarga anterior, calcular cuánto se consumió en el tramo
      if (i > 0) {
        const prevRefuel = sortedRefuels[i - 1];
        const distanceInSegment = refuel.odometerKm - prevRefuel.odometerKm;
        const consumedInSegment = distanceInSegment / kmPerLiter;
        
        // Lo que quedaba antes de esta recarga = galones anteriores - consumo
        // Si el consumo es mayor que lo que teníamos, significa que el tanque estaba vacío
        // y no debemos seguir sumando hacia atrás
        const prevRefuelLiters = Number(prevRefuel.liters);
        if (consumedInSegment >= prevRefuelLiters) {
          // El usuario gastó todo o más de lo que tenía, no hay remanente
          break;
        }
      }
    }
    
    // Ahora restar lo consumido desde la última recarga hasta el odómetro actual
    const lastRefuel = sortedRefuels[sortedRefuels.length - 1];
    const kmSinceLastRefuel = Math.max(0, selectedVehicle.odometerKm - lastRefuel.odometerKm);
    const consumedSinceLastRefuel = kmSinceLastRefuel / kmPerLiter;
    
    const remainingLiters = Math.max(0, totalFuel - consumedSinceLastRefuel);
    
    // Porcentaje respecto a la capacidad del tanque
    const percentage = Math.min(100, Math.max(0, (remainingLiters / tankCapacity) * 100));
    
    return {
      status: 'ok',
      liters: remainingLiters,
      percentage,
      isEstimate,
    };
  };

  const fuelRemaining = estimatedRemainingFuel();

  if (loading && !selectedVehicleId) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.background}>
      <ImageBackground
        source={require('../../../assets/images/auth/fondo-light.png')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header Section - Saludo y Fecha */}
          <View style={styles.headerSection}>
            {/* Greeting con Avatar */}
            <View style={styles.headerTop}>
              {/* Avatar del Usuario a la izquierda */}
              <View style={styles.avatarContainer}>
                {user?.avatarUrl ? (
                  <Image 
                    source={{ uri: user.avatarUrl }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Saludo y Fecha */}
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>
                  Hola{user?.name ? `, ${user.name}` : ''}
                </Text>
                <Text style={styles.subGreeting}>
                  {new Date().toLocaleDateString('es-MX', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>

            {/* Selector de Vehículo Modal */}
            {vehicles.length > 0 && selectedVehicle && (
              <>
                <TouchableOpacity 
                  style={styles.vehicleCard}
                  onPress={() => setVehicleModalVisible(true)}
                >
                  <View style={styles.vehicleIconContainer}>
                    <MaterialCommunityIcons 
                      name={getVehicleIcon(selectedVehicle.model)} 
                      size={32} 
                      color="#ff4d00" 
                    />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleNameMain}>
                      {selectedVehicle.name}
                    </Text>
                    <Text style={styles.vehicleDetails}>
                      {selectedVehicle.brand} {selectedVehicle.model} • {selectedVehicle.plate}
                    </Text>
                  </View>
                  {vehicles.length > 1 && (
                    <MaterialCommunityIcons name="chevron-down" size={24} color="#ff4d00" />
                  )}
                </TouchableOpacity>

                {/* Modal de Selección de Vehículos */}
                <Modal
                  visible={vehicleModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setVehicleModalVisible(false)}
                >
                  <TouchableOpacity 
                    style={styles.modalOverlay}
                    onPress={() => setVehicleModalVisible(false)}
                  >
                    <View style={styles.vehicleModal}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Seleccionar Vehículo</Text>
                        <TouchableOpacity onPress={() => setVehicleModalVisible(false)}>
                          <MaterialCommunityIcons name="close" size={24} color="#1a1a1a" />
                        </TouchableOpacity>
                      </View>
                      <FlatList
                        data={vehicles}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.vehicleOption,
                              selectedVehicleId === item.id && styles.vehicleOptionActive
                            ]}
                            onPress={() => {
                              setSelectedVehicleId(item.id);
                              setSelectedVehicle(item.id, item.name);
                              setVehicleModalVisible(false);
                            }}
                          >
                            <MaterialCommunityIcons 
                              name={getVehicleIcon(item.model)} 
                              size={24} 
                              color={selectedVehicleId === item.id ? "#ff4d00" : "#666666"}
                            />
                            <View style={styles.vehicleOptionInfo}>
                              <Text style={[
                                styles.vehicleOptionName,
                                selectedVehicleId === item.id && styles.vehicleOptionNameActive
                              ]}>
                                {item.name}
                              </Text>
                              <Text style={styles.vehicleOptionDetails}>
                                {item.brand} {item.model} • {item.plate}
                              </Text>
                            </View>
                            {selectedVehicleId === item.id && (
                              <MaterialCommunityIcons name="check-circle" size={24} color="#ff4d00" />
                            )}
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </TouchableOpacity>
                </Modal>
              </>
            )}

            {vehicles.length === 0 && (
              <View style={styles.emptyVehicleCard}>
                <MaterialCommunityIcons name="car-off" size={48} color="#8E8E93" />
                <Text style={styles.emptyVehicleText}>No tienes vehículos registrados</Text>
                <TouchableOpacity
                  style={styles.addVehicleButton}
                  onPress={() => navigation.navigate('VehicleForm' as any)}
                >
                  <Text style={styles.addVehicleButtonText}>Agregar Vehículo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {selectedVehicle && vehicleSummary && (
            <View style={styles.mainContent}>
              {/* Tarjetas de Información - Gasolina y Kilometraje */}
              <View style={styles.infoCardsContainer}>
                {/* Card Gasolina */}
                {fuelRemaining.status === 'ok' ? (
                  <TouchableOpacity 
                    style={styles.infoCard}
                    onPress={() => navigation.navigate('RefuelForm' as any, { vehicleId: selectedVehicle.id })}
                  >
                    <View style={styles.infoCardIconContainer}>
                      <MaterialCommunityIcons 
                        name="gas-cylinder" 
                        size={40} 
                        color="#ff4d00" 
                      />
                    </View>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>
                        Combustible{fuelRemaining.isEstimate ? ' ~' : ''}
                      </Text>
                      <Text style={styles.infoCardValue}>
                        {fuelRemaining.percentage.toFixed(0)}%
                      </Text>
                      <Text style={styles.infoCardSubtext}>
                        ~{fuelRemaining.liters.toFixed(1)} gal
                      </Text>
                    </View>
                    <View style={[
                      styles.infoCardIndicator,
                      { 
                        backgroundColor: fuelRemaining.percentage > 50 
                          ? '#34C759' 
                          : fuelRemaining.percentage > 20 
                            ? '#FF9500' 
                            : '#FF3B30'
                      }
                    ]} />
                  </TouchableOpacity>
                ) : fuelRemaining.status === 'no_tank_capacity' ? (
                  <TouchableOpacity 
                    style={styles.infoCard}
                    onPress={() => navigation.navigate('VehicleDetail' as any, { vehicleId: selectedVehicle.id })}
                  >
                    <View style={styles.infoCardIconContainer}>
                      <MaterialCommunityIcons 
                        name="gas-station-outline" 
                        size={40} 
                        color="#8E8E93" 
                      />
                    </View>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Combustible</Text>
                      <Text style={[styles.infoCardValue, { fontSize: 11, color: '#8E8E93' }]}>
                        Configurar
                      </Text>
                      <Text style={[styles.infoCardSubtext, { fontSize: 10 }]}>
                        capacidad tanque
                      </Text>
                    </View>
                    <View style={[styles.infoCardIndicator, { backgroundColor: '#8E8E93' }]} />
                  </TouchableOpacity>
                ) : fuelRemaining.status === 'no_refuels' ? (
                  <TouchableOpacity 
                    style={styles.infoCard}
                    onPress={() => navigation.navigate('RefuelForm' as any, { vehicleId: selectedVehicle.id })}
                  >
                    <View style={styles.infoCardIconContainer}>
                      <MaterialCommunityIcons 
                        name="fuel" 
                        size={40} 
                        color="#FF9500" 
                      />
                    </View>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Combustible</Text>
                      <Text style={[styles.infoCardValue, { fontSize: 11, color: '#FF9500' }]}>
                        Sin datos
                      </Text>
                      <Text style={[styles.infoCardSubtext, { fontSize: 10 }]}>
                        registra recarga
                      </Text>
                    </View>
                    <View style={[styles.infoCardIndicator, { backgroundColor: '#FF9500' }]} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.infoCard}>
                    <View style={styles.infoCardIconContainer}>
                      <MaterialCommunityIcons 
                        name="gas-station-outline" 
                        size={40} 
                        color="#8E8E93" 
                      />
                    </View>
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoCardLabel}>Combustible</Text>
                      <Text style={[styles.infoCardValue, { fontSize: 14, color: '#8E8E93' }]}>
                        --
                      </Text>
                      <Text style={styles.infoCardSubtext}>gal</Text>
                    </View>
                    <View style={styles.infoCardIndicator} />
                  </View>
                )}

                {/* Card Kilometraje */}
                <View 
                  style={styles.infoCard}
                >
                  <View style={styles.infoCardIconContainer}>
                    <MaterialCommunityIcons 
                      name="speedometer" 
                      size={40} 
                      color="#ff4d00" 
                    />
                  </View>
                  <View style={styles.infoCardContent}>
                    <Text style={styles.infoCardLabel}>Kilometraje</Text>
                    <Text style={styles.infoCardValue}>
                      {selectedVehicle.odometerKm.toLocaleString()}
                    </Text>
                    <Text style={styles.infoCardSubtext}>km</Text>
                  </View>
                  <View style={styles.infoCardIndicator} />
                </View>
              </View>

              {/* Alert Section - Alertas de Mantenimiento */}
              {pendingMaintenances.length === 0 ? (
                <View style={styles.maintenanceAlertSuccess}>
                  <View style={styles.alertIconContainerSuccess}>
                    <MaterialCommunityIcons 
                      name="check-circle" 
                      size={28} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>Sin mantenimientos pendientes</Text>
                    <Text style={styles.alertSubtitle}>Tu vehículo está al día</Text>
                  </View>
                </View>
              ) : (
                pendingMaintenances.map((maintenance) => (
                <TouchableOpacity 
                  key={maintenance.id}
                  style={styles.maintenanceAlert}
                  onPress={() => navigation.navigate('Maintenance' as any, { vehicleId: selectedVehicle.id })}
                >
                  <View style={styles.alertIconContainer}>
                    <MaterialCommunityIcons 
                      name="wrench" 
                      size={28} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{getMaintenanceLabel(maintenance.title)}</Text>
                    {maintenance.intervalKm && (
                      <Text style={styles.alertSubtitle}>
                        Cada {maintenance.intervalKm} km
                      </Text>
                    )}
                    {maintenance.notes && (
                      <Text style={styles.alertNotes}>{maintenance.notes}</Text>
                    )}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                ))
              )}

              {/* Proyección Gasto Mensual */}
              <View style={styles.monthlyProjectionContainer}>
                <View style={styles.projectionContent}>
                  <Text style={styles.projectionLabel}>Proyección gasto mensual</Text>
                  <Text style={styles.projectionValue}>
                    ${monthlyMetrics.length > 0 
                      ? Number(monthlyMetrics[monthlyMetrics.length - 1].totalCost).toFixed(2)
                      : '0.00'
                    } USD
                  </Text>
                </View>
                <View style={styles.projectionIcon}>
                  <MaterialCommunityIcons 
                    name="chart-box" 
                    size={40} 
                    color="#666666" 
                  />
                </View>
              </View>

              {/* Sección Rendimiento */}
              {vehicleSummary && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Rendimiento</Text>
                  <View style={styles.statsCard}>
                    <View style={styles.statRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Promedio</Text>
                        <Text style={styles.statValue}>
                          {vehicleSummary.avgKmPerLiter 
                            ? `${vehicleSummary.avgKmPerLiter.toFixed(2)} km/gal`
                            : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Recargas</Text>
                        <Text style={styles.statValue}>{vehicleSummary.refuels || 0}</Text>
                      </View>
                    </View>
                    <View style={styles.statRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Galones</Text>
                        <Text style={styles.statValue}>
                          {vehicleSummary.totalLiters 
                            ? `${Number(vehicleSummary.totalLiters).toFixed(1)} gal`
                            : '0 gal'}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Costo Total</Text>
                        <Text style={styles.statValue}>
                          ${vehicleSummary.totalCost 
                            ? Number(vehicleSummary.totalCost).toFixed(2)
                            : '0.00'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Gastos Mensuales */}
              {monthlyMetrics.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Gastos Mensuales</Text>
                    {monthlyMetrics.length > 1 && (
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('MonthlyHistory' as any, {
                          vehicleId: selectedVehicleId,
                          vehicleName: selectedVehicle?.name,
                        })}
                        style={styles.historicButton}
                      >
                        <Text style={styles.historicButtonText}>Histórico</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.monthlyList}>
                    {monthlyMetrics.slice(-1).map((metric) => {
                      const monthName = new Date(metric.month + '-01').toLocaleDateString('es-MX', {
                        month: 'long',
                        year: 'numeric'
                      });
                      
                      return (
                        <View key={metric.month} style={styles.monthlyCard}>
                          <View style={styles.monthlyHeader}>
                            <Text style={styles.monthlyMonth}>{monthName}</Text>
                            <Text style={styles.monthlyCost}>
                              ${Number(metric.totalCost).toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.monthlyDetails}>
                            <Text style={styles.monthlyDetail}>
                              {metric.refuels} recargas • {Number(metric.totalLiters).toFixed(1)} gal
                            </Text>
                            {metric.avgKmPerLiter && (
                              <Text style={styles.monthlyDetail}>
                                Rendimiento: {metric.avgKmPerLiter.toFixed(2)} km/gal
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Últimas Recargas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Últimas Recargas</Text>
                {recentRefuels.length === 0 ? (
                  <Text style={styles.emptyText}>No hay recargas registradas</Text>
                ) : (
                  <View style={styles.refuelList}>
                    {recentRefuels.map((refuel) => (
                      <View key={refuel.id} style={styles.refuelCard}>
                        <View style={styles.refuelHeader}>
                          <Text style={styles.refuelDate}>
                            {new Date(refuel.filledAt).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Text>
                          {refuel.paymentMethod && (
                            <Text style={styles.paymentBadge}>
                              {refuel.paymentMethod === 'stripe' ? '💳' : '💵'}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.refuelInfo}>
                          {Number(refuel.liters).toFixed(1)} gal - ${Number(refuel.totalCost).toFixed(2)}
                        </Text>
                        {refuel.note ? (
                          <Text style={styles.refuelOdometer}>
                            ⛽ {refuel.note}
                          </Text>
                        ) : (
                          <Text style={styles.refuelOdometer}>
                            📍 {refuel.odometerKm.toLocaleString()} km
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Bottom Spacing */}
              <View style={styles.bottomSpacing} />
            </View>
          )}
        </ScrollView>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ff4d00',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ff4d00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subGreeting: {
    fontSize: 13,
    fontWeight: '300',
    color: '#666666',
    textTransform: 'capitalize',
    marginBottom: 10,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  vehicleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 77, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNameMain: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  vehicleDetails: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
  },
  switchButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 0, 0.08)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  vehicleModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d1d6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
    gap: 12,
  },
  vehicleOptionActive: {
    backgroundColor: 'rgba(255, 77, 0, 0.05)',
  },
  vehicleOptionInfo: {
    flex: 1,
  },
  vehicleOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  vehicleOptionNameActive: {
    color: '#ff4d00',
  },
  vehicleOptionDetails: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999999',
  },
  emptyVehicleCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyVehicleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginTop: 12,
    marginBottom: 16,
  },
  addVehicleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ff4d00',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVehicleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  mainContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  infoCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  infoCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 77, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoCardContent: {
    marginBottom: 12,
  },
  infoCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  infoCardSubtext: {
    fontSize: 11,
    fontWeight: '400',
    color: '#999999',
    marginTop: 2,
  },
  infoCardIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 4,
    height: '100%',
    borderRadius: 0,
    backgroundColor: '#d1d1d6',
  },
  maintenanceAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    gap: 12,
  },
  maintenanceAlertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    gap: 12,
  },
  alertIconContainerSuccess: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  alertNotes: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  monthlyProjectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectionContent: {
    flex: 1,
  },
  projectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  projectionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  projectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  historicButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff4d00',
    borderRadius: 6,
    shadowColor: '#ff4d00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  historicButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    paddingVertical: 20,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ff4d00',
  },
  monthlyList: {
    gap: 12,
  },
  monthlyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthlyMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  monthlyCost: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff4d00',
  },
  monthlyDetails: {
    gap: 4,
  },
  monthlyDetail: {
    fontSize: 13,
    color: '#999999',
  },
  refuelList: {
    gap: 12,
  },
  refuelCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
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
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
  },
  paymentBadge: {
    fontSize: 16,
  },
  refuelInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  refuelOdometer: {
    fontSize: 14,
    color: '#999999',
  },
  bottomSpacing: {
    height: 20,
  },
});