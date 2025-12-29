import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RouteFullDto, RouteSummaryDto } from './dto/route.dto';

@ApiTags('routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear ruta',
    description: 'Crea una ruta con puntos GPS',
  })
  @ApiBody({
    type: CreateRouteDto,
    examples: {
      ejemplo: {
        summary: 'Ejemplo de creación de ruta',
        description:
          'Ruta con vehículo, nombre y tres puntos GPS con timestamps ISO.',
        value: {
          vehicleId: '82efb501-0c91-4ed1-8f66-8e7436723057e',
          name: 'Viaje al trabajo',
          points: [
            { lat: -0.1807, lng: -78.4678, ts: '2025-12-29T16:00:00.000Z' },
            { lat: -0.1811, lng: -78.4682, ts: '2025-12-29T16:02:00.000Z' },
            { lat: -0.1816, lng: -78.4686, ts: '2025-12-29T16:05:00.000Z' },
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({ type: RouteSummaryDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiForbiddenResponse({ description: 'Prohibido' })
  create(@CurrentUser() u: { userId: string }, @Body() dto: CreateRouteDto) {
    return this.routes.create(u.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar rutas' })
  @ApiOkResponse({ type: [RouteSummaryDto] })
  list(@CurrentUser() u: { userId: string }) {
    return this.routes.list(u.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ruta por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: RouteFullDto })
  @ApiNotFoundResponse({ description: 'Ruta no encontrada' })
  @ApiForbiddenResponse({ description: 'Prohibido' })
  get(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.routes.get(u.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar ruta' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @ApiNotFoundResponse({ description: 'Ruta no encontrada' })
  @ApiForbiddenResponse({ description: 'Prohibido' })
  remove(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.routes.remove(u.userId, id);
  }
}
