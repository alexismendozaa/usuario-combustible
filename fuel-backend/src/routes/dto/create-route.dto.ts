import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoutePointDto {
  @ApiProperty({ example: -34.6037, description: 'Latitud del punto' })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -58.3816, description: 'Longitud del punto' })
  @IsNumber()
  lng!: number;

  @ApiProperty({
    example: '2025-12-29T12:34:56.000Z',
    description: 'Timestamp ISO 8601',
  })
  @IsDateString()
  ts!: string; // timestamp ISO
}

export class CreateRouteDto {
  @ApiPropertyOptional({
    description: 'ID del vehículo (opcional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({
    description: 'Nombre amigable de la ruta',
    example: 'Viaje al trabajo',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    type: [RoutePointDto],
    description: 'Puntos GPS (orden no importa, se ordena por ts)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutePointDto)
  points!: RoutePointDto[];
}
