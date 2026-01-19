/**
 * Screen de Formulario para Crear Vehículo
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { vehicleService } from '../../services/api/vehicleService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Picker, PickerOption } from '../../components/common/Picker';
import { FUEL_TYPES, VEHICLE_TYPES } from '../../types/index';

export default function VehicleFormScreen() {
  const navigation = useNavigation();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [brand, setBrand] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [odometerKm, setOdometerKm] = useState('0');
  const [fuelType, setFuelType] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del vehículo es requerido');
      return;
    }

    if (!vehicleType) {
      Alert.alert('Error', 'Selecciona el tipo de vehículo');
      return;
    }

    setSubmitting(true);
    try {
      await vehicleService.create({
        name: name.trim(),
        brand: brand.trim() || undefined,
        model: vehicleType, // Guardamos el tipo en model
        year: year ? parseInt(year) : undefined,
        plate: plate.trim() || undefined,
        odometerKm: odometerKm ? parseFloat(odometerKm) : 0,
        fuelType: fuelType || undefined,
      });

      Alert.alert('Éxito', 'Vehículo creado correctamente');
      navigation.goBack();
    } catch (error: any) {
      const message = error.response?.data?.message || 'No se pudo crear el vehículo';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const fuelTypeOptions: PickerOption[] = FUEL_TYPES.map((ft) => ({
    label: ft.label,
    value: ft.value,
  }));

  return (
    <ImageBackground
      source={require('../../../assets/images/auth/fondo-light.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Nuevo Vehículo</Text>
            </View>

          <Picker
            label="Tipo de vehículo *"
            value={vehicleType}
            onValueChange={setVehicleType}
            options={VEHICLE_TYPES.map((vt) => ({ label: vt.label, value: vt.value }))}
            placeholder="Selecciona el tipo"
          />

          <Input
            label="Nombre del vehículo *"
            placeholder="Mi auto, Taxi, etc."
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label="Marca"
            placeholder="Toyota, Honda, BMW, etc."
            value={brand}
            onChangeText={setBrand}
            autoCapitalize="words"
          />

          <Input
            label="Año"
            placeholder="2020"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
          />

          <Input
            label="Placa"
            placeholder="ABC-1234 o ABC1234"
            value={plate}
            onChangeText={setPlate}
            autoCapitalize="characters"
          />

          <Input
            label="Odómetro (km)"
            placeholder="0"
            value={odometerKm}
            onChangeText={setOdometerKm}
            keyboardType="decimal-pad"
          />

          <Picker
            label="Tipo de Combustible"
            options={fuelTypeOptions}
            value={fuelType}
            onValueChange={(value) => setFuelType(String(value))}
            placeholder="Selecciona tipo de combustible"
          />

          <Text style={styles.required}>* Campo requerido</Text>

          <Button
            title="Crear Vehículo"
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    padding: 20,
  },
  headerContainer: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  required: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 24,
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 16,
  },
});
