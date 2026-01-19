/**
 * Componente Picker (Select/Combobox)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface PickerOption {
  label: string;
  value: string | number;
}

interface PickerProps {
  label?: string;
  placeholder?: string;
  options: PickerOption[];
  selectedValue?: string | number; // backwards compatibility
  value?: string | number;
  onValueChange: (value: string | number) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const Picker: React.FC<PickerProps> = ({
  label,
  placeholder = 'Selecciona una opción',
  options,
  selectedValue,
  value,
  onValueChange,
  required = false,
  disabled = false,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const effectiveValue = selectedValue !== undefined ? selectedValue : value;
  const selectedOption = options.find((opt) => opt.value === effectiveValue);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.disabled,
          error && styles.error,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.buttonText,
            !selectedOption && styles.placeholder,
          ]}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <MaterialCommunityIcons 
          name="chevron-down" 
          size={24} 
          color={disabled ? '#C7C7CC' : '#666666'} 
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona una opción</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  selectedOption?.value === item.value && styles.selectedOption,
                ]}
                onPress={() => {
                  onValueChange(item.value);
                  setModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedOption?.value === item.value && styles.selectedOptionText,
                  ]}
                >
                  {item.label}
                </Text>
                {selectedOption?.value === item.value && (
                  <MaterialCommunityIcons 
                    name="check-circle" 
                    size={24} 
                    color="#ff4d00" 
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  required: {
    color: '#FF3B30',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    backgroundColor: '#FFFFFF',
  },
  disabled: {
    backgroundColor: '#F9F9F9',
    opacity: 0.6,
  },
  error: {
    borderColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  placeholder: {
    color: '#C7C7CC',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    fontSize: 16,
    color: '#ff4d00',
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 77, 0, 0.05)',
  },
  optionText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#ff4d00',
  },
});
