import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    example: 'usuario@ejemplo.com',
    description: 'Correo electrónico del usuario'
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ 
    example: 'MiPassword123!',
    description: 'Contraseña (mínimo 8 caracteres)',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ 
    example: 'Juan Pérez',
    description: 'Nombre del usuario (opcional)',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;
}
