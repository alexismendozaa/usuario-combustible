/**
 * Componente de Navegación Inferior en Píldora
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type NavigationProp = StackNavigationProp<any>;

const BottomNavigation = React.memo(function BottomNavigation() {
  const navigation = useNavigation<NavigationProp>();
  const currentRouteName = useNavigationState((state) => {
    const route = state.routes[state.index];
    if (route.name === 'MainTabs' && route.state && (route.state as any).routes) {
      const nested = route.state as any;
      const nestedRoute = nested.routes[nested.index];
      return nestedRoute?.name ?? route.name;
    }
    return route.name;
  });

  const handleNavigate = (screenName: string) => {
    (navigation as any).navigate('MainTabs', { screen: screenName });
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      icon: 'home',
      label: 'Inicio',
    },
    {
      name: 'Vehicles',
      icon: 'car',
      label: 'Vehículos',
    },
    {
      name: 'Stations',
      icon: 'gas-station',
      label: 'Gasolineras',
    },
  ];

  const rightItems = [
    {
      name: 'Routes',
      icon: 'map-outline',
      label: 'Rutas',
    },
    {
      name: 'Maintenance',
      icon: 'wrench',
      label: 'Mantenimientos',
    },
    {
      name: 'Profile',
      icon: 'account',
      label: 'Perfil',
    },
  ];

  const isActive = (screenName: string) => currentRouteName === screenName;

  return (
    <View style={styles.container}>
      {/* Left Items */}
      <View style={styles.pillShape}>
        {navigationItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.navButton}
            onPress={() => handleNavigate(item.name)}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color={isActive(item.name) ? '#ff4d00' : '#999999'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Center Action Button */}
      <TouchableOpacity
        style={styles.centerActionButton}
        onPress={() => handleNavigate('Refuels')}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Right Items */}
      <View style={styles.pillShape}>
        {rightItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.navButton}
            onPress={() => handleNavigate(item.name)}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color={isActive(item.name) ? '#ff4d00' : '#999999'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

export default BottomNavigation;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  pillShape: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f1',
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  centerActionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ff4d00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff4d00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
