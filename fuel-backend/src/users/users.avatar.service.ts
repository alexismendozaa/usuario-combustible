import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';
import type { Express } from 'express';

@Injectable()
export class UsersAvatarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getBaseUrlAndPrefix() {
    const baseUrl = this.config.get<string>('S3_PUBLIC_BASE_URL');
    if (!baseUrl) throw new BadRequestException('S3_PUBLIC_BASE_URL no configurado');
    const prefix = this.config.get<string>('S3_UPLOAD_PREFIX') || 'uploads/avatars';
    return { baseUrl, prefix };
  }

  private extFromMime(mime?: string) {
    switch (mime) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        return '.jpg';
    }
  }

  async setAvatarFromFile(userId: string, file: Express.Multer.File) {
    if (!file || !file.buffer) throw new BadRequestException('Archivo inválido');
    const { baseUrl, prefix } = this.getBaseUrlAndPrefix();

    // Delete previous if exists
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });
    if (current?.avatarKey) {
      try {
        await fetch(`${baseUrl}/${current.avatarKey}`, { method: 'DELETE' });
      } catch {
        // ignorar errores de borrado remoto
      }
    }

    const filename = `${Date.now()}-${randomUUID()}${this.extFromMime(file.mimetype)}`;
    const key = `${prefix}/${userId}/${filename}`;

    const putRes = await fetch(`${baseUrl}/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': file.mimetype || 'image/jpeg',
      },
      body: new Uint8Array(file.buffer),
    });
    if (!putRes.ok) {
      throw new BadRequestException('Error subiendo la imagen al almacenamiento público');
    }

    const avatarUrl = `${baseUrl}/${key}`;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarKey: key, avatarUrl },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    return { ok: true, user };
  }

  async getAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, avatarUrl: true },
    });
    return { ok: true, user };
  }

  async deleteAvatar(userId: string) {
    const { baseUrl } = this.getBaseUrlAndPrefix();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });

    if (user?.avatarKey) {
      try {
        await fetch(`${baseUrl}/${user.avatarKey}`, { method: 'DELETE' });
      } catch {
        // ignore delete errors
      }
    }

    const cleared = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarKey: null, avatarUrl: null },
      select: { id: true, email: true, avatarUrl: true },
    });

    return { ok: true, user: cleared };
  }
}
