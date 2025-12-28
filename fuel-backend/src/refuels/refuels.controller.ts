import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { RefuelsService } from './refuels.service';
import { CreateRefuelDto } from './dto/create-refuel.dto';
import { UpdateRefuelDto } from './dto/update-refuel.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Cargas de Combustible (Requiere Auth)')
@Controller('refuels')
export class RefuelsController {
  constructor(private readonly refuels: RefuelsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Registrar carga de combustible',
    description: 'Registra una nueva carga de combustible para un vehículo.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Carga registrada',
    example: {
      ok: true,
      refuel: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        vehicleId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
        filledAt: '2025-12-28T10:30:00.000Z',
        odometerKm: 51234,
        liters: 45.5,
        totalCost: 850.50,
        pricePerLiter: 18.69,
        note: 'Estación Shell, centro',
        lat: 19.4326,
        lng: -99.1332
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  create(@CurrentUser() u: { userId: string }, @Body() dto: CreateRefuelDto) {
    return this.refuels.create(u.userId, dto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar cargas de combustible',
    description: 'Obtiene todas las cargas del usuario. Opcionalmente filtrar por vehículo.'
  })
  @ApiQuery({ name: 'vehicleId', required: false, description: 'ID del vehículo para filtrar', example: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de cargas',
    example: {
      ok: true,
      refuels: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          vehicleId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
          filledAt: '2025-12-28T10:30:00.000Z',
          odometerKm: 51234,
          liters: 45.5,
          totalCost: 850.50,
          pricePerLiter: 18.69
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  list(
    @CurrentUser() u: { userId: string },
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.refuels.list(u.userId, vehicleId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener carga de combustible',
    description: 'Obtiene los detalles de una carga específica.'
  })
  @ApiParam({ name: 'id', description: 'ID de la carga', example: 'cm5h8k9l0000208l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Carga obtenida',
    example: {
      ok: true,
      refuel: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        vehicleId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
        filledAt: '2025-12-28T10:30:00.000Z',
        odometerKm: 51234,
        liters: 45.5,
        totalCost: 850.50,
        note: 'Estación Shell'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Carga no encontrada' })
  get(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.refuels.get(u.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar carga de combustible',
    description: 'Actualiza los datos de una carga.'
  })
  @ApiParam({ name: 'id', description: 'ID de la carga', example: 'cm5h8k9l0000208l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Carga actualizada',
    example: {
      ok: true,
      refuel: {
        id: 'cm5h8k9l0000208l5abc123def',
        liters: 46.0,
        totalCost: 860.00
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Carga no encontrada' })
  update(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateRefuelDto,
  ) {
    return this.refuels.update(u.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar carga de combustible',
    description: 'Elimina una carga de combustible.'
  })
  @ApiParam({ name: 'id', description: 'ID de la carga', example: 'cm5h8k9l0000208l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Carga eliminada',
    example: {
      ok: true,
      message: 'Carga eliminada'
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Carga no encontrada' })
  remove(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.refuels.remove(u.userId, id);
  }
}
