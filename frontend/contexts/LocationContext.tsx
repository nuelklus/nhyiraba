'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Warehouse {
  id: string;
  name: string;
  phone: string;
  deliveryAreas: string[];
  estimatedDelivery: string;
}

export interface LocationContextType {
  selectedWarehouse: Warehouse;
  setSelectedWarehouse: (warehouse: Warehouse) => void;
  warehouses: Warehouse[];
  deliveryEstimate: string;
  updateDeliveryEstimate: (area: string) => void;
}

const defaultWarehouses: Warehouse[] = [
  {
    id: 'tema',
    name: 'Tema Warehouse',
    phone: '+233 30 123 4567',
    deliveryAreas: ['Tema', 'Accra', 'East Legon', 'Madina', 'Ashongman'],
    estimatedDelivery: 'Same Day Delivery',
  },
  {
    id: 'accra',
    name: 'Accra Warehouse',
    phone: '+233 30 987 6543',
    deliveryAreas: ['Accra Central', 'Kaneshie', 'Osu', 'Labone', 'Airport'],
    estimatedDelivery: 'Next Day Delivery',
  },
  {
    id: 'kumasi',
    name: 'Kumasi Warehouse',
    phone: '+233 50 123 4567',
    deliveryAreas: ['Kumasi', 'Obuasi', 'Bekwai', 'Mampong'],
    estimatedDelivery: '2-3 Days Delivery',
  },
];

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse>(defaultWarehouses[0]);
  const [deliveryEstimate, setDeliveryEstimate] = useState('Delivery to East Legon by 4 PM');

  const updateDeliveryEstimate = (area: string) => {
    const warehouse = selectedWarehouse;
    if (warehouse.deliveryAreas.includes(area)) {
      setDeliveryEstimate(`Delivery to ${area} by 4 PM`);
    } else {
      setDeliveryEstimate(`Delivery to ${area}: ${warehouse.estimatedDelivery}`);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        selectedWarehouse,
        setSelectedWarehouse,
        warehouses: defaultWarehouses,
        deliveryEstimate,
        updateDeliveryEstimate,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
