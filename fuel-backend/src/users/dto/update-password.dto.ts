import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'password123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    example: 'newpassword456',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
