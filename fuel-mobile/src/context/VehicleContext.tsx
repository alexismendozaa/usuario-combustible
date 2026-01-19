import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VehicleContextType {
  selectedVehicleId: string | null;
  selectedVehicleName: string | null;
  setSelectedVehicle: (vehicleId: string, vehicleName: string) => void;
  clearSelectedVehicle: () => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleName, setSelectedVehicleName] = useState<string | null>(null);

  const setSelectedVehicle = (vehicleId: string, vehicleName: string) => {
    setSelectedVehicleId(vehicleId);
    setSelectedVehicleName(vehicleName);
  };

  const clearSelectedVehicle = () => {
    setSelectedVehicleId(null);
    setSelectedVehicleName(null);
  };

  return (
    <VehicleContext.Provider value={{ selectedVehicleId, selectedVehicleName, setSelectedVehicle, clearSelectedVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicle debe ser usado dentro de VehicleProvider');
  }
  return context;
}
