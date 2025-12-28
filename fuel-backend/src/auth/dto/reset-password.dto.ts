import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ 
    example: 'abc123.xyz789secrettoken',
    description: 'Token de restablecimiento de contraseña (formato id.secret)'
  })
  @IsString()
  token!: string;

  @ApiProperty({ 
    example: 'NuevaPassword123!',
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
