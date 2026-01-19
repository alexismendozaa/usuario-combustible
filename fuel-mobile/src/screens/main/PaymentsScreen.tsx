/**
 * Screen de Pagos
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { paymentService, Payment } from '../../services/api/paymentService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = async () => {
    try {
      const data = await paymentService.list();
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
      Alert.alert('Error', 'No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const handleCheckout = async () => {
    try {
      // Ejemplo: crear checkout de prueba
      Alert.alert('Info', 'Funcionalidad de checkout próximamente');
      // const response = await paymentService.createCheckout({
      //   amountCents: 1000, // $10.00
      //   description: 'Pago de prueba',
      // });
      // Aquí navegarías a WebView con checkoutUrl
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el checkout');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentAmount}>
                ${(item.amountCents / 100).toFixed(2)} {item.currency.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.paymentStatus,
                  item.status === 'paid' ? styles.statusPaid : styles.statusPending,
                ]}
              >
                {item.status === 'paid' ? 'Pagado' : 'Pendiente'}
              </Text>
            </View>
            {item.description && (
              <Text style={styles.paymentDescription}>{item.description}</Text>
            )}
            <Text style={styles.paymentDate}>
              {new Date(item.createdAt).toLocaleDateString('es-ES')}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay pagos registrados</Text>
            <Button
              title="Nuevo Pago"
              onPress={handleCheckout}
              style={styles.addButton}
            />
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPaid: {
    color: '#34C759',
    backgroundColor: '#E8F5E9',
  },
  statusPending: {
    color: '#FF9500',
    backgroundColor: '#FFF3E0',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  addButton: {
    minWidth: 200,
  },
});