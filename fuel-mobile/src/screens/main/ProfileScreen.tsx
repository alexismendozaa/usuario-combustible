/**
 * Screen de Perfil
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api/userService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import * as ImagePicker from 'expo-image-picker';
import { CONFIG } from '../../config/constants';
import BottomNavigation from '../../components/common/BottomNavigation';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'email' | 'password' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setNameInput(user?.name || '');
    setEmailInput(user?.email || '');
  }, [user]);

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert('Error', 'No se pudo cerrar la sesión');
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const handleUpdateName = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }
    try {
      setLoading(true);
      await userService.updateName({ name: nameInput.trim() });
      await refreshUser();
      Alert.alert('Éxito', 'Nombre actualizado correctamente');
      setEditingField(null);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el nombre');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailInput.trim()) {
      Alert.alert('Error', 'Ingresa un correo válido');
      return;
    }
    if (!currentPassword) {
      Alert.alert('Error', 'Ingresa tu contraseña actual');
      return;
    }
    try {
      setLoading(true);
      await userService.requestEmailChange({ 
        newEmail: emailInput.trim(),
        currentPassword 
      });
      Alert.alert('Revisa tu correo', 'Te enviamos un enlace para confirmar el cambio');
      setEditingField(null);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo solicitar el cambio de correo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Completa todos los campos de contraseña');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    try {
      setLoading(true);
      await userService.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Éxito', 'Contraseña actualizada');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > CONFIG.MAX_AVATAR_SIZE) {
          Alert.alert('Error', 'La imagen es demasiado grande. Máximo 5MB');
          return;
        }

        setLoading(true);
        try {
          await userService.uploadAvatar(asset.uri);
          await refreshUser();
          Alert.alert('Éxito', 'Avatar actualizado correctamente');
        } catch (error: any) {
          const message = error?.response?.data?.message || 'No se pudo subir el avatar';
          Alert.alert('Error', message);
        } finally {
          setLoading(false);
        }
      }
    } catch (error: any) {
      const message = error?.message || 'Error al seleccionar imagen';
      Alert.alert('Error', message);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Ingresa tu contraseña para confirmar');
      return;
    }

    setLoading(true);
    try {
      await userService.deleteAccount(deletePassword);
      Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada correctamente', [
        { text: 'OK', onPress: () => logout() }
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'No se pudo eliminar la cuenta';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeletePassword('');
    }
  };

  return (
    <View style={styles.background}>
      <ImageBackground
        source={require('../../../assets/images/auth/fondo-light.png')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={handleUploadAvatar} disabled={loading}>
            <Text style={styles.avatarButton}>Cambiar foto</Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre</Text>
            <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setNameInput(user?.name || '');
              setEditingField('name');
            }}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Correo</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setEmailInput(user?.email || '');
              setCurrentPassword('');
              setEditingField('email');
            }}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contraseña</Text>
            <Text style={styles.infoValue}>••••••••</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setEditingField('password');
            }}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Cambiar</Text>
          </TouchableOpacity>
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutLink}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
          <Button
            title="Eliminar Cuenta"
            onPress={handleDeleteAccount}
            variant="danger"
            style={styles.button}
          />
        </View>
      </View>

      {/* Modal de edición de nombre */}
      <Modal visible={editingField === 'name'} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Nombre</Text>
              <TouchableOpacity onPress={() => setEditingField(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              <Input
                label="Nombre"
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Tu nombre"
              />

              <Button
                title="Guardar"
                onPress={handleUpdateName}
                loading={loading}
                style={styles.submitButton}
              />

              <Button
                title="Cancelar"
                onPress={() => setEditingField(null)}
                variant="secondary"
                style={styles.cancelButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de edición de correo */}
      <Modal visible={editingField === 'email'} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Correo</Text>
              <TouchableOpacity onPress={() => setEditingField(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              <Input
                label="Contraseña Actual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Ingresa tu contraseña"
                secureTextEntry
                required
              />

              <Input
                label="Nuevo Correo"
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
                required
              />

              <Button
                title="Solicitar Cambio"
                onPress={handleUpdateEmail}
                loading={loading}
                style={styles.submitButton}
              />

              <Button
                title="Cancelar"
                onPress={() => setEditingField(null)}
                variant="secondary"
                style={styles.cancelButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de cambio de contraseña */}
      <Modal visible={editingField === 'password'} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setEditingField(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              <Input
                label="Contraseña Actual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Contraseña actual"
                secureTextEntry
                required
              />

              <Input
                label="Nueva Contraseña"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nueva contraseña"
                secureTextEntry
                required
              />

              <Input
                label="Confirmar Contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar nueva contraseña"
                secureTextEntry
                required
              />

              <Button
                title="Actualizar"
                onPress={handleUpdatePassword}
                loading={loading}
                style={styles.submitButton}
              />

              <Button
                title="Cancelar"
                onPress={() => setEditingField(null)}
                variant="secondary"
                style={styles.cancelButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Confirmar Eliminación de Cuenta */}
      <Modal visible={showDeleteModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Eliminar Cuenta</Text>
              <TouchableOpacity onPress={() => {
                setShowDeleteModal(false);
                setDeletePassword('');
              }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              <Text style={styles.warningText}>
                ⚠️ Esta acción es permanente y eliminará todos tus datos: vehículos, recargas, mantenimientos y rutas.
              </Text>
              
              <Text style={styles.confirmText}>
                Para confirmar, ingresa tu contraseña:
              </Text>

              <Input
                label="Contraseña"
                placeholder="Tu contraseña actual"
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
              />

              <Button
                title="Eliminar mi cuenta"
                onPress={confirmDeleteAccount}
                loading={loading}
                variant="danger"
                style={styles.submitButton}
              />

              <Button
                title="Cancelar"
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                variant="secondary"
                style={styles.cancelButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
        </ScrollView>
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
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff4d00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarButton: {
    fontSize: 16,
    color: '#ff4d00',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d1d1d6',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ff4d00',
    borderRadius: 6,
    marginLeft: 12,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    marginTop: 20,
    gap: 8,
  },
  button: {
    marginBottom: 12,
  },
  logoutLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF3B30',
    textDecorationLine: 'underline',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    fontSize: 28,
    color: '#C7C7CC',
    fontWeight: '300',
  },
  formContent: {
    padding: 16,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 32,
  },
  warningText: {
    fontSize: 14,
    color: '#FF3B30',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  confirmText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 16,
    fontWeight: '600',
  },
});