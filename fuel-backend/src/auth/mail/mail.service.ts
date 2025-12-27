import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT') || 587),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationCode(to: string, code: string) {
    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('SMTP_USER')!;
    await this.transporter.sendMail({
      from,
      to,
      subject: 'Código de verificación',
      text: `Tu código de verificación es: ${code}\nEste código expira en 10 minutos.`,
    });
  }

  async sendVerificationLink(to: string, token: string) {
    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('SMTP_USER')!;
    const baseUrl =
      this.config.get<string>('APP_PUBLIC_URL') || 'http://localhost:3000';
    const link = `${baseUrl}/auth/verify-email/confirm/${token}`;

    await this.transporter.sendMail({
      from,
      to,
      subject: 'Verifica tu correo',
      html: `
        <h2>Verificación de correo</h2>
        <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>
        <a href="${link}" style="
          display:inline-block;
          padding:10px 16px;
          background:#2563eb;
          color:#fff;
          text-decoration:none;
          border-radius:6px;
        ">Verificar correo</a>
        <p>Este enlace expira en 30 minutos.</p>
      `,
    });
  }

  async sendPasswordResetLink(to: string, token: string) {
    const from =
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('SMTP_USER')!;
    const baseUrl =
      this.config.get<string>('APP_PUBLIC_URL') || 'http://localhost:3000';
    const link = `${baseUrl}/auth/reset-password/confirm/${token}`;

    await this.transporter.sendMail({
      from,
      to,
      subject: 'Recuperación de contraseña',
      html: `
        <h2>Recuperación de contraseña</h2>
        <p>Haz clic para restablecer tu contraseña:</p>
        <a href="${link}" style="
          display:inline-block;
          padding:10px 16px;
          background:#16a34a;
          color:#fff;
          text-decoration:none;
          border-radius:6px;
        ">Restablecer contraseña</a>
        <p>Este enlace expira en 30 minutos.</p>
        <p>Si no fuiste tú, ignora este correo.</p>
      `,
    });
  }
}
