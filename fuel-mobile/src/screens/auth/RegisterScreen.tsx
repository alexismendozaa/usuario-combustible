/**
 * Screen de Registro/Crear Cuenta
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
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../config/constants';
import Svg, { Path } from 'react-native-svg';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; name?: string; password?: string; confirmPassword?: string }>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; name?: string; password?: string; confirmPassword?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar tu contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      await register(email.trim(), password, name.trim());
      setShowConfirmModal(true);
      // Limpiar formulario
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
    } catch (error: any) {
      const message = error.message || 'Error al registrarse. Intenta de nuevo.';
      setErrors({ email: message });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
    navigation.navigate(ROUTES.AUTH.LOGIN as never);
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

          {/* Botón de regresar - Esquina superior izquierda */}
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN as never)}
            style={styles.backButtonTop}
          >
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18L9 12L15 6"
                stroke="#ff4d00"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          {/* Logo principal grande centrado */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/auth/logo-dark.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>Crear Cuenta</Text>

          {/* Mensaje descriptivo */}
          <Text style={styles.description}>
            Regístrate para comenzar a gestionar tu consumo de combustible
          </Text>

          {/* Input Nombre */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <View style={[styles.inputWrapper, errors.name && styles.inputWrapperError]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  fill="#666666"
                />
              </Svg>
              <TextInput
                style={styles.input}
                placeholder="Juan Pérez"
                placeholderTextColor="#999999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
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

          {/* Input Confirmar Contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputWrapperError]}>
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
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Svg width={20} height={16} viewBox="0 0 25 20" fill="none">
                  <Path
                    d="M12.5 15c-2.063 0-3.75-1.688-3.75-3.75S10.438 7.5 12.5 7.5s3.75 1.688 3.75 3.75S14.563 15 12.5 15zm0-10C7.25 5 2.656 8.125.5 12.5c2.156 4.375 6.75 7.5 12 7.5s9.844-3.125 12-7.5C22.344 8.125 17.75 5 12.5 5z"
                    fill="#666666"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* Botón Registrarse */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>REGISTRARSE</Text>
          </TouchableOpacity>

          {/* Link para ir al login */}
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN as never)}
            style={styles.loginLinkContainer}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta? <Text style={styles.loginLink}>Inicia sesión aquí</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>

      {/* Modal de confirmación - Verificar correo */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleConfirmClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icono de correo */}
            <View style={styles.successIcon}>
              <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
                <Path
                  d="M54 10H6C2.7 10 0.15 12.45 0.15 15.75L0 45c0 3.3 2.7 6 6 6h48c3.3 0 6-2.7 6-6V15c0-3.3-2.7-6-6-6zm0 9l-24 15L6 19v0z"
                  fill="#ff4d00"
                />
              </Svg>
            </View>

            {/* Título */}
            <Text style={styles.modalTitle}>¡Verifica tu Correo!</Text>

            {/* Mensaje */}
            <Text style={styles.modalMessage}>
              Se ha enviado un correo de verificación a tu cuenta. Por favor verifica tu dirección de correo para completar el registro.
            </Text>

            {/* Botón OK */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleConfirmClose}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 20,
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
  backButtonTop: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontFamily: 'Nunito-Black',
    fontWeight: '900',
    fontSize: 28,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    fontFamily: 'Nunito-Light',
    fontWeight: '300',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 6,
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
    paddingVertical: 12,
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
    fontSize: 14,
    color: '#1a1a1a',
    padding: 0,
  },
  errorText: {
    fontFamily: 'Nunito-Light',
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#ff4d00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#ff4d00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '800',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  loginLinkContainer: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontFamily: 'Nunito-Light',
    fontSize: 13,
    color: '#666666',
  },
  loginLink: {
    color: '#ff4d00',
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  successIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Nunito-Black',
    fontWeight: '900',
    fontSize: 22,
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: 'Nunito-Light',
    fontWeight: '300',
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#ff4d00',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff4d00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonText: {
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '800',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});