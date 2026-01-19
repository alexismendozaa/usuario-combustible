/**
 * Tipos globales y constantes
 */

export enum FuelType {
  DIESEL = 'diesel',
  SUPER = 'super',
  EXTRA = 'extra',
}

export const FUEL_TYPES = [
  { label: 'Diésel', value: FuelType.DIESEL },
  { label: 'Super', value: FuelType.SUPER },
  { label: 'Extra', value: FuelType.EXTRA },
];

export const FUEL_PRICES: Record<FuelType, number> = {
  [FuelType.DIESEL]: 2.77,
  [FuelType.SUPER]: 3.36,
  [FuelType.EXTRA]: 2.671,
};

export type PaymentMethod = 'cash' | 'stripe';

export const PAYMENT_METHODS = [
  { label: ' Efectivo', value: 'cash' },
  { label: ' Tarjeta (Stripe)', value: 'stripe' },
];

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number; // en metros
  address?: string;
  brand?: string;
}

// Tipos de vehículos
export const VEHICLE_TYPES = [
  { value: 'carro', label: ' Carro', icon: 'car' },
  { value: 'moto', label: ' Moto', icon: 'motorbike' },
  { value: 'camion', label: ' Camión', icon: 'truck' },
  { value: 'van', label: ' Van', icon: 'van-passenger' },
  { value: 'suv', label: ' SUV', icon: 'car-estate' },
];

// Tipos de mantenimiento comunes para autos y motos
export const MAINTENANCE_TYPES = [
  { label: 'Cambio de aceite', value: 'cambio_aceite' },
  { label: 'Cambio de filtro de aceite', value: 'cambio_filtro_aceite' },
  { label: 'Cambio de filtro de aire', value: 'cambio_filtro_aire' },
  { label: 'Cambio de bujías', value: 'cambio_bujias' },
  { label: 'Rotación de llantas', value: 'rotacion_llantas' },
  { label: 'Alineación y balanceo', value: 'alineacion_balanceo' },
  { label: 'Cambio de pastillas de freno', value: 'cambio_pastillas_freno' },
  { label: 'Cambio de discos de freno', value: 'cambio_discos_freno' },
  { label: 'Cambio de líquido de frenos', value: 'cambio_liquido_frenos' },
  { label: 'Cambio de batería', value: 'cambio_bateria' },
  { label: 'Cambio de correa de distribución', value: 'cambio_correa_distribucion' },
  { label: 'Cambio de refrigerante', value: 'cambio_refrigerante' },
  { label: 'Revisión de suspensión', value: 'revision_suspension' },
  { label: 'Cambio de cadena (moto)', value: 'cambio_cadena' },
  { label: 'Cambio de transmisión', value: 'cambio_transmision' },
  { label: 'Inspección general', value: 'inspeccion_general' },
  { label: 'Otro', value: 'otro' },
];