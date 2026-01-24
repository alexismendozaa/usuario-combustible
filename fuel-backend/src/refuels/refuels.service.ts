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

  /**
   * Obtiene el odómetro actual del vehículo (el máximo entre el odómetro
   * inicial del vehículo y el último odómetro registrado en recargas)
   */
  private async getCurrentOdometer(vehicleId: string): Promise<number> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { odometerKm: true },
    });

    const lastRefuel = await this.prisma.refuel.findFirst({
      where: { vehicleId },
      orderBy: { odometerKm: 'desc' },
      select: { odometerKm: true },
    });

    const vehicleOdometer = vehicle?.odometerKm ?? 0;
    const lastRefuelOdometer = lastRefuel?.odometerKm ?? 0;

    return Math.max(vehicleOdometer, lastRefuelOdometer);
  }

  async create(userId: string, dto: CreateRefuelDto) {
    const vehicle = await this.ensureVehicleOwner(userId, dto.vehicleId);

    // regla simple: odometerKm no debe ser negativo, y litros > 0 ya está en DTO
    if (dto.liters <= 0) throw new BadRequestException('Litros inválidos');

    // Obtener el odómetro actual (máximo entre el del vehículo y el último de recargas)
    const currentOdometer = await this.getCurrentOdometer(dto.vehicleId);

    // Validar que el nuevo odómetro no sea menor al actual
    if (dto.odometerKm < currentOdometer) {
      throw new BadRequestException(
        `El odómetro no puede ser menor al actual (${currentOdometer} km)`,
      );
    }

    // Validar que los litros no excedan la capacidad del tanque
    if (vehicle.tankCapacity && dto.liters > Number(vehicle.tankCapacity)) {
      throw new BadRequestException(
        `Los galones (${dto.liters}) no pueden exceder la capacidad del tanque (${vehicle.tankCapacity} gal)`,
      );
    }

    // Crear la recarga
    const refuel = await this.prisma.refuel.create({
      data: {
        userId,
        vehicleId: dto.vehicleId,
        filledAt: dto.filledAt ? new Date(dto.filledAt) : new Date(),
        odometerKm: dto.odometerKm,
        liters: dto.liters as any,
        totalCost: dto.totalCost as any,
        paymentMethod: dto.paymentMethod || 'cash',
        fullTank: dto.fullTank ?? true,
        note: dto.note,
        lat: dto.lat as any,
        lng: dto.lng as any,
      },
    });

    // Actualizar el odómetro del vehículo al nuevo valor
    await this.prisma.vehicle.update({
      where: { id: dto.vehicleId },
      data: { odometerKm: dto.odometerKm },
    });

    return refuel;
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

    // Determinar el vehicleId a usar (nuevo o existente)
    const targetVehicleId = dto.vehicleId || existing.vehicleId;

    // si intentan cambiar vehicleId, valida que sea del usuario
    if (dto.vehicleId && dto.vehicleId !== existing.vehicleId) {
      await this.ensureVehicleOwner(userId, dto.vehicleId);
    }

    // Si están actualizando el odómetro, validar que no sea menor al actual
    // (excluyendo esta recarga del cálculo)
    if (dto.odometerKm !== undefined) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: targetVehicleId },
        select: { odometerKm: true },
      });

      // Obtener el máximo odómetro de otras recargas (excluyendo la actual)
      const otherMaxRefuel = await this.prisma.refuel.findFirst({
        where: {
          vehicleId: targetVehicleId,
          id: { not: id },
        },
        orderBy: { odometerKm: 'desc' },
        select: { odometerKm: true },
      });

      const vehicleInitialOdometer = vehicle?.odometerKm ?? 0;
      const otherRefuelsMaxOdometer = otherMaxRefuel?.odometerKm ?? 0;

      // El mínimo permitido es el máximo de otras recargas (si es que hay otras)
      // o 0 si no hay otras recargas
      if (otherMaxRefuel && dto.odometerKm < otherRefuelsMaxOdometer) {
        throw new BadRequestException(
          `El odómetro no puede ser menor a ${otherRefuelsMaxOdometer} km (último registro)`,
        );
      }
    }

    const updatedRefuel = await this.prisma.refuel.update({
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

    // Si se actualizó el odómetro, recalcular el odómetro máximo del vehículo
    if (dto.odometerKm !== undefined) {
      const maxRefuel = await this.prisma.refuel.findFirst({
        where: { vehicleId: targetVehicleId },
        orderBy: { odometerKm: 'desc' },
        select: { odometerKm: true },
      });

      if (maxRefuel) {
        await this.prisma.vehicle.update({
          where: { id: targetVehicleId },
          data: { odometerKm: maxRefuel.odometerKm },
        });
      }
    }

    return updatedRefuel;
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.refuel.delete({ where: { id } });
    return { ok: true };
  }
}
