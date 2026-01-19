import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Contraseña actual del usuario para confirmar la eliminación',
    example: 'miPassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
