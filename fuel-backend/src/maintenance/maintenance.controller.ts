import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceItemDto } from './dto/create-maintenance-item.dto';
import { UpdateMaintenanceItemDto } from './dto/update-maintenance-item.dto';
import { LogMaintenanceDto } from './dto/log-maintenance.dto';

@UseGuards(JwtAuthGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Post('items')
  createItem(@CurrentUser() u: { userId: string }, @Body() dto: CreateMaintenanceItemDto) {
    return this.maintenance.create(u.userId, dto);
  }

  @Get('items')
  listItems(
    @CurrentUser() u: { userId: string },
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.maintenance.list(u.userId, vehicleId);
  }

  @Get('items/:id')
  getItem(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.maintenance.get(u.userId, id);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceItemDto,
  ) {
    return this.maintenance.update(u.userId, id, dto);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.maintenance.remove(u.userId, id);
  }

  // marcar como realizado
  @Post('items/:id/log')
  logDone(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
    @Body() dto: LogMaintenanceDto,
  ) {
    return this.maintenance.logDone(u.userId, id, dto);
  }

  // historial
  @Get('items/:id/logs')
  logs(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.maintenance.logs(u.userId, id);
  }

  // pendientes (opcional: manda odómetro actual)
  @Get('due')
  due(
    @CurrentUser() u: { userId: string },
    @Query('vehicleId') vehicleId?: string,
    @Query('odometerKm') odometerKm?: string,
  ) {
    const odo = odometerKm ? Number(odometerKm) : undefined;
    return this.maintenance.due(u.userId, vehicleId, odo);
  }
}
