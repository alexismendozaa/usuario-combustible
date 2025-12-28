import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaintenanceItemDto } from './dto/create-maintenance-item.dto';
import { UpdateMaintenanceItemDto } from './dto/update-maintenance-item.dto';
import { LogMaintenanceDto } from './dto/log-maintenance.dto';

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureVehicleOwner(userId: string, vehicleId: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) throw new NotFoundException('Vehicle no encontrado');
    if (v.userId !== userId) throw new ForbiddenException();
    return v;
  }

  private computeNext(dto: {
    intervalKm?: number | null;
    intervalMonths?: number | null;
    lastDoneAt?: Date | null;
    lastDoneOdometerKm?: number | null;
  }) {
    const nextDueOdometerKm =
      dto.intervalKm && dto.lastDoneOdometerKm != null
        ? dto.lastDoneOdometerKm + dto.intervalKm
        : null;

    const nextDueAt =
      dto.intervalMonths && dto.lastDoneAt
        ? addMonths(dto.lastDoneAt, dto.intervalMonths)
        : null;

    return { nextDueAt, nextDueOdometerKm };
  }

  async create(userId: string, dto: CreateMaintenanceItemDto) {
    await this.ensureVehicleOwner(userId, dto.vehicleId);

    if (!dto.intervalKm && !dto.intervalMonths) {
      throw new BadRequestException('Debes definir intervalKm o intervalMonths');
    }

    const lastDoneAt = dto.lastDoneAt ? new Date(dto.lastDoneAt) : null;
    const lastDoneOdometerKm = dto.lastDoneOdometerKm ?? null;

    const { nextDueAt, nextDueOdometerKm } = this.computeNext({
      intervalKm: dto.intervalKm ?? null,
      intervalMonths: dto.intervalMonths ?? null,
      lastDoneAt,
      lastDoneOdometerKm,
    });

    return this.prisma.maintenanceItem.create({
      data: {
        userId,
        vehicleId: dto.vehicleId,
        title: dto.title,
        notes: dto.notes,
        intervalKm: dto.intervalKm,
        intervalMonths: dto.intervalMonths,
        lastDoneAt,
        lastDoneOdometerKm,
        nextDueAt,
        nextDueOdometerKm,
      },
    });
  }

  list(userId: string, vehicleId?: string) {
    return this.prisma.maintenanceItem.findMany({
      where: {
        userId,
        ...(vehicleId ? { vehicleId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(userId: string, id: string) {
    const item = await this.prisma.maintenanceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Mantenimiento no encontrado');
    if (item.userId !== userId) throw new ForbiddenException();
    return item;
  }

  async update(userId: string, id: string, dto: UpdateMaintenanceItemDto) {
    const existing = await this.get(userId, id);

    // si cambian vehicleId, validar ownership
    if (dto.vehicleId && dto.vehicleId !== existing.vehicleId) {
      await this.ensureVehicleOwner(userId, dto.vehicleId);
    }

    const lastDoneAt = dto.lastDoneAt ? new Date(dto.lastDoneAt) : existing.lastDoneAt;
    const lastDoneOdometerKm =
      dto.lastDoneOdometerKm !== undefined ? dto.lastDoneOdometerKm : existing.lastDoneOdometerKm;

    const intervalKm = dto.intervalKm !== undefined ? dto.intervalKm : existing.intervalKm;
    const intervalMonths = dto.intervalMonths !== undefined ? dto.intervalMonths : existing.intervalMonths;

    if (!intervalKm && !intervalMonths) {
      throw new BadRequestException('Debes definir intervalKm o intervalMonths');
    }

    const { nextDueAt, nextDueOdometerKm } = this.computeNext({
      intervalKm: intervalKm ?? null,
      intervalMonths: intervalMonths ?? null,
      lastDoneAt: lastDoneAt ?? null,
      lastDoneOdometerKm: lastDoneOdometerKm ?? null,
    });

    return this.prisma.maintenanceItem.update({
      where: { id },
      data: {
        vehicleId: dto.vehicleId,
        title: dto.title,
        notes: dto.notes,
        intervalKm,
        intervalMonths,
        lastDoneAt,
        lastDoneOdometerKm,
        nextDueAt,
        nextDueOdometerKm,
        isActive: dto['isActive' as any], // si luego quieres editar isActive lo formalizamos en DTO
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.maintenanceItem.delete({ where: { id } });
    return { ok: true };
  }

  // Marcar como realizado: crea log + actualiza lastDone + recalcula nextDue
  async logDone(userId: string, itemId: string, dto: LogMaintenanceDto) {
    const item = await this.get(userId, itemId);

    const doneAt = dto.doneAt ? new Date(dto.doneAt) : new Date();
    const odometerKm = dto.odometerKm ?? null;

    // crear log
    await this.prisma.maintenanceLog.create({
      data: {
        userId,
        vehicleId: item.vehicleId,
        maintenanceItemId: item.id,
        doneAt,
        odometerKm,
        cost: dto.cost as any,
        note: dto.note,
      },
    });

    // actualizar item: lastDone y recalcular next
    const lastDoneAt = doneAt;
    const lastDoneOdometerKm =
      odometerKm !== null ? odometerKm : item.lastDoneOdometerKm ?? null;

    const { nextDueAt, nextDueOdometerKm } = this.computeNext({
      intervalKm: item.intervalKm ?? null,
      intervalMonths: item.intervalMonths ?? null,
      lastDoneAt,
      lastDoneOdometerKm,
    });

    return this.prisma.maintenanceItem.update({
      where: { id: item.id },
      data: {
        lastDoneAt,
        lastDoneOdometerKm,
        nextDueAt,
        nextDueOdometerKm,
      },
    });
  }

  // Historial del item
  async logs(userId: string, itemId: string) {
    const item = await this.get(userId, itemId);
    return this.prisma.maintenanceLog.findMany({
      where: { userId, maintenanceItemId: item.id },
      orderBy: { doneAt: 'desc' },
    });
  }

  // “Pendientes” (para que la app muestre alertas)
  async due(userId: string, vehicleId?: string, currentOdometerKm?: number) {
    const now = new Date();

    const items = await this.prisma.maintenanceItem.findMany({
      where: {
        userId,
        isActive: true,
        ...(vehicleId ? { vehicleId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Si el móvil manda el odómetro actual, podemos evaluar vencimientos por km
    const dueItems = items.filter((it) => {
      const dueByDate = it.nextDueAt ? it.nextDueAt <= now : false;
      const dueByKm =
        typeof currentOdometerKm === 'number' && it.nextDueOdometerKm != null
          ? currentOdometerKm >= it.nextDueOdometerKm
          : false;

      return dueByDate || dueByKm;
    });

    return { count: dueItems.length, items: dueItems };
  }
}
