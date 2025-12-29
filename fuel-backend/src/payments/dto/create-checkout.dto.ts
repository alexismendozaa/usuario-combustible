import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'Monto en centavos (ej: 5000 = $50.00)',
    example: 5000,
    minimum: 50,
  })
  @IsInt()
  @Min(50) // mínimo 0.50 USD por ejemplo
  amountCents!: number;

  @ApiProperty({
    description: 'Descripción del pago',
    example: 'Recarga de combustible',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
