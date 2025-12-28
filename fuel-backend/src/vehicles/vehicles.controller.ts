import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Vehículos (Requiere Auth)')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Crear vehículo',
    description: 'Crea un nuevo vehículo para el usuario autenticado.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Vehículo creado',
    example: {
      ok: true,
      vehicle: {
        id: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
        name: 'Mi Honda Civic',
        brand: 'Honda',
        model: 'Civic',
        year: 2020,
        plate: 'ABC-123',
        fuelType: 'Gasolina',
        odometerKm: 50000,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2025-12-28T10:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  create(
    @CurrentUser() u: { userId: string },
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehicles.create(u.userId, dto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar vehículos',
    description: 'Obtiene todos los vehículos del usuario autenticado.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de vehículos',
    example: {
      ok: true,
      vehicles: [
        {
          id: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
          name: 'Mi Honda Civic',
          brand: 'Honda',
          model: 'Civic',
          year: 2020,
          plate: 'ABC-123',
          odometerKm: 50000
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  list(@CurrentUser() u: { userId: string }) {
    return this.vehicles.list(u.userId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener vehículo',
    description: 'Obtiene un vehículo específico del usuario.'
  })
  @ApiParam({ name: 'id', description: 'ID del vehículo', example: 'cm5h8k9l0000108l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vehículo obtenido',
    example: {
      ok: true,
      vehicle: {
        id: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
        name: 'Mi Honda Civic',
        brand: 'Honda',
        model: 'Civic',
        year: 2020,
        plate: 'ABC-123',
        fuelType: 'Gasolina',
        odometerKm: 50000
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  get(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.vehicles.get(u.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar vehículo',
    description: 'Actualiza los datos de un vehículo.'
  })
  @ApiParam({ name: 'id', description: 'ID del vehículo', example: 'cm5h8k9l0000108l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vehículo actualizado',
    example: {
      ok: true,
      vehicle: {
        id: 'cm5h8k9l0000108l5abc123def',
        name: 'Mi Honda Civic 2020',
        odometerKm: 51000
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  update(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles.update(u.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar vehículo',
    description: 'Elimina un vehículo y todos sus registros asociados.'
  })
  @ApiParam({ name: 'id', description: 'ID del vehículo', example: 'cm5h8k9l0000108l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vehículo eliminado',
    example: {
      ok: true,
      message: 'Vehículo eliminado'
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  remove(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.vehicles.remove(u.userId, id);
  }
}
