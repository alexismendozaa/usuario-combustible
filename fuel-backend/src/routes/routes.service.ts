import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type RoutePoint = { lat: number; lng: number; ts: string };

function toRad(x: number) {
  return (x * Math.PI) / 180;
}

// Haversine en KM
function haversineKm(a: RoutePoint, b: RoutePoint) {
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureVehicleOwner(userId: string, vehicleId: string) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!v) throw new NotFoundException('Vehicle no encontrado');
    if (v.userId !== userId) throw new ForbiddenException();
    return v;
  }

  private computeStats(points: RoutePoint[]) {
    if (!points || points.length < 2) {
      throw new BadRequestException('La ruta debe tener al menos 2 puntos');
    }

    // Normalizar orden por timestamp
    const sorted = [...points].sort(
      (p1, p2) => new Date(p1.ts).getTime() - new Date(p2.ts).getTime(),
    );

    const startedAt = new Date(sorted[0].ts);
    const endedAt = new Date(sorted[sorted.length - 1].ts);

    const durationMs = endedAt.getTime() - startedAt.getTime();
    if (durationMs <= 0) throw new BadRequestException('Timestamps inválidos');

    let distanceKm = 0;
    for (let i = 1; i < sorted.length; i++) {
      const seg = haversineKm(sorted[i - 1], sorted[i]);

      // filtro anti-ruido: ignora saltos absurdos (ej. > 1km entre puntos seguidos)
      if (seg <= 1.0) distanceKm += seg;
    }

    return {
      startedAt,
      endedAt,
      durationSec: Math.round(durationMs / 1000),
      distanceKm,
      pointsSorted: sorted,
    };
  }

  async create(
    userId: string,
    input: { vehicleId?: string; name?: string; points: RoutePoint[] },
  ) {
    if (input.vehicleId) await this.ensureVehicleOwner(userId, input.vehicleId);

    const { startedAt, endedAt, durationSec, distanceKm, pointsSorted } =
      this.computeStats(input.points);

    return this.prisma.route.create({
      data: {
        userId,
        vehicleId: input.vehicleId ?? null,
        name: input.name,
        startedAt,
        endedAt,
        durationSec,
        distanceKm: distanceKm as any,
        points: pointsSorted as any,
      },
      select: {
        id: true,
        name: true,
        startedAt: true,
        endedAt: true,
        durationSec: true,
        distanceKm: true,
        vehicleId: true,
        createdAt: true,
      },
    });
  }

  list(userId: string) {
    return this.prisma.route.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        name: true,
        startedAt: true,
        endedAt: true,
        durationSec: true,
        distanceKm: true,
        vehicleId: true,
        createdAt: true,
      },
    });
  }

  async get(userId: string, id: string) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Ruta no encontrada');
    if (route.userId !== userId) throw new ForbiddenException();
    return route; // incluye points
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.route.delete({ where: { id } });
    return { ok: true };
  }
}
