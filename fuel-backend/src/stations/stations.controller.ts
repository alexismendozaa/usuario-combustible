import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StationsService } from './stations.service';

@ApiTags('Estaciones (Público)')
@Controller('stations')
export class StationsController {
  constructor(private readonly stations: StationsService) {}

  @Get('nearby')
  @ApiOperation({
    summary: 'Buscar estaciones cercanas',
    description:
      'Devuelve estaciones de servicio cercanas al punto indicado usando la API de Overpass.',
  })
  @ApiQuery({
    name: 'lat',
    description: 'Latitud en grados decimales',
    example: 19.4326,
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'lng',
    description: 'Longitud en grados decimales',
    example: -99.1332,
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'radius',
    description:
      'Radio de búsqueda en metros (200 - 10000). Por defecto 2000m.',
    example: 2500,
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de estaciones cercanas',
    example: {
      count: 2,
      stations: [
        {
          id: 'node/123456789',
          name: 'Gasolinera Demo',
          brand: 'PEMEX',
          operator: 'Operador SA de CV',
          lat: 19.4327,
          lng: -99.1331,
          address: 'Av. Reforma 123, CDMX',
        },
        {
          id: 'way/987654321',
          name: 'Gasolinera Centro',
          brand: null,
          operator: null,
          lat: 19.433,
          lng: -99.134,
          address: null,
        },
      ],
    },
  })
  nearby(
    @Query('lat') latStr: string,
    @Query('lng') lngStr: string,
    @Query('radius') radiusStr?: string,
  ) {
    const lat = Number(latStr);
    const lng = Number(lngStr);
    const radius = radiusStr ? Number(radiusStr) : 2000;

    return this.stations.nearby(lat, lng, radius);
  }
}
