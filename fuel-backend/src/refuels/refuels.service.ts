import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRefuelDto } from './dto/create-refuel.dto';
import { UpdateRefuelDto } from './dto/update-refuel.dto';

@Injectable()
export class RefuelsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureVehicleOwner(userId: string, vehicleId: string) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!v) throw new NotFoundException('Vehicle no encontrado');
    if (v.userId !== userId) throw new ForbiddenException();
    return v;
  }

  async create(userId: string, dto: CreateRefuelDto) {
    await this.ensureVehicleOwner(userId, dto.vehicleId);

    // regla simple: odometerKm no debe ser negativo, y litros > 0 ya está en DTO
    if (dto.liters <= 0) throw new BadRequestException('Litros inválidos');

    return this.prisma.refuel.create({
      data: {
        userId,
        vehicleId: dto.vehicleId,
        filledAt: dto.filledAt ? new Date(dto.filledAt) : new Date(),
        odometerKm: dto.odometerKm,
        liters: dto.liters as any,
        totalCost: dto.totalCost as any,
        note: dto.note,
        lat: dto.lat as any,
        lng: dto.lng as any,
      },
    });
  }

  list(userId: string, vehicleId?: string) {
    return this.prisma.refuel.findMany({
      where: {
        userId,
        ...(vehicleId ? { vehicleId } : {}),
      },
      orderBy: { filledAt: 'desc' },
    });
  }

  async get(userId: string, id: string) {
    const r = await this.prisma.refuel.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Recarga no encontrada');
    if (r.userId !== userId) throw new ForbiddenException();
    return r;
  }

  async update(userId: string, id: string, dto: UpdateRefuelDto) {
    const existing = await this.get(userId, id);

    // si intentan cambiar vehicleId, valida que sea del usuario
    if (dto.vehicleId && dto.vehicleId !== existing.vehicleId) {
      await this.ensureVehicleOwner(userId, dto.vehicleId);
    }

    return this.prisma.refuel.update({
      where: { id },
      data: {
        vehicleId: dto.vehicleId,
        filledAt: dto.filledAt ? new Date(dto.filledAt) : undefined,
        odometerKm: dto.odometerKm,
        liters: (dto.liters as any) ?? undefined,
        totalCost: (dto.totalCost as any) ?? undefined,
        note: dto.note,
        lat: (dto.lat as any) ?? undefined,
        lng: (dto.lng as any) ?? undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.refuel.delete({ where: { id } });
    return { ok: true };
  }
}
