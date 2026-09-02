'use client';

import { useState, useRef, useCallback } from 'react';
import { Barcode } from 'lucide-react';
import { validateBarcode, formatBarcode } from '@/lib/utils';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  className?: string;
}

export function BarcodeScanner({ onScan, className = '' }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleManualScan = useCallback(() => {
    const barcode = manualInput.trim();
    if (barcode && validateBarcode(barcode)) {
      onScan(barcode);
      setManualInput('');
      inputRef.current?.focus();
    } else if (barcode) {
      console.warn('❌ Invalid barcode format:', barcode);
      // Could show error message
    }
  }, [manualInput, onScan]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualScan();
    }
  }, [handleManualScan]);

  const toggleScanning = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 ${className}`}>
      {/* Manual Input */}
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <input
          ref={inputRef}
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Scan or enter barcode..."
          className="flex-1 px-3 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={isScanning}
        />
        <button
          onClick={handleManualScan}
          disabled={!manualInput.trim() || !validateBarcode(manualInput)}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm whitespace-nowrap"
        >
          Add
        </button>
      </div>

      {/* Scanner Toggle */}
      <button
        onClick={toggleScanning}
        className={`w-full sm:w-auto p-2 rounded-md transition-colors ${
          isScanning
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title={isScanning ? 'Stop scanning' : 'Start scanning'}
      >
        <Barcode className="w-5 h-5 mx-auto" />
      </button>

      {/* Scanning Indicator */}
      {isScanning && (
        <div className="flex items-center space-x-2 text-green-600">
          <div className="animate-pulse flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-ping"></div>
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          </div>
          <span className="text-sm font-medium">Scanning...</span>
        </div>
      )}

      {/* Barcode Display */}
      {manualInput && (
        <div className="text-sm text-gray-600 font-mono">
          {formatBarcode(manualInput)}
        </div>
      )}
    </div>
  );
}
