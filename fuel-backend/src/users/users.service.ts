import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: { email: string; passwordHash: string; name?: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        avatarKey: null,
        avatarUrl: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  async updateName(userId: string, name: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });
  }

  async requestEmailChange(userId: string, newEmail: string) {
    // Verificar que el email no esté en uso
    const existing = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existing && existing.id !== userId) {
      throw new BadRequestException('Email ya está en uso');
    }

    // Crear un registro de cambio pendiente
    const pending = await this.prisma.pendingEmailChange.create({
      data: {
        userId,
        newEmail,
        tokenHash: 'placeholder', // Se llenará desde el servicio de auth
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      },
    });

    return pending;
  }

  async confirmEmailChange(token: string) {
    // Token formato: {id}.{secret}
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Token inválido');
    }

    const [id, secret] = parts;

    // Buscar el registro pendiente
    const pending = await this.prisma.pendingEmailChange.findUnique({
      where: { id },
    });

    if (!pending) {
      throw new BadRequestException('Token inválido');
    }
    if (pending.usedAt) {
      throw new BadRequestException('Token ya usado');
    }
    if (pending.expiresAt <= new Date()) {
      throw new BadRequestException('Token expirado');
    }

    // Verificar hash del token
    const valid = await bcrypt.compare(secret, pending.tokenHash);
    if (!valid) {
      throw new BadRequestException('Token inválido');
    }

    // Actualizar email Y marcar como verificado (sin requerir userId)
    const updated = await this.prisma.user.update({
      where: { id: pending.userId },
      data: {
        email: pending.newEmail,
        isVerified: true, // Marcar el nuevo email como verificado
      },
    });

    await this.prisma.pendingEmailChange.update({
      where: { id: pending.id },
      data: { usedAt: new Date() },
    });

    return {
      message:
        'Email actualizado correctamente. Por favor, inicia sesión con tu nuevo email.',
    };
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { ok: true, message: 'Contraseña actualizada correctamente' };
  }

  async deleteAccount(userId: string, password: string) {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar la contraseña
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    // Eliminar registros relacionados en cascada o marcar como eliminado
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { ok: true, message: 'Cuenta eliminada correctamente' };
  }
}
