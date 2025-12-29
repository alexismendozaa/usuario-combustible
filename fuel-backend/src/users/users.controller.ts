import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';
import { UpdateNameDto } from './dto/update-name.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { AuthService } from '../auth/auth.service';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Usuario (Requiere Auth)')
@Controller('users/me')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener perfil del usuario',
    description: 'Obtiene los datos del perfil del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido',
    example: {
      userId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
      email: 'usuario@ejemplo.com',
      name: 'Juan Pérez',
      avatarUrl:
        'https://s3.example.com/uploads/avatars/af56dcb6-35a3-4b27-a24f-d0a6fa8e4082/1735394400000-abc123.jpg',
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async me(@CurrentUser() u: { userId: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: u.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    return {
      userId: user?.id,
      email: user?.email,
      name: user?.name,
      avatarUrl: user?.avatarUrl,
    };
  }

  @Patch('name')
  @ApiOperation({
    summary: 'Actualizar nombre del usuario',
    description: 'Actualiza el nombre del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Nombre actualizado',
    example: {
      id: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
      email: 'usuario@ejemplo.com',
      name: 'Nuevo Nombre',
      avatarUrl: null,
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async updateName(
    @CurrentUser() u: { userId: string },
    @Body() dto: UpdateNameDto,
  ) {
    return this.usersService.updateName(u.userId, dto.name);
  }

  @Patch('email')
  @ApiOperation({
    summary: 'Solicitar cambio de email',
    description:
      'Solicita cambiar el email del usuario. Se envía un correo de verificación al NUEVO email. El cambio solo se aplica tras confirmarlo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Se envió correo de verificación',
    example: {
      message:
        'Se ha enviado un correo de verificación a nuevo@ejemplo.com. Confirma el enlace para cambiar tu email.',
    },
  })
  @ApiResponse({ status: 400, description: 'Email ya está en uso' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async requestEmailChange(
    @CurrentUser() u: { userId: string },
    @Body() dto: UpdateEmailDto,
  ) {
    const pending = await this.usersService.requestEmailChange(
      u.userId,
      dto.newEmail,
    );

    // Enviar correo de verificación al nuevo email
    await this.authService.sendEmailChangeVerification(
      u.userId,
      dto.newEmail,
      pending.id,
    );

    return {
      message: `Se ha enviado un correo de verificación a ${dto.newEmail}. Confirma el enlace para cambiar tu email.`,
    };
  }

  @Get('email/confirm/:token')
  @Public()
  @ApiOperation({
    summary: 'Confirmar cambio de email',
    description:
      'Confirma el cambio de email usando el token enviado al nuevo correo. Este endpoint NO requiere autenticación y se accede vía GET (enlace en el correo).',
  })
  @ApiResponse({
    status: 200,
    description: 'Email actualizado correctamente',
    example: {
      message:
        'Email actualizado correctamente. Por favor, inicia sesión con tu nuevo email.',
    },
  })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async confirmEmailChange(@Param('token') token: string) {
    return this.usersService.confirmEmailChange(token);
  }

  @Patch('password')
  @ApiOperation({
    summary: 'Cambiar contraseña',
    description:
      'Cambia la contraseña del usuario autenticado. Requiere la contraseña actual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada',
    example: {
      ok: true,
      message: 'Contraseña actualizada correctamente',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado o contraseña actual incorrecta',
  })
  async updatePassword(
    @CurrentUser() u: { userId: string },
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(
      u.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar cuenta',
    description:
      'Elimina permanentemente la cuenta del usuario autenticado y todos sus datos relacionados. Requiere la contraseña actual para verificar identidad.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cuenta eliminada',
    example: {
      ok: true,
      message: 'Cuenta eliminada correctamente',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado o contraseña incorrecta',
  })
  async deleteAccount(
    @CurrentUser() u: { userId: string },
    @Body() dto: DeleteAccountDto,
  ) {
    return this.usersService.deleteAccount(u.userId, dto.password);
  }
}
