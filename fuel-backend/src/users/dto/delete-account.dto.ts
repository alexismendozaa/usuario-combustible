import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Contraseña actual del usuario para verificar identidad',
    example: 'MiContraseñaSegura123',
  })
  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  password: string;
}
