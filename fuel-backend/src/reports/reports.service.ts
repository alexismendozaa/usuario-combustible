import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
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
   * Timeline por recarga (orden asc por odómetro).
   * Rendimiento común: (odometro actual - odometro anterior) / litros actuales.
   */
  async timeline(userId: string, vehicleId: string, limit = 50) {
    await this.ensureVehicleOwner(userId, vehicleId);

    const refuels = await this.prisma.refuel.findMany({
      where: { userId, vehicleId },
      orderBy: [{ odometerKm: 'asc' }, { filledAt: 'asc' }],
      take: Math.min(Math.max(limit, 1), 200),
      select: {
        id: true,
        filledAt: true,
        odometerKm: true,
        liters: true,
        totalCost: true,
        note: true,
      },
    });

    const items = refuels.map((r, idx) => {
      const prev = idx > 0 ? refuels[idx - 1] : null;
      const distanceKm = prev ? r.odometerKm - prev.odometerKm : null;

      // evitamos negativos o casos raros
      const validDistance =
        distanceKm !== null && distanceKm >= 0 ? distanceKm : null;

      const litersNum = Number(r.liters);
      const kmPerLiter =
        validDistance !== null && litersNum > 0
          ? validDistance / litersNum
          : null;

      const costNum = Number(r.totalCost);
      const costPerLiter = litersNum > 0 ? costNum / litersNum : null;
      const costPerKm =
        validDistance !== null && validDistance > 0
          ? costNum / validDistance
          : null;

      return {
        id: r.id,
        filledAt: r.filledAt,
        odometerKm: r.odometerKm,
        liters: litersNum,
        totalCost: costNum,
        note: r.note,
        distanceKm: validDistance,
        kmPerLiter,
        costPerLiter,
        costPerKm,
      };
    });

    return { vehicleId, count: items.length, items };
  }

  /**
   * Summary general (todo el historial del vehículo)
   */
  async summary(userId: string, vehicleId: string) {
    await this.ensureVehicleOwner(userId, vehicleId);

    const refuels = await this.prisma.refuel.findMany({
      where: { userId, vehicleId },
      orderBy: [{ odometerKm: 'asc' }, { filledAt: 'asc' }],
      select: {
        odometerKm: true,
        liters: true,
        totalCost: true,
      },
    });

    if (refuels.length === 0) {
      return {
        vehicleId,
        refuels: 0,
        totalLiters: 0,
        totalCost: 0,
        totalDistanceKm: 0,
        avgKmPerLiter: null,
        avgCostPerKm: null,
      };
    }

    const totalLiters = refuels.reduce((s, r) => s + Number(r.liters), 0);
    const totalCost = refuels.reduce((s, r) => s + Number(r.totalCost), 0);

    // distancia total = último odómetro - primero odómetro (si hay al menos 2)
    const firstOdo = refuels[0].odometerKm;
    const lastOdo = refuels[refuels.length - 1].odometerKm;
    const totalDistanceKm =
      refuels.length >= 2 ? Math.max(0, lastOdo - firstOdo) : 0;

    // promedio rendimiento común: promedio de (delta odo / litros actuales) desde la 2da recarga
    let sumKmPerLiter = 0;
    let countKmPerLiter = 0;

    for (let i = 1; i < refuels.length; i++) {
      const curr = refuels[i];
      const prev = refuels[i - 1];
      const dist = curr.odometerKm - prev.odometerKm;
      const lit = Number(curr.liters);
      if (dist >= 0 && lit > 0) {
        sumKmPerLiter += dist / lit;
        countKmPerLiter++;
      }
    }

    const avgKmPerLiter =
      countKmPerLiter > 0 ? sumKmPerLiter / countKmPerLiter : null;
    const avgCostPerKm =
      totalDistanceKm > 0 ? totalCost / totalDistanceKm : null;

    return {
      vehicleId,
      refuels: refuels.length,
      totalLiters,
      totalCost,
      totalDistanceKm,
      avgKmPerLiter,
      avgCostPerKm,
    };
  }

  /**
   * Monthly: resumen por mes YYYY-MM
   */
  async monthly(userId: string, vehicleId: string, month: string) {
    await this.ensureVehicleOwner(userId, vehicleId);

    // month: "2025-12"
    const [yStr, mStr] = month.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    if (!y || !m || m < 1 || m > 12) {
      return { error: 'Formato month inválido. Usa YYYY-MM' };
    }

    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));

    const refuels = await this.prisma.refuel.findMany({
      where: {
        userId,
        vehicleId,
        filledAt: { gte: start, lt: end },
      },
      orderBy: [{ odometerKm: 'asc' }, { filledAt: 'asc' }],
      select: {
        odometerKm: true,
        liters: true,
        totalCost: true,
        filledAt: true,
      },
    });

    const totalLiters = refuels.reduce((s, r) => s + Number(r.liters), 0);
    const totalCost = refuels.reduce((s, r) => s + Number(r.totalCost), 0);

    // distancia del mes (si hay 2+ recargas dentro del mes)
    let totalDistanceKm = 0;
    if (refuels.length >= 2) {
      totalDistanceKm = Math.max(
        0,
        refuels[refuels.length - 1].odometerKm - refuels[0].odometerKm,
      );
    }

    // promedio rendimiento dentro del mes (entre recargas del mismo mes)
    let sumKmPerLiter = 0;
    let countKmPerLiter = 0;

    for (let i = 1; i < refuels.length; i++) {
      const curr = refuels[i];
      const prev = refuels[i - 1];
      const dist = curr.odometerKm - prev.odometerKm;
      const lit = Number(curr.liters);
      if (dist >= 0 && lit > 0) {
        sumKmPerLiter += dist / lit;
        countKmPerLiter++;
      }
    }

    const avgKmPerLiter =
      countKmPerLiter > 0 ? sumKmPerLiter / countKmPerLiter : null;
    const avgCostPerKm =
      totalDistanceKm > 0 ? totalCost / totalDistanceKm : null;

    return {
      vehicleId,
      month,
      refuels: refuels.length,
      totalLiters,
      totalCost,
      totalDistanceKm,
      avgKmPerLiter,
      avgCostPerKm,
    };
  }
}
