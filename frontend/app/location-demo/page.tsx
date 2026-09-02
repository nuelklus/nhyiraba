'use client';

import React from 'react';
import { useLocation } from '@/contexts/LocationContext';

export default function LocationDemo() {
  const { 
    selectedWarehouse, 
    setSelectedWarehouse, 
    warehouses, 
    deliveryEstimate, 
    updateDeliveryEstimate 
  } = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-charcoal mb-8">
          📍 Location Picker Demo
        </h1>

        {}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-brand-charcoal mb-4">
            Current Selection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Selected Warehouse:</p>
              <p className="text-lg font-medium text-brand-charcoal">
                {selectedWarehouse.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Delivery Estimate:</p>
              <p className="text-lg font-medium text-brand-yellow">
                {deliveryEstimate}
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-brand-charcoal mb-4">
            Select Warehouse
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedWarehouse.id === warehouse.id
                    ? 'border-brand-yellow bg-brand-yellow/10'
                    : 'border-gray-200 hover:border-brand-yellow/50'
                }`}
                onClick={() => {
                  setSelectedWarehouse(warehouse);
                  updateDeliveryEstimate(warehouse.deliveryAreas[0]);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-brand-charcoal">
                    {warehouse.name}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {warehouse.estimatedDelivery}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  📍 Serves: {warehouse.deliveryAreas.join(', ')}
                </p>
                <p className="text-sm text-brand-charcoal">
                  📞 {warehouse.phone}
                </p>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-brand-charcoal mb-4">
            Delivery Areas for {selectedWarehouse.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {selectedWarehouse.deliveryAreas.map((area) => (
              <button
                key={area}
                onClick={() => updateDeliveryEstimate(area)}
                className="px-3 py-2 text-sm border border-gray-200 rounded hover:border-brand-yellow hover:bg-brand-yellow/10 transition-colors"
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-brand-charcoal mb-4">
            🎯 Simple Location Picker
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <h3 className="font-semibold text-brand-charcoal">Select Warehouse</h3>
                <p className="text-gray-600">
                  Choose your preferred warehouse for delivery speed and contact.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <h3 className="font-semibold text-brand-charcoal">See Delivery Info</h3>
                <p className="text-gray-600">
                  Phone number and delivery estimate update automatically.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <h3 className="font-semibold text-brand-charcoal">Shop Normally</h3>
                <p className="text-gray-600">
                  Products show standard stock levels. Location helps with delivery planning.
                </p>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-brand-charcoal mb-4">
            🔧 Technical Implementation
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`
import { useLocation } from '@/contexts/LocationContext';

const { 
  selectedWarehouse,           
  setSelectedWarehouse,         
  warehouses,                
  deliveryEstimate,           
  updateDeliveryEstimate       
} = useLocation();

const handleWarehouseChange = (warehouseId: string) => {
  const warehouse = warehouses.find(w => w.id === warehouseId);
  setSelectedWarehouse(warehouse);
  updateDeliveryEstimate(warehouse.deliveryAreas[0]);
};`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
