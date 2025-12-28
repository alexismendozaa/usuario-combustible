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

@UseGuards(JwtAuthGuard)
@Controller('refuels')
export class RefuelsController {
  constructor(private readonly refuels: RefuelsService) {}

  @Post()
  create(@CurrentUser() u: { userId: string }, @Body() dto: CreateRefuelDto) {
    return this.refuels.create(u.userId, dto);
  }

  @Get()
  list(
    @CurrentUser() u: { userId: string },
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.refuels.list(u.userId, vehicleId);
  }

  @Get(':id')
  get(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.refuels.get(u.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() u: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateRefuelDto,
  ) {
    return this.refuels.update(u.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() u: { userId: string }, @Param('id') id: string) {
    return this.refuels.remove(u.userId, id);
  }
}
