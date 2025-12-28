import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ 
    example: 'Mi Honda Civic',
    description: 'Nombre del vehículo',
    minLength: 2
  })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ 
    example: 'Honda',
    description: 'Marca del vehículo',
    required: false
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ 
    example: 'Civic',
    description: 'Modelo del vehículo',
    required: false
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ 
    example: 2020,
    description: 'Año del vehículo',
    minimum: 1950,
    maximum: 2100,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  year?: number;

  @ApiProperty({ 
    example: 'ABC-123',
    description: 'Placa del vehículo',
    required: false
  })
  @IsOptional()
  @IsString()
  plate?: string;

  @ApiProperty({ 
    example: 'Gasolina',
    description: 'Tipo de combustible',
    required: false
  })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiProperty({ 
    example: 50000,
    description: 'Kilometraje actual del vehículo',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  odometerKm?: number;
}
