import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailDto {
  @ApiProperty({
    description: 'Nueva dirección de correo electrónico',
    example: 'nuevo@ejemplo.com',
  })
  @IsEmail()
  newEmail: string;

  @ApiProperty({
    description: 'Contraseña actual del usuario (opcional pero recomendado)',
    example: 'password123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  currentPassword?: string;
}
