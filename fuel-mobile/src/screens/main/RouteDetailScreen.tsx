/**
 * Screen de Detalle de Ruta
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { routeService, Route } from '../../services/api/routeService';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const { width } = Dimensions.get('window');

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
}

export default function RouteDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { routeId } = route.params as { routeId: string };

  const [routeData, setRouteData] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRoute();
  }, [routeId]);

  const loadRoute = async () => {
    try {
      const data = await routeService.getById(routeId);
      setRouteData(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la ruta');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar ruta',
      '¿Estás seguro de que deseas eliminar esta ruta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await routeService.delete(routeId);
              Alert.alert('Éxito', 'Ruta eliminada');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la ruta');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !routeData) {
    return <LoadingSpinner />;
  }

  const startDate = new Date(routeData.startedAt);
  const endDate = new Date(routeData.endedAt);

  // Preparar coordenadas para el mapa
  const coordinates = routeData.points?.map(p => ({
    latitude: p.lat,
    longitude: p.lng,
  })) || [];

  const initialRegion = coordinates.length > 0 ? {
    latitude: coordinates[0].latitude,
    longitude: coordinates[0].longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : undefined;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{routeData.name || 'Sin nombre'}</Text>

        {/* Mapa con la ruta dibujada */}
        {coordinates.length > 0 && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={initialRegion}
            >
              {/* Polyline que dibuja la ruta */}
              <Polyline
                coordinates={coordinates}
                strokeColor="#007AFF"
                strokeWidth={4}
              />
              
              {/* Marcador de inicio */}
              <Marker
                coordinate={coordinates[0]}
                title="Inicio"
                description={`${coordinates[0].latitude.toFixed(4)}, ${coordinates[0].longitude.toFixed(4)}`}
                pinColor="#34C759"
              />
              
              {/* Marcadores intermedios cada 10 puntos */}
              {coordinates.map((coord, index) => {
                // Mostrar un marcador pequeño cada 10 puntos (excepto inicio y fin)
                if (index > 0 && index < coordinates.length - 1 && index % 10 === 0) {
                  return (
                    <Marker
                      key={`point-${index}`}
                      coordinate={coord}
                      title={`Punto ${index + 1}`}
                      description={`${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`}
                    >
                      <View style={styles.smallMarker} />
                    </Marker>
                  );
                }
                return null;
              })}
              
              {/* Marcador de fin */}
              <Marker
                coordinate={coordinates[coordinates.length - 1]}
                title="Fin"
                description={`${coordinates[coordinates.length - 1].latitude.toFixed(4)}, ${coordinates[coordinates.length - 1].longitude.toFixed(4)}`}
                pinColor="#FF3B30"
              />
            </MapView>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Distancia</Text>
          <Text style={styles.value}>
            {routeData.distanceKm != null ? routeData.distanceKm.toFixed(2) : '0.00'} km
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Duración</Text>
          <Text style={styles.value}>{formatDuration(routeData.durationSec)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Inicio</Text>
          <Text style={styles.value}>{startDate.toLocaleString('es-ES')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Fin</Text>
          <Text style={styles.value}>{endDate.toLocaleString('es-ES')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Puntos GPS registrados</Text>
          <Text style={styles.value}>{routeData.points?.length || 0}</Text>
        </View>

        {routeData.points && routeData.points.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>Coordenadas</Text>
            <View style={styles.pointsList}>
              {routeData.points.slice(0, 5).map((point, index) => (
                <Text key={index} style={styles.pointText}>
                  {index + 1}. {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                </Text>
              ))}
              {routeData.points.length > 5 && (
                <Text style={styles.moreText}>
                  +{routeData.points.length - 5} más...
                </Text>
              )}
            </View>
          </View>
        )}

        <Button
          title="Eliminar Ruta"
          onPress={handleDelete}
          loading={deleting}
          variant="danger"
          style={styles.deleteButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  pointsList: {
    marginTop: 8,
  },
  pointText: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 4,
  },
  moreText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  deleteButton: {
    marginTop: 20,
  },
  smallMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});