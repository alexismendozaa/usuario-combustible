import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Usuario (Requiere Auth)')
@Controller('users/me')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener perfil del usuario',
    description: 'Obtiene los datos del perfil del usuario autenticado.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil obtenido',
    example: {
      userId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
      email: 'usuario@ejemplo.com',
      name: 'Juan Pérez',
      avatarUrl: 'https://s3.example.com/uploads/avatars/af56dcb6-35a3-4b27-a24f-d0a6fa8e4082/1735394400000-abc123.jpg'
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async me(@CurrentUser() u: { userId: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: u.userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        avatarUrl: true 
      },
    });

    return { 
      userId: user?.id, 
      email: user?.email, 
      name: user?.name,
      avatarUrl: user?.avatarUrl 
    };
  }
}
