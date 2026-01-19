/**
 * Screen de Detalle y Edición de Vehículo
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { vehicleService, Vehicle, UpdateVehicleData } from '../../services/api/vehicleService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function VehicleDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { vehicleId } = route.params as { vehicleId: string };

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [fuelType, setFuelType] = useState('');

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      const data = await vehicleService.getById(vehicleId);
      setVehicle(data);
      setName(data.name);
      setBrand(data.brand || '');
      setModel(data.model || '');
      setYear(data.year?.toString() || '');
      setPlate(data.plate || '');
      setOdometerKm(data.odometerKm.toString());
      setFuelType(data.fuelType || '');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el vehículo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del vehículo es requerido');
      return;
    }

    setUpdating(true);
    try {
      const updateData: UpdateVehicleData = {
        name: name.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        year: year ? parseInt(year) : undefined,
        plate: plate.trim() || undefined,
        odometerKm: odometerKm ? parseFloat(odometerKm) : undefined,
        fuelType: fuelType.trim() || undefined,
      };

      await vehicleService.update(vehicleId, updateData);
      Alert.alert('Éxito', 'Vehículo actualizado correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el vehículo');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ImageBackground
      source={require('../../../assets/images/auth/fondo-light.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Editar Vehículo</Text>
          </View>

        <Input
          label="Nombre del vehículo"
          placeholder="Mi auto"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Marca"
          placeholder="Toyota"
          value={brand}
          onChangeText={setBrand}
        />

        <Input
          label="Modelo"
          placeholder="Camry"
          value={model}
          onChangeText={setModel}
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
          placeholder="ABC-1234"
          value={plate}
          onChangeText={setPlate}
          autoCapitalize="characters"
        />

        <Input
          label="Odómetro (km)"
          placeholder="50000"
          value={odometerKm}
          onChangeText={setOdometerKm}
          keyboardType="decimal-pad"
        />

        <Input
          label="Tipo de combustible"
          placeholder="Gasolina"
          value={fuelType}
          onChangeText={setFuelType}
        />

        <Button
          title="Guardar Cambios"
          onPress={handleUpdate}
          loading={updating}
          style={styles.button}
        />
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
  button: {
    marginTop: 20,
  },
});