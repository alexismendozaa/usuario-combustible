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

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private signAccessToken(payload: { sub: string; email: string }) {
    return this.jwt.sign(payload);
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

    const secret = this.generateVerifyToken();
    const secretHash = await bcrypt.hash(secret, 10);

    const row = await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: secretHash,
        expiresAt: this.expiresInMinutes(30),
      },
    });

    const verifyToken = `${row.id}.${secret}`;
    await this.mail.sendVerificationLink(user.email, verifyToken);

    return { ok: true, message: 'Revisa tu correo para verificar la cuenta.' };
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

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
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
}
