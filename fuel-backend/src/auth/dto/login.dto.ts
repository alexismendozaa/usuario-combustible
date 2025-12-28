import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'usuario@ejemplo.com',
    description: 'Correo electrónico del usuario'
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ 
    example: 'MiPassword123!',
    description: 'Contraseña del usuario',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
