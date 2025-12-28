import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { ReportsService } from './reports.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Reportes (Requiere Auth)')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('vehicles/:vehicleId/summary')
  @ApiOperation({ 
    summary: 'Resumen general del vehículo',
    description: 'Obtiene estadísticas generales de un vehículo (consumo promedio, costos, etc.).'
  })
  @ApiParam({ name: 'vehicleId', description: 'ID del vehículo', example: 'cm5h8k9l0000108l5abc123def' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resumen obtenido',
    example: {
      ok: true,
      summary: {
        vehicleId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
        totalRefuels: 25,
        totalLiters: 1125.5,
        totalCost: 21000.50,
        avgKmPerLiter: 12.5,
        avgCostPerKm: 0.42,
        totalKmDriven: 14000
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  summary(
    @CurrentUser() u: { userId: string },
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.reports.summary(u.userId, vehicleId);
  }

  @Get('vehicles/:vehicleId/monthly')
  @ApiOperation({ 
    summary: 'Reporte mensual del vehículo',
    description: 'Obtiene estadísticas de un mes específico.'
  })
  @ApiParam({ name: 'vehicleId', description: 'ID del vehículo', example: 'cm5h8k9l0000108l5abc123def' })
  @ApiQuery({ name: 'month', description: 'Mes en formato YYYY-MM', example: '2025-12' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reporte mensual obtenido',
    example: {
      ok: true,
      report: {
        month: '2025-12',
        vehicleId: 'af56dcb6-35a3-4b27-a24f-d0a6fa8e4082',
        refuelCount: 4,
        totalLiters: 180.0,
        totalCost: 3360.00,
        avgKmPerLiter: 12.8,
        kmDriven: 2304
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 400, description: 'Formato de mes inválido' })
  monthly(
    @CurrentUser() u: { userId: string },
    @Param('vehicleId') vehicleId: string,
    @Query('month') month: string,
  ) {
    return this.reports.monthly(u.userId, vehicleId, month);
  }

  @Get('vehicles/:vehicleId/timeline')
  @ApiOperation({ 
    summary: 'Línea de tiempo del vehículo',
    description: 'Obtiene un timeline con todos los eventos (cargas, mantenimientos).'
  })
  @ApiParam({ name: 'vehicleId', description: 'ID del vehículo', example: 'cm5h8k9l0000108l5abc123def' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de eventos a retornar', example: '50' })
  @ApiResponse({ 
    status: 200, 
    description: 'Timeline obtenido',
    example: {
      ok: true,
      timeline: [
        {
          type: 'refuel',
          date: '2025-12-28T10:30:00.000Z',
          description: 'Carga de 45.5L',
          cost: 850.50,
          odometerKm: 51234
        },
        {
          type: 'maintenance',
          date: '2025-12-20T14:00:00.000Z',
          description: 'Cambio de aceite',
          cost: 450.00,
          odometerKm: 50000
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  timeline(
    @CurrentUser() u: { userId: string },
    @Param('vehicleId') vehicleId: string,
    @Query('limit') limit?: string,
  ) {
    return this.reports.timeline(
      u.userId,
      vehicleId,
      limit ? Number(limit) : 50,
    );
  }
}
