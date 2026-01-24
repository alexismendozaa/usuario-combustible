/**
 * Screen de Formulario de Nueva Recarga
 * Incluye: selección de vehículo, geolocalizacion, tipos de combustible, gasolineras cercanas
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ImageBackground,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { refuelService } from '../../services/api/refuelService';
import { vehicleService, Vehicle } from '../../services/api/vehicleService';
import { stationService, Station } from '../../services/api/stationService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Picker, PickerOption } from '../../components/common/Picker';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FUEL_TYPES, FUEL_PRICES, FuelType, PAYMENT_METHODS, PaymentMethod } from '../../types/index';
import { paymentService } from '../../services/api/paymentService';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Completa sesiones de auth si fueron abiertas previamente (evita cerrar la app en iOS)
WebBrowser.maybeCompleteAuthSession();

export default function RefuelFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vehicleId: routeVehicleId } = (route.params as { vehicleId?: string }) || {};

  // State: Datos del formulario
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(routeVehicleId || '');
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [odometerKm, setOdometerKm] = useState('');
  const [liters, setLiters] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [entryMode, setEntryMode] = useState<'gallons' | 'amount'>('gallons');
  const [odometerError, setOdometerError] = useState<string | undefined>(undefined);
  const [fullTank, setFullTank] = useState(false); // Por defecto, NO se asume tanque lleno

  // Obtener el odómetro actual del vehículo seleccionado
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const currentOdometer = selectedVehicle?.odometerKm || 0;
  const tankCapacity = selectedVehicle?.tankCapacity ? Number(selectedVehicle.tankCapacity) : null;

  const pricePerGallon = selectedFuelType ? FUEL_PRICES[selectedFuelType] : 0;

  // Función para normalizar decimales (acepta comas y puntos)
  const normalizeDecimal = (value: string) => value.replace(',', '.');

  // Estado para error de galones
  const [litersError, setLitersError] = useState<string | undefined>(undefined);

  // Validar el odómetro cuando cambia
  const handleOdometerChange = (value: string) => {
    setOdometerKm(value);
    const numValue = parseInt(normalizeDecimal(value));
    if (value && !isNaN(numValue) && numValue < currentOdometer) {
      setOdometerError(`Debe ser mayor o igual a ${currentOdometer.toLocaleString()} km`);
    } else {
      setOdometerError(undefined);
    }
  };

  const handleLitersChange = (value: string) => {
    setLiters(value);
    
    // Validar que no exceda la capacidad del tanque
    const gallons = parseFloat(normalizeDecimal(value));
    if (tankCapacity && !isNaN(gallons) && gallons > tankCapacity) {
      setLitersError(`Máximo ${tankCapacity} galones (capacidad del tanque)`);
    } else {
      setLitersError(undefined);
    }
    
    if (entryMode === 'gallons') {
      if (!isNaN(gallons) && pricePerGallon > 0) {
        setTotalCost((gallons * pricePerGallon).toFixed(2));
      } else {
        setTotalCost('');
      }
    }
  };

  const handleTotalCostChange = (value: string) => {
    setTotalCost(value);
    if (entryMode === 'amount') {
      const amount = parseFloat(normalizeDecimal(value));
      if (!isNaN(amount) && pricePerGallon > 0) {
        const calculatedGallons = amount / pricePerGallon;
        setLiters(calculatedGallons.toFixed(3));
        
        // Validar que no exceda la capacidad del tanque
        if (tankCapacity && calculatedGallons > tankCapacity) {
          setLitersError(`Máximo ${tankCapacity} galones (capacidad del tanque)`);
        } else {
          setLitersError(undefined);
        }
      } else {
        setLiters('');
        setLitersError(undefined);
      }
    }
  };

  useEffect(() => {
    // Recalcular cuando cambia el tipo de combustible o el modo
    if (!pricePerGallon) {
      setTotalCost('');
      setLiters('');
      return;
    }
    if (entryMode === 'gallons' && liters) {
      handleLitersChange(liters);
    }
    if (entryMode === 'amount' && totalCost) {
      handleTotalCostChange(totalCost);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFuelType, entryMode, pricePerGallon]);
  const [note, setNote] = useState('');

  // State: Loading/Location
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [geoloading, setGeoloading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Cargar vehículos y ubicación al montar
  useEffect(() => {
    loadData();
  }, []);

  // Cargar gasolineras cuando tengamos ubicación
  useEffect(() => {
    if (location) {
      loadNearbyStations();
    }
  }, [location]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar vehículos
      const vehiclesData = await vehicleService.list();
      setVehicles(vehiclesData);
      if (!routeVehicleId && vehiclesData.length > 0) {
        setSelectedVehicleId(vehiclesData[0].id);
      }

      // Obtener ubicación
      await getLocation();
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = async () => {
    try {
      setGeoloading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        // No es fatal, continuar sin ubicación
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeoutMs: 10000, // Timeout de 10 segundos
      }).catch(err => {
        console.log('Location error (continuing without location):', err.message);
        return null;
      });

      if (currentLocation) {
        setLocation({
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        });
      }
    } catch (error) {
      console.warn('Error obteniendo ubicación (continuando sin ubicación):', error);
      // No mostrar alerta, continuamos sin ubicación
    } finally {
      setGeoloading(false);
    }
  };

  const loadNearbyStations = async () => {
    if (!location) return;
    try {
      const response = await stationService.getNearby({
        lat: location.lat,
        lng: location.lng,
        radius: 2000,
      });
      setStations(response.stations);
    } catch (error) {
      console.error('Error cargando gasolineras:', error);
      // No fallar si no se pueden cargar gasolineras
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!selectedVehicleId) {
      Alert.alert('Error', 'Selecciona un vehículo');
      return;
    }
    if (!selectedFuelType) {
      Alert.alert('Error', 'Selecciona tipo de combustible');
      return;
    }
    if (!odometerKm.trim()) {
      Alert.alert('Error', 'Ingresa el odómetro');
      return;
    }
    // Validar que el odómetro no sea menor al actual
    const odometerValue = parseInt(normalizeDecimal(odometerKm));
    if (odometerValue < currentOdometer) {
      Alert.alert('Error', `El odómetro no puede ser menor al actual (${currentOdometer.toLocaleString()} km)`);
      return;
    }
    if (!liters.trim()) {
      Alert.alert('Error', 'Ingresa los galones o el valor para calcularlos');
      return;
    }
    if (!totalCost.trim()) {
      Alert.alert('Error', 'Ingresa el valor o los galones para calcularlo');
      return;
    }
    // Validar que los galones no excedan la capacidad del tanque
    if (tankCapacity && parseFloat(normalizeDecimal(liters)) > tankCapacity) {
      Alert.alert('Error', `Los galones no pueden exceder la capacidad del tanque (${tankCapacity} gal)`);
      return;
    }

    setSubmitting(true);
    try {
      // Si es pago con Stripe, crear sesión de pago
      if (paymentMethod === 'stripe') {
        const checkoutData = await paymentService.createCheckout({
          amountCents: Math.round(parseFloat(normalizeDecimal(totalCost)) * 100),
          description: `Recarga de combustible - ${selectedFuelType}`,
        });

        // Abrir Stripe checkout dentro de la app (Safari View / Chrome Custom Tab)
        const returnUrl = Linking.createURL('/');
        let sessionClosed = false;
        
        try {
          await WebBrowser.warmUpAsync();
          const result = await WebBrowser.openAuthSessionAsync(
            checkoutData.checkoutUrl,
            returnUrl,
            {
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
              dismissButtonStyle: 'close',
            }
          );
          
          sessionClosed = true;

          // Verificar estado del pago después de cerrar la sesión
          try {
            // Esperar un poco para que el webhook procese el pago
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const paymentStatus = await paymentService.getPaymentStatus(checkoutData.paymentId);
            
            if (paymentStatus.status === 'paid') {
              // Pago exitoso - guardar la recarga
              const selectedStation = stations.find(s => s.id === selectedStationId);
              const stationNote = selectedStation ? selectedStation.name : (note.trim() || undefined);
              
              await refuelService.create({
                vehicleId: selectedVehicleId,
                filledAt: new Date().toISOString(),
                odometerKm: parseInt(normalizeDecimal(odometerKm)),
                liters: parseFloat(normalizeDecimal(liters)),
                totalCost: parseFloat(normalizeDecimal(totalCost)),
                paymentMethod: 'stripe',
                fullTank,
                note: stationNote,
                lat: location?.lat,
                lng: location?.lng,
              });
              
              Alert.alert(
                '✅ Pago Exitoso',
                'Tu recarga de combustible ha sido registrada correctamente.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } else if (paymentStatus.status === 'pending') {
              Alert.alert(
                '⏳ Pago en Proceso',
                'Tu pago está siendo procesado. Se registrará automáticamente cuando se confirme.',
              );
            } else {
              Alert.alert(
                '❌ Pago Cancelado',
                'El pago fue cancelado. Intenta de nuevo.',
              );
            }
          } catch (statusError: any) {
            // Error verificando estado - pudo haber sido exitoso pero no se puede confirmar
            Alert.alert(
              '⏳ Pago Pendiente',
              'No pudimos confirmar el estado del pago. Se registrará automáticamente si fue exitoso.',
            );
          }
        } finally {
          await WebBrowser.coolDownAsync();
        }
      } else {
        // Pago en efectivo - guardar directamente
        const selectedStation = stations.find(s => s.id === selectedStationId);
        const stationNote = selectedStation ? selectedStation.name : (note.trim() || undefined);
        
        await refuelService.create({
          vehicleId: selectedVehicleId,
          filledAt: new Date().toISOString(),
          odometerKm: parseInt(normalizeDecimal(odometerKm)),
          liters: parseFloat(normalizeDecimal(liters)),
          totalCost: parseFloat(normalizeDecimal(totalCost)),
          paymentMethod: 'cash',
          fullTank,
          note: stationNote,
          lat: location?.lat,
          lng: location?.lng,
        });
        Alert.alert('Éxito', 'Recarga registrada correctamente');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo registrar la recarga');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const vehicleOptions: PickerOption[] = vehicles.map((v) => ({
    label: `${v.name} (${v.brand || 'Sin marca'})`,
    value: v.id,
  }));

  const stationOptions: PickerOption[] = stations.map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const fuelTypeOptions: PickerOption[] = FUEL_TYPES.map((ft) => ({
    label: ft.label,
    value: ft.value,
  }));

  return (
    <View style={styles.background}>
      <ImageBackground
        source={require('../../../assets/images/auth/fondo-light.png')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Nueva Recarga</Text>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>

        {/* Sección de Ubicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          {geoloading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
            </View>
          ) : location ? (
            <Text style={styles.locationText}>
              📍 Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.errorText}>Ubicación no disponible</Text>
          )}
        </View>

        {/* Vehículo */}
        <Picker
          label="Vehículo"
          options={vehicleOptions}
          value={selectedVehicleId}
          onValueChange={setSelectedVehicleId}
          placeholder="Selecciona un vehículo"
          required
          error={!selectedVehicleId ? 'Requerido' : undefined}
        />

        {/* Tipo de Combustible */}
        <Picker
          label="Tipo de Combustible"
          options={fuelTypeOptions}
          value={selectedFuelType}
          onValueChange={setSelectedFuelType}
          placeholder="Selecciona tipo de combustible"
          required
          error={!selectedFuelType ? 'Requerido' : undefined}
        />
          {selectedFuelType && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Precio por galón:</Text>
              <Text style={styles.priceValue}>${pricePerGallon.toFixed(3)}</Text>
            </View>
          )}

          {/* Modo de entrada */}
          <Picker
            label="¿Cómo quieres ingresar?"
            options={[
              { label: 'Ingresar galones', value: 'gallons' },
              { label: 'Ingresar valor $', value: 'amount' },
            ]}
            value={entryMode}
            onValueChange={(val) => setEntryMode(val as 'gallons' | 'amount')}
          />

        {/* Gasolinera (opcional) */}
        {stations.length > 0 && (
          <Picker
            label="Gasolinera (Opcional)"
            options={stationOptions}
            value={selectedStationId}
            onValueChange={setSelectedStationId}
            placeholder="Selecciona una gasolinera cercana"
          />
        )}

        {/* Odómetro */}
        <Input
          label={`Odómetro (km) - Actual: ${currentOdometer.toLocaleString()} km`}
          placeholder={`Mínimo: ${currentOdometer.toLocaleString()}`}
          value={odometerKm}
          onChangeText={handleOdometerChange}
          keyboardType="decimal-pad"
          required
          error={odometerError}
        />

        {/* Galones */}
        <Input
          label="Galones"
          placeholder="Ej: 12.5"
          value={liters}
          onChangeText={handleLitersChange}
          keyboardType="decimal-pad"
          required
          error={litersError || (!liters ? 'Requerido' : undefined)}
          editable={entryMode === 'gallons'}
        />

        {/* Valor total */}
        <Input
          label="Valor Total ($)"
          placeholder="Ej. 25"
          value={totalCost}
          onChangeText={handleTotalCostChange}
          keyboardType="decimal-pad"
          required
          error={!totalCost ? 'Requerido' : undefined}
          editable={entryMode === 'amount'}
        />

        {/* Método de Pago */}
        <Picker
          label="Método de Pago"
          selectedValue={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
          options={PAYMENT_METHODS}
          required
        />

        {paymentMethod === 'stripe' && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentInfoText}>
              💳 Serás redirigido a la pasarela de pago segura de Stripe
            </Text>
          </View>
        )}

        {/* Switch Tanque Lleno */}
        <View style={styles.switchContainer}>
          <View style={styles.switchLabelContainer}>
            <Text style={styles.switchLabel}>¿Llenaste el tanque?</Text>
            <Text style={styles.switchSubLabel}>
              Mejora la precisión del cálculo de combustible
            </Text>
          </View>
          <Switch
            value={fullTank}
            onValueChange={setFullTank}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Nota */}
        <Input
          label="Nota (Opcional)"
          placeholder="Observaciones..."
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <Button
            title="Guardar"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.saveButton}
          />
          <Button
            title="Cancelar"
            onPress={() => {
              Alert.alert(
                'Cancelar',
                '¿Seguro que deseas cancelar?',
                [
                  { text: 'No', style: 'cancel' },
                  { text: 'Sí', onPress: () => navigation.goBack() }
                ]
              );
            }}
            variant="secondary"
            style={styles.cancelButton}
          />
        </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000000',
  },
  section: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  locationText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  submitButton: {
    marginBottom: 12,
    marginTop: 24,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  switchSubLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});