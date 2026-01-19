/**
 * Screen de Login
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ImageBackground,
  Image,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../config/constants';
import Svg, { Path, G } from 'react-native-svg';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El correo no es válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({}); // Limpiar errores previos
    try {
      await login(email.trim(), password);
      // La navegación se maneja automáticamente por el AuthContext
    } catch (error: any) {
      // El error ya tiene el mensaje del servidor o un mensaje genérico
      const message = error.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      
      // Mostrar error debajo del campo de contraseña
      setErrors({ password: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ImageBackground
        source={require('../../../assets/images/auth/fondo-light.png')}
        style={styles.background}
        resizeMode="cover"
        imageStyle={styles.backgroundImage}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.loadingOverlay}>
              <LoadingSpinner />
            </View>
          )}

          {/* Título */}
          <Text style={styles.title}>SmartFuel</Text>

          {/* Logo principal */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/auth/logo-dark.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Input Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
              <Svg width={20} height={15} viewBox="0 0 25 19" fill="none">
                <Path
                  d="M22.5 0h-20C1.125 0 0 1.125 0 2.5v14C0 17.875 1.125 19 2.5 19h20c1.375 0 2.5-1.125 2.5-2.5v-14C25 1.125 23.875 0 22.5 0zm0 2.5v2.344c-1.219.906-3.156 2.312-6.625 4.75-.719.5-2.125 1.656-3.375 1.656-1.25 0-2.656-1.156-3.375-1.656C5.656 7.156 3.719 5.75 2.5 4.844V2.5h20zm-20 14v-8.969c1.25.906 3.031 2.188 5.656 4.063.906.656 2.5 2.156 4.344 2.156 1.813 0 3.406-1.5 4.344-2.156 2.625-1.875 4.406-3.157 5.656-4.063V16.5h-20z"
                  fill="#666666"
                />
              </Svg>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#999999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Input Contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
              <Svg width={18} height={20} viewBox="0 0 22 25" fill="none">
                <Path
                  d="M19.5 9h-1.25V6.25C18.25 2.813 15.438 0 12 0S5.75 2.813 5.75 6.25V9H4.5C3.125 9 2 10.125 2 11.5v11C2 23.875 3.125 25 4.5 25h15c1.375 0 2.5-1.125 2.5-2.5v-11C22 10.125 20.875 9 19.5 9zM8.25 6.25c0-2.063 1.688-3.75 3.75-3.75s3.75 1.688 3.75 3.75V9h-7.5V6.25zm11.25 16.25h-15v-11h15v11zM12 19.5c1.375 0 2.5-1.125 2.5-2.5s-1.125-2.5-2.5-2.5-2.5 1.125-2.5 2.5 1.125 2.5 2.5 2.5z"
                  fill="#666666"
                />
              </Svg>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Svg width={20} height={16} viewBox="0 0 25 20" fill="none">
                  <Path
                    d="M12.5 15c-2.063 0-3.75-1.688-3.75-3.75S10.438 7.5 12.5 7.5s3.75 1.688 3.75 3.75S14.563 15 12.5 15zm0-10C7.25 5 2.656 8.125.5 12.5c2.156 4.375 6.75 7.5 12 7.5s9.844-3.125 12-7.5C22.344 8.125 17.75 5 12.5 5z"
                    fill="#666666"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* ¿Olvidaste tu contraseña? */}
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.AUTH.FORGOT_PASSWORD as never)}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón Ingresar */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>INGRESAR</Text>
          </TouchableOpacity>

          {/* ¿No tienes cuenta? */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>
              ¿No tienes una cuenta?{' '}
              <Text
                style={styles.registerLink}
                onPress={() => navigation.navigate(ROUTES.AUTH.REGISTER as never)}
              >
                Regístrate aquí
              </Text>
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 0,
  },
  backgroundImage: {
    top: 45,
    borderRadius: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  title: {
    fontFamily: 'Nunito-Black',
    fontWeight: '900',
    fontSize: 32,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 15,
    color: '#1a1a1a',
    padding: 0,
  },
  errorText: {
    fontFamily: 'Nunito-Light',
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    fontSize: 13,
    color: '#ff4d00',
  },
  loginButton: {
    backgroundColor: '#ff4d00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff4d00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '800',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  registerSection: {
    alignItems: 'center',
    marginTop: 32,
  },
  registerText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#4a4a4a',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  registerLink: {
    color: '#ff4d00',
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '800',
  },
});