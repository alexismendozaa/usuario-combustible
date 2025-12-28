import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaintenanceItemDto {
  @ApiProperty({ 
    example: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
    description: 'ID del vehículo'
  })
  @IsString()
  vehicleId!: string;

  @ApiProperty({ 
    example: 'Cambio de aceite',
    description: 'Título del mantenimiento',
    minLength: 2
  })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ 
    example: 'Aceite sintético 5W-30',
    description: 'Notas adicionales',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    example: 5000,
    description: 'Intervalo en kilómetros',
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalKm?: number;

  @ApiProperty({ 
    example: 6,
    description: 'Intervalo en meses',
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMonths?: number;

  @ApiProperty({ 
    example: 50000,
    description: 'Kilometraje cuando se realizó por última vez',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lastDoneOdometerKm?: number;

  @ApiProperty({ 
    example: '2025-12-01T10:00:00.000Z',
    description: 'Fecha cuando se realizó por última vez (formato ISO)',
    required: false
  })
  @IsOptional()
  @IsString()
  lastDoneAt?: string;
}
