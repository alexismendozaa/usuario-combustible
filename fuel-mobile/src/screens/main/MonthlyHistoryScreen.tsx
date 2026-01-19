/**
 * Pantalla de Historial de Gastos Mensuales
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { reportService, MonthlyMetrics } from '../../services/api/reportService';
import { refuelService, Refuel } from '../../services/api/refuelService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface RouteParams {
  vehicleId: string;
  vehicleName?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
}

export default function MonthlyHistoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vehicleId, vehicleName, vehicleBrand, vehicleModel, vehiclePlate } = (route.params as RouteParams) || {};

  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [monthRefuels, setMonthRefuels] = useState<Record<string, Refuel[]>>({});
  const [loadingRefuels, setLoadingRefuels] = useState<string | null>(null);

  const loadData = async () => {
    if (!vehicleId) return;

    try {
      const monthlyData: MonthlyMetrics[] = [];
      const now = new Date();

      // Cargar últimos 24 meses incluyendo el mes actual
      for (let i = 0; i < 24; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const monthStr = `${year}-${month}`;

        try {
          const metrics = await reportService.getMonthlyMetrics(vehicleId, monthStr);
          // Solo agregar meses que tienen recargas
          if (metrics.refuels > 0) {
            monthlyData.unshift(metrics);
          }
        } catch (err) {
          // Ignorar errores por meses sin datos
        }
      }

      setMonthlyMetrics(monthlyData);
    } catch (error) {
      console.error('Error loading monthly history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const loadMonthRefuels = async (month: string) => {
    if (monthRefuels[month]) {
      // Ya están cargados, solo toggle
      setExpandedMonth(expandedMonth === month ? null : month);
      return;
    }

    setLoadingRefuels(month);
    try {
      const allRefuels = await refuelService.list();
      
      // Filtrar recargas del mes y del vehículo
      const [year, monthNum] = month.split('-');
      const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1, 0, 0, 0);
      const startOfNextMonth = new Date(parseInt(year), parseInt(monthNum), 1, 0, 0, 0);
      
      const filtered = allRefuels
        .filter(r => {
          const refuelDate = new Date(r.filledAt);
          return r.vehicleId === vehicleId && 
                 refuelDate >= startOfMonth && 
                 refuelDate < startOfNextMonth;
        })
        .sort((a, b) => new Date(b.filledAt).getTime() - new Date(a.filledAt).getTime());
      
      setMonthRefuels(prev => ({
        ...prev,
        [month]: filtered,
      }));
      
      setExpandedMonth(month);
    } catch (error) {
      console.error('Error loading month refuels:', error);
    } finally {
      setLoadingRefuels(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Calcular totales
  const totalCost = monthlyMetrics.reduce((sum, m) => sum + Number(m.totalCost), 0);
  const totalLiters = monthlyMetrics.reduce((sum, m) => sum + Number(m.totalLiters), 0);
  const totalRefuels = monthlyMetrics.reduce((sum, m) => sum + m.refuels, 0);
  const avgCostMonth = monthlyMetrics.length > 0 ? totalCost / monthlyMetrics.length : 0;

  return (
    <ImageBackground
      source={require('../../../assets/images/auth/fondo-light.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      {/* Header Title */}
      <View style={styles.headerTitleContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Historial de Gastos</Text>
          {vehicleName && (
            <Text style={styles.headerSubtitle}>
              {vehicleName}{vehicleBrand && ` • ${vehicleBrand}`}{vehicleModel && ` ${vehicleModel}`}{vehiclePlate && ` • ${vehiclePlate}`}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* Resumen General */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Resumen General</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Gasto</Text>
              <Text style={styles.summaryValue}>
                ${Number(totalCost).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Promedio/Mes</Text>
              <Text style={styles.summaryValue}>
                ${Number(avgCostMonth).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Galones</Text>
              <Text style={styles.summaryValue}>
                {Number(totalLiters).toFixed(1)} gal
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Recargas</Text>
              <Text style={styles.summaryValue}>{totalRefuels}</Text>
            </View>
          </View>
        </View>

        {/* Historial de Meses */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Desglose Mensual</Text>

          {monthlyMetrics.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>No hay datos disponibles</Text>
            </View>
          ) : (
            <View style={styles.monthlyList}>
              {monthlyMetrics.map((metric, index) => {
                const [year, monthNum] = metric.month.split('-');
                const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                const monthName = monthDate.toLocaleDateString('es-MX', {
                  month: 'long',
                  year: 'numeric'
                });

                const prevMetric = index > 0 ? monthlyMetrics[index - 1] : null;
                const costDiff = prevMetric
                  ? Number(metric.totalCost) - Number(prevMetric.totalCost)
                  : 0;
                const costChange = costDiff > 0 ? '+' : '';
                const isExpanded = expandedMonth === metric.month;
                const hasRefuels = monthRefuels[metric.month] && monthRefuels[metric.month].length > 0;

                return (
                  <View key={metric.month}>
                    <TouchableOpacity
                      style={[styles.monthCard, isExpanded && styles.monthCardExpanded]}
                      onPress={() => loadMonthRefuels(metric.month)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.monthHeader}>
                        <View style={styles.monthTitleRow}>
                          <Text style={styles.monthName}>{monthName}</Text>
                          <MaterialCommunityIcons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color="#666"
                          />
                        </View>
                        <View style={styles.monthCostContainer}>
                          <Text style={styles.monthCost}>
                            ${Number(metric.totalCost).toFixed(2)}
                          </Text>
                          {prevMetric && (
                            <Text
                              style={[
                                styles.costChange,
                                costDiff > 0 ? styles.costIncrease : styles.costDecrease,
                              ]}
                            >
                              {costChange}${Math.abs(costDiff).toFixed(2)}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.monthStats}>
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="gas-cylinder" size={18} color="#ff4d00" />
                          <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Galones</Text>
                            <Text style={styles.statValue}>
                              {Number(metric.totalLiters).toFixed(1)} gal
                            </Text>
                          </View>
                        </View>

                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="fuel" size={18} color="#ff4d00" />
                          <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Recargas</Text>
                            <Text style={styles.statValue}>{metric.refuels}</Text>
                          </View>
                        </View>

                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="speedometer" size={18} color="#ff4d00" />
                          <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Rendimiento</Text>
                            <Text style={styles.statValue}>
                              {metric.avgKmPerLiter
                                ? `${metric.avgKmPerLiter.toFixed(2)} km/gal`
                                : 'N/A'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {metric.totalDistanceKm > 0 && (
                        <View style={styles.distanceInfo}>
                          <MaterialCommunityIcons name="map-marker-distance" size={16} color="#8E8E93" />
                          <Text style={styles.distanceText}>
                            {Math.round(metric.totalDistanceKm)} km recorridos
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.refuelListContainer}>
                        {loadingRefuels === metric.month ? (
                          <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
                        ) : hasRefuels ? (
                          monthRefuels[metric.month].map((refuel) => (
                            <View key={refuel.id} style={styles.refuelItem}>
                              <View style={styles.refuelHeader}>
                                <View>
                                  <Text style={styles.refuelDate}>
                                    {new Date(refuel.filledAt).toLocaleDateString('es-ES', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    })}
                                  </Text>
                                  <Text style={styles.refuelTime}>
                                    {new Date(refuel.filledAt).toLocaleTimeString('es-ES', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Text>
                                </View>
                                <Text style={styles.refuelCost}>
                                  ${Number(refuel.totalCost).toFixed(2)}
                                </Text>
                              </View>

                              <View style={styles.refuelDetails}>
                                <View style={styles.refuelDetail}>
                                  <Text style={styles.refuelDetailLabel}>Galones</Text>
                                  <Text style={styles.refuelDetailValue}>
                                    {Number(refuel.liters).toFixed(2)} gal
                                  </Text>
                                </View>
                                <View style={styles.refuelDetail}>
                                  <Text style={styles.refuelDetailLabel}>Odómetro</Text>
                                  <Text style={styles.refuelDetailValue}>
                                    {Math.round(Number(refuel.odometerKm))} km
                                  </Text>
                                </View>
                                <View style={styles.refuelDetail}>
                                  <Text style={styles.refuelDetailLabel}>Pago</Text>
                                  <Text style={styles.refuelDetailValue}>
                                    {refuel.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noRefuels}>Sin recargas este mes</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundImage: {
    top: 36,
  },
  headerTitleContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff4d00',
  },
  historySection: {
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
  monthlyList: {
    gap: 12,
  },
  monthCard: {
    backgroundColor: '#FFFFFF',
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  monthName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'capitalize',
  },
  monthCostContainer: {
    alignItems: 'flex-end',
  },
  monthCost: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff4d00',
  },
  costChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  costIncrease: {
    color: '#FF3B30',
  },
  costDecrease: {
    color: '#34C759',
  },
  monthStats: {
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statContent: {
    marginLeft: 12,
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 2,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 8,
  },
  distanceText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 8,
  },
  monthCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  monthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  refuelListContainer: {
    backgroundColor: '#F9F9F9',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 12,
    gap: 8,
  },
  loader: {
    paddingVertical: 20,
  },
  refuelItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4d00',
  },
  refuelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  refuelDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  refuelTime: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  refuelCost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff4d00',
  },
  refuelDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  refuelDetail: {
    flex: 1,
  },
  refuelDetailLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 2,
  },
  refuelDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  noRefuels: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
