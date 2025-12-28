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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
    description: 'Crea una nueva cuenta de usuario. Se enviará un correo de verificación.'
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
        name: 'Juan Pérez'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Email ya registrado o datos inválidos' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'Iniciar sesión',
    description: 'Inicia sesión con email y contraseña. Devuelve access token y refresh token.'
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
        name: 'Juan Pérez'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o email no verificado' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ 
    summary: 'Obtener usuario actual',
    description: 'Requiere autenticación. Devuelve información del usuario autenticado.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario obtenido',
    example: {
      userId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
      email: 'usuario@ejemplo.com'
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  me(@CurrentUser() user: { userId: string; email: string }) {
    return user;
  }

  @Post('verify-email')
  @ApiOperation({ 
    summary: 'Verificar email con token',
    description: 'Verifica el email del usuario usando el token enviado por correo.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email verificado',
    example: {
      ok: true,
      message: 'Correo verificado correctamente'
    }
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
        <h2>Correo verificado correctamente</h2>
        <p>Ya puedes iniciar sesión en la aplicación.</p>
      `);
    } catch {
      return res.status(400).send(`
        <h2>Error al verificar</h2>
        <p>El enlace es inválido o ha expirado.</p>
      `);
    }
  }

  @Post('forgot-password')
  @ApiOperation({ 
    summary: 'Solicitar restablecimiento de contraseña',
    description: 'Envía un correo con un enlace para restablecer la contraseña.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Correo enviado',
    example: {
      ok: true,
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.'
    }
  })
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ 
    summary: 'Restablecer contraseña',
    description: 'Restablece la contraseña usando el token recibido por correo.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contraseña actualizada',
    example: {
      ok: true,
      message: 'Contraseña actualizada correctamente'
    }
  })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }

  @Get('reset-password/confirm/:token')
  confirmReset(@Param('token') token: string, @Res() res: Response) {
    return res.send(`
      <h2>Restablecer contraseña</h2>
      <form method="POST" action="/auth/reset-password/confirm/${token}">
        <label>Nueva contraseña:</label><br/>
        <input type="password" name="newPassword" minlength="8" required /><br/><br/>
        <button type="submit">Cambiar contraseña</button>
      </form>
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
      return res.send(
        `<h2>Contraseña actualizada</h2><p>Ya puedes iniciar sesión.</p>`,
      );
    } catch {
      return res
        .status(400)
        .send(`<h2>Error</h2><p>Token inválido o expirado.</p>`);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Renovar access token',
    description: 'Obtiene un nuevo access token usando el refresh token.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token renovado',
    example: {
      ok: true,
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cerrar sesión',
    description: 'Invalida el refresh token.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sesión cerrada',
    example: {
      ok: true,
      message: 'Logout exitoso'
    }
  })
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }
}
