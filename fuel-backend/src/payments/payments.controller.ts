import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Pagos / Stripe')
@Controller('payments')
export class PaymentsController {
  private stripe: Stripe;

  constructor(
    private readonly payments: PaymentsService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY')!;
    this.stripe = new Stripe(key, { apiVersion: '2025-12-15.clover' });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('checkout')
  @ApiOperation({ 
    summary: 'Crear Checkout de Stripe',
    description: 'Crea una sesión de pago en Stripe Checkout. Devuelve un URL donde el usuario puede completar el pago. Al completar el pago, se enviará un recibo por email.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Checkout creado exitosamente',
    example: {
      paymentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4...'
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o URLs no configuradas' })
  checkout(@CurrentUser() u: { userId: string }, @Body() dto: CreateCheckoutDto) {
    return this.payments.createCheckout(u.userId, dto.amountCents, dto.description);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ 
    summary: 'Listar pagos del usuario',
    description: 'Obtiene el historial de pagos del usuario autenticado, ordenados por fecha de creación (más reciente primero).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de pagos',
    example: [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'paid',
        amountCents: 5000,
        currency: 'usd',
        description: 'Pago de prueba',
        stripeSessionId: 'cs_test_a1b2c3d4...',
        stripePaymentIntentId: 'pi_3abc123...',
        paidAt: '2025-12-29T18:30:00.000Z',
        createdAt: '2025-12-29T18:25:00.000Z'
      }
    ]
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  list(@CurrentUser() u: { userId: string }) {
    return this.payments.list(u.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/receipt')
  @ApiOperation({
    summary: 'Obtener URL de recibo oficial',
    description: 'Devuelve el receipt_url oficial generado por Stripe para el pago indicado.'
  })
  @ApiResponse({
    status: 200,
    description: 'URL de recibo recuperada',
    example: { receiptUrl: 'https://pay.stripe.com/receipts/payment/CAca...' }
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  @ApiResponse({ status: 400, description: 'No hay recibo disponible' })
  getReceipt(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.payments.getReceiptUrl(u.userId, id);
  }

  // Stripe webhook (sin auth)
  @Post('webhook')
  async webhook(@Req() req: any) {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const whsec = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    console.log('[WEBHOOK] Recibido');
    console.log('[WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[WEBHOOK] Signature header:', sig ? 'presente' : 'ausente');
    console.log('[WEBHOOK] Secret configurado:', whsec ? 'presente' : 'ausente');
    console.log('[WEBHOOK] rawBody:', req.rawBody ? 'presente' : 'ausente');
    console.log('[WEBHOOK] Body type:', typeof req.body);

    if (!sig || !whsec) {
      console.log('[WEBHOOK] ERROR: Sin firma o secret no configurado');
      console.log('[WEBHOOK] Verifica que stripe listen esté corriendo y conectado');
      return { ok: false };
    }

    let event: Stripe.Event;
    try {
      // Usar rawBody si está disponible, si no usar req.body
      let body: string;
      if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
        body = req.rawBody.toString('utf8');
      } else if (Buffer.isBuffer(req.body)) {
        body = req.body.toString('utf8');
      } else if (typeof req.body === 'string') {
        body = req.body;
      } else {
        body = JSON.stringify(req.body);
      }
      
      console.log('[WEBHOOK] Verificando firma con Stripe...');
      event = this.stripe.webhooks.constructEvent(body, sig, whsec);
    } catch (err) {
      console.error('[WEBHOOK] ERROR al verificar firma:', err.message);
      return { ok: false };
    }

    console.log('[WEBHOOK] OK -', event.type);

    // Evento clave para Checkout: checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[WEBHOOK] Procesando pago completado. Session:', session.id);

      // Solo marcar como pagado; Stripe enviará recibo oficial si
      // en Dashboard está habilitado "Email customers for successful payments"
      await this.payments.markPaidBySession(
        session.id,
        session.payment_intent as string | null
      );

      console.log('[WEBHOOK] Pago marcado como completado');
    }

    return { ok: true };
  }
}
