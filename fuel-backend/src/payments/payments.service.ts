import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../auth/mail/mail.service';
import { buildVoucherHtml } from './voucher.template';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) throw new Error('STRIPE_SECRET_KEY no configurado');
    this.stripe = new Stripe(key, { apiVersion: '2025-12-15.clover' });
  }

  async createCheckout(userId: string, amountCents: number, description?: string) {
    const currency = this.config.get<string>('STRIPE_CURRENCY') || 'usd';
    const successUrl = this.config.get<string>('STRIPE_SUCCESS_URL');
    const cancelUrl = this.config.get<string>('STRIPE_CANCEL_URL');

    if (!successUrl || !cancelUrl) {
      throw new BadRequestException('Success/Cancel URLs no configuradas');
    }

    // 1) Obtenemos el email del usuario
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    console.log('[CHECKOUT] Usuario:', user?.id, 'Email:', user?.email);

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // 2) Crear customer en Stripe (para facturas y recibos oficiales)
    console.log('[CHECKOUT] Creando customer en Stripe...');
    const customer = await this.stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });
    console.log('[CHECKOUT] Customer creado:', customer.id);

    // 3) Creamos registro local "pending"
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        status: 'pending',
        amountCents,
        currency,
        description,
      },
    });

    // 4) Creamos la Checkout Session en Stripe
    console.log('[CHECKOUT] Creando sesión con customer:', customer.id);
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customer.id,
      // Asegurar que el cargo tenga email para recibo oficial
      payment_intent_data: {
        receipt_email: user.email,
      },
      client_reference_id: payment.id,
      metadata: {
        paymentId: payment.id,
        userId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: {
              name: description || 'Pago (demo)',
            },
          },
        },
      ],

    });

    console.log('[CHECKOUT] Sesión creada:', session.id, 'Customer:', customer.id);

    // 4) Guardamos sessionId
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id },
    });

    return {
      paymentId: payment.id,
      checkoutUrl: session.url, // Stripe devuelve URL (Checkout)
    };
  }

  async markPaidBySession(stripeSessionId: string, paymentIntentId?: string | null) {
    const p = await this.prisma.payment.findFirst({ where: { stripeSessionId } });
    if (!p) return;

    if (p.status !== 'paid') {
      const updated = await this.prisma.payment.update({
        where: { id: p.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          stripePaymentIntentId: paymentIntentId ?? p.stripePaymentIntentId,
        },
      });

      // Enviar voucher por email (custom) y, si existe, incluir el recibo oficial
      try {
        const user = await this.prisma.user.findUnique({ where: { id: updated.userId } });
        if (user?.email) {
          let receiptUrl: string | null = null;
          const pi = paymentIntentId ?? updated.stripePaymentIntentId ?? null;
          if (pi) {
            const charges = await this.stripe.charges.list({ payment_intent: pi, limit: 1 });
            receiptUrl = charges.data[0]?.receipt_url ?? null;
          }

          const html = buildVoucherHtml({
            paymentId: updated.id,
            amountCents: updated.amountCents,
            currency: updated.currency,
            description: updated.description,
            paidAt: updated.paidAt!,
            stripeSessionId: updated.stripeSessionId,
            email: user.email,
          }) + (receiptUrl ? `
            <p style="margin-top:12px;">
              Recibo oficial de Stripe: 
              <a href="${receiptUrl}" target="_blank">ver recibo</a>
            </p>
          ` : '');

          await this.mail.sendVoucherEmail(
            user.email,
            'Voucher de pago',
            html,
          );
        }
      } catch (err) {
        // No romper el flujo si falla el correo
        console.warn('[PAYMENTS] Error enviando voucher:', (err as Error).message);
      }
    }
  }

  async markPaidAndGet(paymentSessionId: string, paymentIntentId?: string | null) {
    const p = await this.prisma.payment.findFirst({ where: { stripeSessionId: paymentSessionId } });
    if (!p) return null;

    const updated = await this.prisma.payment.update({
      where: { id: p.id },
      data: {
        status: 'paid',
        paidAt: p.paidAt ?? new Date(),
        stripePaymentIntentId: paymentIntentId ?? p.stripePaymentIntentId,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: updated.userId } });
    return { payment: updated, user };
  }

  list(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReceiptUrl(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      throw new BadRequestException('Pago no encontrado');
    }

    let intentId = payment.stripePaymentIntentId || null;

    // Si aún no tenemos el PaymentIntent, intentamos obtenerlo desde la sesión
    if (!intentId) {
      if (!payment.stripeSessionId) {
        throw new BadRequestException('PaymentIntent no disponible aún');
      }

      const session = await this.stripe.checkout.sessions.retrieve(payment.stripeSessionId);
      const pi = (session.payment_intent as string | null) ?? null;
      if (!pi) {
        throw new BadRequestException('PaymentIntent no disponible');
      }

      intentId = pi;
      // Persistimos para próximas consultas
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { stripePaymentIntentId: pi },
      });
    }

    // Obtenemos el cargo asociado al PaymentIntent y leemos el receipt_url
    const charges = await this.stripe.charges.list({ payment_intent: intentId!, limit: 1 });
    const charge = charges.data[0];
    const receiptUrl = charge?.receipt_url ?? null;

    if (!receiptUrl) {
      throw new BadRequestException('No hay recibo disponible');
    }

    return { receiptUrl };
  }
}
