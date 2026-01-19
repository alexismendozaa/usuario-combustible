/**
 * Servicio de pagos (Stripe)
 */

import apiClient from './apiClient';

export interface CreateCheckoutData {
  amountCents: number;
  description?: string;
}

export interface CreateCheckoutResponse {
  paymentId: string;
  checkoutUrl: string;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
}

export interface Payment {
  id: string;
  userId: string;
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  description?: string;
  createdAt: string;
  paidAt?: string;
}

class PaymentService {
  /**
   * Crear sesión de checkout de Stripe
   */
  async createCheckout(data: CreateCheckoutData): Promise<CreateCheckoutResponse> {
    const response = await apiClient.post<CreateCheckoutResponse>('/payments/checkout', data);
    return response.data;
  }

  /**
   * Obtener estado de un pago
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const response = await apiClient.get<PaymentStatus>(`/payments/${paymentId}/status`);
    return response.data;
  }

  /**
   * Listar pagos del usuario
   */
  async list(): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>('/payments');
    return response.data;
  }

  /**
   * Obtener URL de recibo oficial
   */
  async getReceipt(paymentId: string): Promise<{ receiptUrl: string }> {
    const response = await apiClient.get<{ receiptUrl: string }>(`/payments/${paymentId}/receipt`);
    return response.data;
  }
}

export const paymentService = new PaymentService();