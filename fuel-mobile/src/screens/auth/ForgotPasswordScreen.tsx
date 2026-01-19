/**
 * Screen de Recuperar Contraseña
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

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const validate = () => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El correo no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestReset = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      await requestPasswordReset(email.trim());
      setShowConfirmModal(true);
      setEmail('');
    } catch (error: any) {
      const message = error.message || 'Error al procesar la solicitud. Intenta de nuevo.';
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
          <Text style={styles.title}>Recuperar Contraseña</Text>

          {/* Mensaje descriptivo */}
          <Text style={styles.description}>
            Te enviaremos un correo con las instrucciones para recuperar tu contraseña
          </Text>

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

          {/* Botón Enviar */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRequestReset}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>ENVIAR</Text>
          </TouchableOpacity>

          {/* Link para regresar al login */}
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN as never)}
            style={styles.backLinkContainer}
          >
            <Text style={styles.backLink}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>

      {/* Modal de confirmación */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleConfirmClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icono de éxito */}
            <View style={styles.successIcon}>
              <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
                <Path
                  d="M30 5C16.25 5 5 16.25 5 30C5 43.75 16.25 55 30 55C43.75 55 55 43.75 55 30C55 16.25 43.75 5 30 5ZM24 40L12 28L15.75 24.25L24 32.5L44.25 12.25L48 16L24 40Z"
                  fill="#4CAF50"
                />
              </Svg>
            </View>

            {/* Título */}
            <Text style={styles.modalTitle}>¡Correo Enviado!</Text>

            {/* Mensaje */}
            <Text style={styles.modalMessage}>
              Se ha enviado un correo a tu cuenta con las instrucciones para recuperar tu contraseña. Por favor revisa tu bandeja de entrada.
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
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  submitButton: {
    backgroundColor: '#ff4d00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  backLinkContainer: {
    alignItems: 'center',
  },
  backLink: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#ff4d00',
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