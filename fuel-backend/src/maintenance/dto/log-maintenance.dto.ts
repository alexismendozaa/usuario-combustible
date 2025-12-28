import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogMaintenanceDto {
  @ApiProperty({ 
    example: '2025-12-28T10:00:00.000Z',
    description: 'Fecha cuando se realizó el mantenimiento (formato ISO)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  doneAt?: string;

  @ApiProperty({ 
    example: 55000,
    description: 'Kilometraje al momento del mantenimiento',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  odometerKm?: number;

  @ApiProperty({ 
    example: 450.00,
    description: 'Costo del mantenimiento',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiProperty({ 
    example: 'Realizado en taller mecánico',
    description: 'Notas adicionales',
    required: false
  })
  @IsOptional()
  @IsString()
  note?: string;
}
