import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailDto {
  @ApiProperty({
    description: 'Nueva dirección de correo electrónico',
    example: 'nuevo@ejemplo.com',
  })
  @IsEmail()
  newEmail: string;
}
