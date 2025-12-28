import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('vehicles/:vehicleId/summary')
  summary(
    @CurrentUser() u: { userId: string },
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.reports.summary(u.userId, vehicleId);
  }

  @Get('vehicles/:vehicleId/monthly')
  monthly(
    @CurrentUser() u: { userId: string },
    @Param('vehicleId') vehicleId: string,
    @Query('month') month: string,
  ) {
    return this.reports.monthly(u.userId, vehicleId, month);
  }

  @Get('vehicles/:vehicleId/timeline')
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
