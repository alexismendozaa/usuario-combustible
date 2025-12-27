import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Post()
  create(
    @CurrentUser() u: { userId: string },
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehicles.create(u.userId, dto);
  }

  @Get()
  list(@CurrentUser() u: { userId: string }) {
    return this.vehicles.list(u.userId);
  }

  @Get(':id')
  get(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.vehicles.get(u.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles.update(u.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.vehicles.remove(u.userId, id);
  }
}
