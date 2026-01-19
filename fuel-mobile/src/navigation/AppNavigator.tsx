/**
 * Navegación principal de la aplicación
 */

import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../config/constants';
import BottomNavigation from '../components/common/BottomNavigation';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import VehiclesScreen from '../screens/main/VehiclesScreen';
import RefuelsScreen from '../screens/main/RefuelsScreen';
import RoutesScreen from '../screens/main/RoutesScreen';
import MaintenanceScreen from '../screens/main/MaintenanceScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import StationsScreen from '../screens/main/StationsScreen';

// Detail screens
import VehicleDetailScreen from '../screens/main/VehicleDetailScreen';
import VehicleFormScreen from '../screens/main/VehicleFormScreen';
import RefuelFormScreen from '../screens/main/RefuelFormScreen';
import RouteDetailScreen from '../screens/main/RouteDetailScreen';
import RouteTrackerScreen from '../screens/main/RouteTrackerScreen';
import MonthlyHistoryScreen from '../screens/main/MonthlyHistoryScreen';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name={ROUTES.AUTH.LOGIN} 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.AUTH.REGISTER} 
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.AUTH.VERIFY_EMAIL} 
        component={VerifyEmailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.AUTH.FORGOT_PASSWORD} 
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.AUTH.RESET_PASSWORD} 
        component={ResetPasswordScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen
        name={ROUTES.MAIN.DASHBOARD}
        component={DashboardScreen}
      />
      <Stack.Screen
        name={ROUTES.MAIN.VEHICLES}
        component={VehiclesScreen}
      />
      <Stack.Screen
        name={ROUTES.MAIN.REFUELS}
        component={RefuelsScreen}
      />
      <Stack.Screen
        name={ROUTES.MAIN.STATIONS}
        component={StationsScreen}
      />
      <Stack.Screen
        name={ROUTES.MAIN.ROUTES}
        component={RoutesScreen}
      />
      <Stack.Screen
        name={ROUTES.MAIN.MAINTENANCE}
        component={MaintenanceScreen}
      />
      <Stack.Screen
        name={ROUTES.MAIN.PROFILE}
        component={ProfileScreen}
      />
    </Stack.Navigator>
  );
}

function MainTabsShell() {
  return (
    <View style={{ flex: 1 }}>
      <MainTabs />
      <BottomNavigation />
    </View>
  );
}

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: '#ff4d00',
        headerBackTitleVisible: true,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabsShell}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VehicleDetail"
        component={VehicleDetailScreen}
        options={{ 
          title: 'Detalle de Vehículo',
          headerBackTitle: 'Regresar'
        }}
      />
      <Stack.Screen
        name="VehicleForm"
        component={VehicleFormScreen}
        options={{ 
          title: 'Nuevo Vehículo',
          headerBackTitle: 'Regresar'
        }}
      />
      <Stack.Screen
        name="RefuelForm"
        component={RefuelFormScreen}
        options={{ 
          title: 'Nueva Recarga',
          headerBackTitle: 'Regresar'
        }}
      />
      <Stack.Screen
        name="RouteDetail"
        component={RouteDetailScreen}
        options={{ 
          title: 'Detalle de Ruta',
          headerBackTitle: 'Regresar'
        }}
      />
      <Stack.Screen
        name="RouteTracker"
        component={RouteTrackerScreen}
        options={{ 
          title: 'Rastrear Ruta',
          headerBackTitle: 'Regresar'
        }}
      />
      <Stack.Screen
        name="MonthlyHistory"
        component={MonthlyHistoryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Mostrar loading screen mientras se verifica autenticación
    return null; // TODO: Agregar LoadingScreen
  }

  return (
    <NavigationContainer key={isAuthenticated ? 'auth' : 'main'}>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}