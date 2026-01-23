import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user';

@ApiTags('Autenticación (Público)')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description:
      'Crea una nueva cuenta de usuario. Se enviará un correo de verificación.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    example: {
      ok: true,
      message: 'Usuario creado. Revisa tu correo para verificar tu cuenta.',
      user: {
        id: 'cm5h8k9l0000108l5abc123def',
        email: 'usuario@ejemplo.com',
        name: 'Juan Pérez',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email ya registrado o datos inválidos',
  })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Inicia sesión con email y contraseña. Devuelve access token y refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    example: {
      ok: true,
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 'cm5h8k9l0000108l5abc123def',
        email: 'usuario@ejemplo.com',
        name: 'Juan Pérez',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o email no verificado',
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Obtener usuario actual',
    description:
      'Requiere autenticación. Devuelve información del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario obtenido',
    example: {
      userId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
      email: 'usuario@ejemplo.com',
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  me(@CurrentUser() user: { userId: string; email: string }) {
    return user;
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verificar email con token',
    description:
      'Verifica el email del usuario usando el token enviado por correo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verificado',
    example: {
      ok: true,
      message: 'Correo verificado correctamente',
    },
  })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmailWithToken(dto.token);
  }

  @Get('verify-email/confirm/:token')
  async verifyEmailFromLink(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    try {
      await this.auth.verifyEmailWithToken(token);
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Correo Verificado - SmartFuel</title>
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
              background: linear-gradient(90deg, #ff4d00, #ff6b35);
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
            <h1 class="title">¡Correo Verificado!</h1>
            <p class="message">Tu cuenta ha sido verificada correctamente. Ya puedes iniciar sesión en la aplicación SmartFuel.</p>
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
          <title>Error de Verificación - SmartFuel</title>
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
            <h1 class="title">Error de Verificación</h1>
            <p class="message">El enlace es inválido o ha expirado. Por favor, solicita un nuevo enlace de verificación desde la aplicación.</p>
            <p class="brand">SMARTFUEL</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Solicitar restablecimiento de contraseña',
    description:
      'Envía un correo con un enlace para restablecer la contraseña.',
  })
  @ApiResponse({
    status: 200,
    description: 'Correo enviado',
    example: {
      ok: true,
      message:
        'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
    },
  })
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description:
      'Restablece la contraseña usando el token recibido por correo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada',
    example: {
      ok: true,
      message: 'Contraseña actualizada correctamente',
    },
  })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }

  @Get('reset-password/confirm/:token')
  confirmReset(@Param('token') token: string, @Res() res: Response) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña - SmartFuel</title>
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
            background: linear-gradient(135deg, #ff4d00 0%, #ff6b35 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 0 8px 20px rgba(255, 77, 0, 0.3);
          }
          .icon-container svg { width: 40px; height: 40px; }
          .title {
            font-size: 24px;
            font-weight: 800;
            color: #1a1a1a;
            margin-bottom: 12px;
          }
          .subtitle {
            font-size: 16px;
            color: #666666;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .divider {
            height: 4px;
            width: 60px;
            background: linear-gradient(90deg, #ff4d00, #ff6b35);
            border-radius: 2px;
            margin: 0 auto 24px;
          }
          form { text-align: left; }
          .form-group { margin-bottom: 20px; }
          label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          input[type="password"] {
            width: 100%;
            padding: 14px 16px;
            font-size: 16px;
            font-family: 'Nunito', sans-serif;
            border: 1.5px solid #d1d1d6;
            border-radius: 12px;
            background: #ffffff;
            color: #1a1a1a;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          input[type="password"]:focus {
            outline: none;
            border-color: #ff4d00;
            box-shadow: 0 0 0 3px rgba(255, 77, 0, 0.1);
          }
          input[type="password"]::placeholder { color: #999999; }
          .btn {
            width: 100%;
            padding: 16px;
            font-size: 16px;
            font-weight: 800;
            font-family: 'Nunito', sans-serif;
            color: #ffffff;
            background: linear-gradient(135deg, #ff4d00 0%, #ff6b35 100%);
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(255, 77, 0, 0.3);
            letter-spacing: 0.5px;
          }
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 77, 0, 0.4);
          }
          .btn:active { transform: translateY(0); }
          .hint {
            font-size: 12px;
            color: #8E8E93;
            margin-top: 6px;
          }
          .brand {
            font-size: 14px;
            color: #ff4d00;
            font-weight: 700;
            letter-spacing: 1px;
            margin-top: 32px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-container">
            <svg fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div class="divider"></div>
          <h1 class="title">Nueva Contraseña</h1>
          <p class="subtitle">Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.</p>
          <form method="POST" action="/auth/reset-password/confirm/${token}">
            <div class="form-group">
              <label for="newPassword">Nueva contraseña</label>
              <input type="password" id="newPassword" name="newPassword" minlength="8" required placeholder="Mínimo 8 caracteres" />
              <p class="hint">Usa al menos 8 caracteres</p>
            </div>
            <button type="submit" class="btn">CAMBIAR CONTRASEÑA</button>
          </form>
          <p class="brand">SMARTFUEL</p>
        </div>
      </body>
      </html>
    `);
  }

  @Post('reset-password/confirm/:token')
  async confirmResetPost(
    @Param('token') token: string,
    @Body('newPassword') newPassword: string,
    @Res() res: Response,
  ) {
    try {
      await this.auth.resetPassword(token, newPassword);
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contraseña Actualizada - SmartFuel</title>
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
            <h1 class="title">¡Contraseña Actualizada!</h1>
            <p class="message">Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión en la aplicación SmartFuel con tu nueva contraseña.</p>
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
            <p class="message">El enlace es inválido o ha expirado. Por favor, solicita un nuevo enlace de recuperación de contraseña desde la aplicación.</p>
            <p class="brand">SMARTFUEL</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar access token',
    description: 'Obtiene un nuevo access token usando el refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado',
    example: {
      ok: true,
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida el refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada',
    example: {
      ok: true,
      message: 'Logout exitoso',
    },
  })
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }
}
