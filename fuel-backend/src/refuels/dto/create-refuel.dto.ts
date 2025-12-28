import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRefuelDto {
  @ApiProperty({ 
    example: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
    description: 'ID del vehículo'
  })
  @IsString()
  vehicleId!: string;

  @ApiProperty({ 
    example: '2025-12-28T10:30:00.000Z',
    description: 'Fecha y hora de la carga (formato ISO)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  filledAt?: string;

  @ApiProperty({ 
    example: 51234,
    description: 'Kilometraje al momento de la carga',
    minimum: 0
  })
  @IsInt()
  @Min(0)
  odometerKm!: number;

  @ApiProperty({ 
    example: 45.5,
    description: 'Litros cargados',
    minimum: 0.001
  })
  @IsNumber()
  @Min(0.001)
  liters!: number;

  @ApiProperty({ 
    example: 850.50,
    description: 'Costo total de la carga',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  totalCost!: number;

  @ApiProperty({ 
    example: 'Estación Shell, centro',
    description: 'Nota o comentario adicional',
    required: false
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ 
    example: 19.4326,
    description: 'Latitud de la ubicación',
    required: false
  })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiProperty({ 
    example: -99.1332,
    description: 'Longitud de la ubicación',
    required: false
  })
  @IsOptional()
  @IsNumber()
  lng?: number;
}
