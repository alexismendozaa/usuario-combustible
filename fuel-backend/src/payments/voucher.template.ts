export function buildVoucherHtml(input: {
  paymentId: string;
  amountCents: number;
  currency: string;
  description?: string | null;
  paidAt: Date;
  stripeSessionId?: string | null;
  email?: string | null;
}) {
  const amount = (input.amountCents / 100).toFixed(2);
  const date = input.paidAt.toISOString().replace('T', ' ').replace('.000Z', ' UTC');

  return `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 16px;">
    <h2 style="margin: 0 0 12px;">Voucher de pago</h2>
    <p style="margin: 0 0 16px; color:#333;">
      Gracias. Tu pago fue registrado correctamente.
    </p>

    <div style="border:1px solid #ddd; border-radius:12px; padding:16px;">
      <p><b>ID Voucher:</b> ${input.paymentId}</p>
      <p><b>Monto:</b> ${amount} ${input.currency.toUpperCase()}</p>
      <p><b>Concepto:</b> ${input.description ?? 'Pago (demo)'}</p>
      <p><b>Fecha:</b> ${date}</p>
      <p><b>Stripe Session:</b> ${input.stripeSessionId ?? '-'}</p>
      <p><b>Cliente:</b> ${input.email ?? '-'}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0;" />
      <p style="margin:0;color:#666;font-size:12px;">
        * Voucher generado automáticamente para fines académicos (Stripe Test Mode).
      </p>
    </div>
  </div>
  `;
}
