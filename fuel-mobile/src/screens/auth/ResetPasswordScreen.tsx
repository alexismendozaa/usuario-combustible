/**
 * Screen de Reset de Contraseña
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authService } from '../../services/api/authService';
import { ROUTES } from '../../config/constants';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const token = (route.params as any)?.token || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!newPassword) {
      newErrors.password = 'La contraseña es requerida';
    } else if (newPassword.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;

    if (!token) {
      Alert.alert('Error', 'Token no válido. Solicita un nuevo enlace de recuperación.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        token,
        newPassword,
      });
      Alert.alert(
        'Contraseña actualizada',
        'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate(ROUTES.AUTH.LOGIN as never),
          },
        ]
      );
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Error al actualizar la contraseña. El token puede haber expirado.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Restablecer Contraseña</Text>
          <Text style={styles.subtitle}>Ingresa tu nueva contraseña</Text>

          <Input
            label="Nueva contraseña"
            placeholder="••••••••"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"

            error={errors.password}
          />

          <Input
            label="Confirmar contraseña"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"

            error={errors.confirmPassword}
          />

          <Button
            title="Actualizar Contraseña"
            onPress={handleReset}
            loading={loading}
            style={styles.button}
          />

          <View style={styles.loginSection}>
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN as never)}
            >
              Volver al inicio de sesión
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
  },
  button: {
    marginTop: 8,
  },
  loginSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});