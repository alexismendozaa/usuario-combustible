import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from './mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private signAccessToken(payload: { sub: string; email: string }) {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: `${this.config.get<number>('ACCESS_TOKEN_TTL') || 900}s`,
    });
  }

  private signRefreshToken(payload: { sub: string; email: string }) {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: `${this.config.get<number>('REFRESH_TOKEN_TTL') || 2592000}s`,
    });
  }

  private generateVerifyToken(): string {
    return randomBytes(32).toString('hex'); // 64 chars
  }

  private expiresInMinutes(min: number) {
    return new Date(Date.now() + min * 60 * 1000);
  }

  private generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  async register(input: { email: string; password: string; name?: string }) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new BadRequestException('Email ya registrado');

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.users.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    await this.sendVerificationEmail(user.id, user.email);

    return { ok: true, message: 'Revisa tu correo para verificar la cuenta.' };
  }

  async sendVerificationEmail(userId: string, email: string) {
    const secret = this.generateVerifyToken();
    const secretHash = await bcrypt.hash(secret, 10);

    const row = await this.prisma.emailVerificationToken.create({
      data: {
        userId: userId,
        tokenHash: secretHash,
        expiresAt: this.expiresInMinutes(30),
      },
    });

    const verifyToken = `${row.id}.${secret}`;
    await this.mail.sendVerificationLink(email, verifyToken);
  }

  async sendEmailChangeVerification(userId: string, newEmail: string, pendingId: string) {
    const secret = this.generateVerifyToken();
    const secretHash = await bcrypt.hash(secret, 10);

    // Actualizar el token en PendingEmailChange
    await this.prisma.pendingEmailChange.update({
      where: { id: pendingId },
      data: { tokenHash: secretHash },
    });

    const token = `${pendingId}.${secret}`;
    const baseUrl =
      this.config.get<string>('APP_PUBLIC_URL') || 'http://localhost:3000';
    const link = `${baseUrl}/users/me/email/confirm/${token}`;

    await this.mail.sendEmailChangeLink(newEmail, link);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Debes verificar tu correo antes de iniciar sesión',
      );
    }

    const accessToken = this.signAccessToken({
      sub: user.id,
      email: user.email,
    });
    const refreshToken = this.signRefreshToken({
      sub: user.id,
      email: user.email,
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const ttlSeconds = this.config.get<number>('REFRESH_TOKEN_TTL') || 2592000;
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    };
  }

  async verifyEmailWithToken(verifyToken: string) {
    const parts = verifyToken.split('.');
    if (parts.length !== 2) throw new BadRequestException('Token inválido');

    const [id, secret] = parts;

    const row = await this.prisma.emailVerificationToken.findUnique({
      where: { id },
    });
    if (!row) throw new BadRequestException('Token inválido');
    if (row.usedAt) throw new BadRequestException('Token ya usado');
    if (row.expiresAt <= new Date())
      throw new BadRequestException('Token expirado');

    const ok = await bcrypt.compare(secret, row.tokenHash);
    if (!ok) throw new BadRequestException('Token inválido');

    await this.prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });

    await this.prisma.user.update({
      where: { id: row.userId },
      data: { isVerified: true },
    });

    return { ok: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Respuesta SIEMPRE igual (para no filtrar si existe o no)
    if (!user) return { ok: true };

    const secret = this.generateSecret();
    const secretHash = await bcrypt.hash(secret, 10);

    const row = await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: secretHash,
        expiresAt: this.expiresInMinutes(30),
      },
    });

    const token = `${row.id}.${secret}`;
    await this.mail.sendPasswordResetLink(user.email, token);

    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const parts = token.split('.');
    if (parts.length !== 2) throw new BadRequestException('Token inválido');

    const [id, secret] = parts;

    const row = await this.prisma.passwordResetToken.findUnique({
      where: { id },
    });
    if (!row) throw new BadRequestException('Token inválido');
    if (row.usedAt) throw new BadRequestException('Token ya usado');
    if (row.expiresAt <= new Date())
      throw new BadRequestException('Token expirado');

    const ok = await bcrypt.compare(secret, row.tokenHash);
    if (!ok) throw new BadRequestException('Token inválido');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 1) marcar token como usado
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });

    // 2) actualizar contraseña
    await this.prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });

    // (Opcional recomendado) invalidar otros tokens de reset pendientes del usuario
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null, id: { not: id } },
      data: { usedAt: new Date() },
    });

    return { ok: true };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isVerified)
      throw new UnauthorizedException('No autorizado');

    const candidates = await this.prisma.refreshToken.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const match = await (async () => {
      for (const row of candidates) {
        const ok = await bcrypt.compare(refreshToken, row.tokenHash);
        if (ok) return row;
      }
      return null;
    })();

    if (!match) throw new UnauthorizedException('Refresh token inválido');

    const accessToken = this.signAccessToken({
      sub: user.id,
      email: user.email,
    });
    return { accessToken };
  }

  async logout(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      return { ok: true };
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  }
}
