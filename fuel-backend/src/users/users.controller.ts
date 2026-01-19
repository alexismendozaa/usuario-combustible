import { Controller, Get, Param, Patch, Delete, Body, UseGuards, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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

  @Patch('name')
  @ApiOperation({ 
    summary: 'Actualizar nombre del usuario',
    description: 'Actualiza el nombre del usuario autenticado.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Nombre actualizado',
    example: {
      id: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
      email: 'usuario@ejemplo.com',
      name: 'Nuevo Nombre',
      avatarUrl: null
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async updateName(@CurrentUser() u: { userId: string }, @Body() dto: UpdateNameDto) {
    return this.usersService.updateName(u.userId, dto.name);
  }

  @Patch('email')
  @ApiOperation({ 
    summary: 'Solicitar cambio de email',
    description: 'Solicita cambiar el email del usuario. Se envía un correo de verificación al NUEVO email. El cambio solo se aplica tras confirmarlo.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Se envió correo de verificación',
    example: {
      message: 'Se ha enviado un correo de verificación a nuevo@ejemplo.com. Confirma el enlace para cambiar tu email.'
    }
  })
  @ApiResponse({ status: 400, description: 'Email ya está en uso o contraseña incorrecta' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async requestEmailChange(@CurrentUser() u: { userId: string }, @Body() dto: UpdateEmailDto) {
    const pending = await this.usersService.requestEmailChange(u.userId, dto.newEmail, dto.currentPassword);
    
    // Enviar correo de verificación al nuevo email
    await this.authService.sendEmailChangeVerification(u.userId, dto.newEmail, pending.id);
    
    return {
      message: `Se ha enviado un correo de verificación a ${dto.newEmail}. Confirma el enlace para cambiar tu email.`,
    };
  }

  @Get('email/confirm/:token')
  @Public()
  @ApiOperation({ 
    summary: 'Confirmar cambio de email',
    description: 'Confirma el cambio de email usando el token enviado al nuevo correo. Este endpoint NO requiere autenticación y se accede vía GET (enlace en el correo).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email actualizado correctamente',
  })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async confirmEmailChange(@Param('token') token: string, @Res() res: Response) {
    try {
      await this.usersService.confirmEmailChange(token);
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Actualizado - SmartFuel</title>
          <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
              background: linear-gradient(135deg, #fff5f0 0%, #ffffff 50%, #fff8f5 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 16px;
              box-shadow: 0 10px 40px rgba(255, 77, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.05);
              padding: 48px 40px;
              max-width: 420px;
              width: 100%;
              text-align: center;
              border: 1.5px solid #d1d1d6;
            }
            .icon-container {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #34C759 0%, #30D158 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
              box-shadow: 0 8px 20px rgba(52, 199, 89, 0.3);
            }
            .icon-container svg { width: 40px; height: 40px; }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #1a1a1a;
              margin-bottom: 12px;
            }
            .message {
              font-size: 16px;
              color: #666666;
              line-height: 1.6;
              margin-bottom: 32px;
            }
            .brand {
              font-size: 14px;
              color: #ff4d00;
              font-weight: 700;
              letter-spacing: 1px;
            }
            .divider {
              height: 4px;
              width: 60px;
              background: linear-gradient(90deg, #34C759, #30D158);
              border-radius: 2px;
              margin: 0 auto 24px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon-container">
              <svg fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="divider"></div>
            <h1 class="title">¡Email Actualizado!</h1>
            <p class="message">Tu correo electrónico ha sido actualizado correctamente. Ya puedes iniciar sesión en SmartFuel con tu nuevo email.</p>
            <p class="brand">SMARTFUEL</p>
          </div>
        </body>
        </html>
      `);
    } catch {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - SmartFuel</title>
          <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
              background: linear-gradient(135deg, #fff5f0 0%, #ffffff 50%, #fff8f5 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 16px;
              box-shadow: 0 10px 40px rgba(255, 77, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.05);
              padding: 48px 40px;
              max-width: 420px;
              width: 100%;
              text-align: center;
              border: 1.5px solid #d1d1d6;
            }
            .icon-container {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #FF3B30 0%, #FF453A 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
              box-shadow: 0 8px 20px rgba(255, 59, 48, 0.3);
            }
            .icon-container svg { width: 40px; height: 40px; }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #1a1a1a;
              margin-bottom: 12px;
            }
            .message {
              font-size: 16px;
              color: #666666;
              line-height: 1.6;
              margin-bottom: 32px;
            }
            .brand {
              font-size: 14px;
              color: #ff4d00;
              font-weight: 700;
              letter-spacing: 1px;
            }
            .divider {
              height: 4px;
              width: 60px;
              background: linear-gradient(90deg, #FF3B30, #FF453A);
              border-radius: 2px;
              margin: 0 auto 24px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon-container">
              <svg fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div class="divider"></div>
            <h1 class="title">Error</h1>
            <p class="message">El enlace es inválido o ha expirado. Por favor, solicita un nuevo cambio de email desde la aplicación.</p>
            <p class="brand">SMARTFUEL</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  @Patch('password')
  @ApiOperation({ 
    summary: 'Cambiar contraseña',
    description: 'Cambia la contraseña del usuario autenticado. Requiere la contraseña actual.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contraseña actualizada',
    example: {
      ok: true,
      message: 'Contraseña actualizada correctamente'
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado o contraseña actual incorrecta' })
  async updatePassword(@CurrentUser() u: { userId: string }, @Body() dto: UpdatePasswordDto) {
    return this.usersService.updatePassword(u.userId, dto.currentPassword, dto.newPassword);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Eliminar cuenta',
    description: 'Elimina permanentemente la cuenta del usuario autenticado y todos sus datos relacionados. Requiere contraseña para confirmar.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cuenta eliminada',
    example: {
      ok: true,
      message: 'Cuenta eliminada correctamente'
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado o contraseña incorrecta' })
  async deleteAccount(@CurrentUser() u: { userId: string }, @Body() dto: DeleteAccountDto) {
    return this.usersService.deleteAccount(u.userId, dto.password);
  }
}
