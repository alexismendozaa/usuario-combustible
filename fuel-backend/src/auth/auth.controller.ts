import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { userId: string; email: string }) {
    return user;
  }

  @Post('verify-email')
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
    } catch (e) {
      return res.status(400).send(`
        <h2>Error al verificar</h2>
        <p>El enlace es inválido o ha expirado.</p>
      `);
    }
  }

  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
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
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      await this.auth.resetPassword(token, body.newPassword);
      return res.send(
        `<h2>Contraseña actualizada ✅</h2><p>Ya puedes iniciar sesión.</p>`,
      );
    } catch (e) {
      return res
        .status(400)
        .send(`<h2>Error ❌</h2><p>Token inválido o expirado.</p>`);
    }
  }
}
