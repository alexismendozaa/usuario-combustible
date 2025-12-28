import { Controller, Delete, Get, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { UsersAvatarService } from './users.avatar.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiBody, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Avatar (Requiere Auth)')
@Controller('users/me/avatar')
export class UsersAvatarController {
  constructor(private readonly avatars: UsersAvatarService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Subir imagen de avatar (JPG, PNG o WebP, máximo 5MB)',
    schema: {
      type: 'object',
      properties: {
        file: { 
          type: 'string', 
          format: 'binary',
          description: 'Archivo de imagen (jpg, png, webp)'
        },
      },
    },
  })
  @ApiOperation({ 
    summary: 'Subir avatar',
    description: 'Sube o reemplaza la foto de perfil del usuario. Máximo 5MB.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Avatar subido',
    example: {
      ok: true,
      user: {
        id: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
        email: 'usuario@ejemplo.com',
        name: 'Juan Pérez',
        avatarUrl: 'https://s3.example.com/uploads/avatars/af56dcb6-35a3-4b27-a24f-d0a6fa8e4082/1735394400000-abc123.jpg'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido o muy grande' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  upload(@CurrentUser() u: { userId: string }, @UploadedFile() file: Express.Multer.File) {
    return this.avatars.setAvatarFromFile(u.userId, file);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener avatar',
    description: 'Obtiene la URL del avatar del usuario.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Avatar obtenido',
    example: {
      ok: true,
      user: {
        id: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
        email: 'usuario@ejemplo.com',
        avatarUrl: 'https://s3.example.com/uploads/avatars/af56dcb6-35a3-4b27-a24f-d0a6fa8e4082/avatar.jpg'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  get(@CurrentUser() u: { userId: string }) {
    return this.avatars.getAvatar(u.userId);
  }

  @Delete()
  @ApiOperation({ 
    summary: 'Eliminar avatar',
    description: 'Elimina la foto de perfil del usuario.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Avatar eliminado',
    example: {
      ok: true,
      user: {
        id: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
        email: 'usuario@ejemplo.com',
        avatarUrl: null
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  clear(@CurrentUser() u: { userId: string }) {
    return this.avatars.deleteAvatar(u.userId);
  }
}
