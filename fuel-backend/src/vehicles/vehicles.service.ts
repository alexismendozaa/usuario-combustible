import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        userId,
        name: dto.name,
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        plate: dto.plate,
        fuelType: dto.fuelType,
        odometerKm: dto.odometerKm ?? 0,
      },
    });
  }

  list(userId: string) {
    return this.prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(userId: string, id: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Vehicle no encontrado');
    if (v.userId !== userId) throw new ForbiddenException();
    return v;
  }

  async update(userId: string, id: string, dto: UpdateVehicleDto) {
    // validar ownership
    await this.get(userId, id);

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        name: dto.name,
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        plate: dto.plate,
        fuelType: dto.fuelType,
        odometerKm: dto.odometerKm,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.vehicle.delete({ where: { id } });
    return { ok: true };
  }
}
