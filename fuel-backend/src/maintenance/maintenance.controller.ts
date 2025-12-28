import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceItemDto } from './dto/create-maintenance-item.dto';
import { UpdateMaintenanceItemDto } from './dto/update-maintenance-item.dto';
import { LogMaintenanceDto } from './dto/log-maintenance.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Mantenimiento (Requiere Auth)')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Post('items')
  @ApiOperation({ 
    summary: 'Crear item de mantenimiento',
    description: 'Crea un nuevo item de mantenimiento programado para un vehículo.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Item creado',
    example: {
      ok: true,
      item: {
        id: '660e8400-e29b-41d4-a716-446655440000',
        vehicleId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
        title: 'Cambio de aceite',
        notes: 'Aceite sintético 5W-30',
        intervalKm: 5000,
        intervalMonths: 6,
        lastDoneOdometerKm: 50000,
        lastDoneAt: '2025-12-01T10:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  createItem(@CurrentUser() u: { userId: string }, @Body() dto: CreateMaintenanceItemDto) {
    return this.maintenance.create(u.userId, dto);
  }

  @Get('items')
  @ApiOperation({ 
    summary: 'Listar items de mantenimiento',
    description: 'Obtiene todos los items de mantenimiento. Opcionalmente filtrar por vehículo.'
  })
  @ApiQuery({ name: 'vehicleId', required: false, description: 'ID del vehículo para filtrar', example: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de items',
    example: {
      ok: true,
      items: [
        {
          id: '660e8400-e29b-41d4-a716-446655440000',
          vehicleId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
          title: 'Cambio de aceite',
          intervalKm: 5000,
          lastDoneOdometerKm: 50000
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  listItems(
    @CurrentUser() u: { userId: string },
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.maintenance.list(u.userId, vehicleId);
  }

  @Get('items/:id')
  @ApiOperation({ 
    summary: 'Obtener item de mantenimiento',
    description: 'Obtiene los detalles de un item específico.'
  })
  @ApiParam({ name: 'id', description: 'ID del item', example: 'cm5h8k9l0000308l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Item obtenido',
    example: {
      ok: true,
      item: {
        id: '660e8400-e29b-41d4-a716-446655440000',
        title: 'Cambio de aceite',
        notes: 'Aceite sintético 5W-30',
        intervalKm: 5000
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  getItem(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.maintenance.get(u.userId, id);
  }

  @Patch('items/:id')
  @ApiOperation({ 
    summary: 'Actualizar item de mantenimiento',
    description: 'Actualiza los datos de un item.'
  })
  @ApiParam({ name: 'id', description: 'ID del item', example: 'cm5h8k9l0000308l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Item actualizado',
    example: {
      ok: true,
      item: {
        id: 'cm5h8k9l0000308l5abc123def',
        title: 'Cambio de aceite y filtro',
        intervalKm: 6000
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  updateItem(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceItemDto,
  ) {
    return this.maintenance.update(u.userId, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ 
    summary: 'Eliminar item de mantenimiento',
    description: 'Elimina un item de mantenimiento y su historial.'
  })
  @ApiParam({ name: 'id', description: 'ID del item', example: 'cm5h8k9l0000308l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Item eliminado',
    example: {
      ok: true,
      message: 'Item eliminado'
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  removeItem(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.maintenance.remove(u.userId, id);
  }

  @Post('items/:id/log')
  @ApiOperation({ 
    summary: 'Marcar mantenimiento como realizado',
    description: 'Registra que un mantenimiento fue realizado.'
  })
  @ApiParam({ name: 'id', description: 'ID del item', example: 'cm5h8k9l0000308l5abc123def' })
  @ApiResponse({ 
    status: 201, 
    description: 'Mantenimiento registrado',
    example: {
      ok: true,
      log: {
        id: '770e8400-e29b-41d4-a716-446655440000',
        maintenanceItemId: '660e8400-e29b-41d4-a716-446655440000',
        doneAt: '2025-12-28T10:00:00.000Z',
        odometerKm: 55000,
        cost: 450.00,
        note: 'Realizado en taller mecánico'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  logDone(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
    @Body() dto: LogMaintenanceDto,
  ) {
    return this.maintenance.logDone(u.userId, id, dto);
  }

  @Get('items/:id/logs')
  @ApiOperation({ 
    summary: 'Obtener historial de mantenimiento',
    description: 'Obtiene el historial de realizaciones de un item.'
  })
  @ApiParam({ name: 'id', description: 'ID del item', example: 'cm5h8k9l0000308l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial obtenido',
    example: {
      ok: true,
      logs: [
        {
          id: '770e8400-e29b-41d4-a716-446655440000',
          doneAt: '2025-12-28T10:00:00.000Z',
          odometerKm: 55000,
          cost: 450.00,
          note: 'Realizado en taller'
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  logs(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.maintenance.logs(u.userId, id);
  }

  @Get('due')
  @ApiOperation({ 
    summary: 'Obtener mantenimientos pendientes',
    description: 'Obtiene los mantenimientos que están próximos o vencidos.'
  })
  @ApiQuery({ name: 'vehicleId', required: false, description: 'ID del vehículo', example: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082' })
  @ApiQuery({ name: 'odometerKm', required: false, description: 'Kilometraje actual', example: '55000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Mantenimientos pendientes',
    example: {
      ok: true,
      due: [
        {
          id: '660e8400-e29b-41d4-a716-446655440000',
          title: 'Cambio de aceite',
          vehicleId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
          isDue: true,
          kmUntilDue: -1000,
          daysUntilDue: 5
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  due(
    @CurrentUser() u: { userId: string },
    @Query('vehicleId') vehicleId?: string,
    @Query('odometerKm') odometerKm?: string,
  ) {
    const odo = odometerKm ? Number(odometerKm) : undefined;
    return this.maintenance.due(u.userId, vehicleId, odo);
  }
}
