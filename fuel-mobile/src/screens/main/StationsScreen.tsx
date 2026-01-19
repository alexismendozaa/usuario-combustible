/**
 * Screen de Gasolineras Cercanas
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
  ImageBackground,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { stationService, Station } from '../../services/api/stationService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import BottomNavigation from '../../components/common/BottomNavigation';

export default function StationsScreen() {
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);

      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso de ubicación para ver gasolineras cercanas');
        setLoading(false);
        return;
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);

      // Cargar estaciones cercanas
      const response = await stationService.getNearby({
        lat: coords.latitude,
        lng: coords.longitude,
        radius: 5000, // 5km
      });

      setStations(response.stations);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'No se pudieron cargar las estaciones';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const openInGoogleMaps = (station: Station) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${station.lat},${station.lng}`;
    const label = encodeURIComponent(station.name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'No se pudo abrir Google Maps');
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!userLocation) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No se pudo obtener la ubicación</Text>
        <TouchableOpacity onPress={loadStations} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <ImageBackground
        source={require('../../../assets/images/auth/fondo-light.png')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Gasolineras cercanas</Text>
        </View>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Marcadores de estaciones */}
        {stations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{ latitude: station.lat, longitude: station.lng }}
            title={station.name}
            description={station.address || ''}
            onPress={() => setSelectedStation(station)}
            pinColor="#FF9500"
          >
            <View style={styles.customMarker}>
              <MaterialCommunityIcons name="gas-station" size={28} color="#FFFFFF" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Card flotante con información de estación seleccionada */}
      {selectedStation && (
        <View style={styles.stationCard}>
          <View style={styles.cardContent}>
            <Text style={styles.stationName}>{selectedStation.name}</Text>
            {selectedStation.brand && (
              <Text style={styles.stationBrand}>{selectedStation.brand}</Text>
            )}
            {selectedStation.address && (
              <Text style={styles.stationAddress}>{selectedStation.address}</Text>
            )}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => openInGoogleMaps(selectedStation)}
            >
              <Text style={styles.navigateText}>Navegar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedStation(null)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff4d00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stationCard: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  stationBrand: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 12,
    color: '#8E8E93',
  },
  cardActions: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  navigateButton: {
    backgroundColor: '#ff4d00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  navigateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  counterBadge: {
    display: 'none',
  },
  customMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
