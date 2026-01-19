/**
 * Screen de Verificación de Email
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
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authService } from '../../services/api/authService';
import { ROUTES } from '../../config/constants';

export default function VerifyEmailScreen() {
  const navigation = useNavigation();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!token.trim()) {
      setError('El token es requerido');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.verifyEmail({ token: token.trim() });
      Alert.alert(
        'Email verificado',
        'Tu correo ha sido verificado exitosamente. Ya puedes iniciar sesión.',
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
        'Token inválido o expirado. Verifica el código e intenta nuevamente.';
      setError(message);
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
          <Text style={styles.title}>Verificar Email</Text>
          <Text style={styles.subtitle}>
            Haz clic en el enlace del correo que te enviamos para verificar tu cuenta
          </Text>

          <Input
            label="Token de verificación (del enlace en el correo)"
            placeholder="Token automático del correo"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            error={error}
          />

          <Button
            title="Verificar"
            onPress={handleVerify}
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