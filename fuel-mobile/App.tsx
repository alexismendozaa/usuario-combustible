import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { VehicleProvider } from './src/context/VehicleContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts, Nunito_300Light, Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { ActivityIndicator, View } from 'react-native';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Nunito-Light': Nunito_300Light,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
    'Nunito-Black': Nunito_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff4d00" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <VehicleProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </VehicleProvider>
    </AuthProvider>
  );
}
