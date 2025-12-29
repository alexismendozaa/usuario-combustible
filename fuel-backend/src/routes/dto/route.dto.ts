import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoutePointDto } from './create-route.dto';

export class RouteSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  name?: string | null;

  @ApiProperty()
  startedAt!: Date;

  @ApiProperty()
  endedAt!: Date;

  @ApiProperty({ description: 'Duración en segundos' })
  durationSec!: number;

  @ApiProperty({ description: 'Distancia en kilómetros' })
  distanceKm!: number;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  vehicleId?: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class RouteFullDto extends RouteSummaryDto {
  @ApiProperty({ type: [RoutePointDto] })
  points!: RoutePointDto[];
}
