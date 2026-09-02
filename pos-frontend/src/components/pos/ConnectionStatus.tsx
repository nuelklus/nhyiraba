'use client';

import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { stockSyncManager } from '@/lib/websocket';

interface ConnectionStatusProps {
  status: {
    connected: boolean;
    lastConnected?: string;
    reconnectAttempts: number;
  };
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const handleReconnect = () => {
    stockSyncManager.connect().catch(console.error);
  };

  const getStatusColor = () => {
    if (status.connected) return 'text-green-600';
    if (status.reconnectAttempts > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBg = () => {
    if (status.connected) return 'bg-green-100';
    if (status.reconnectAttempts > 0) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getStatusText = () => {
    if (status.connected) return 'Connected';
    if (status.reconnectAttempts > 0) return `Reconnecting... (${status.reconnectAttempts})`;
    return 'Offline Mode';
  };

  const getStatusIcon = () => {
    if (status.connected) return <Wifi className="w-4 h-4" />;
    if (status.reconnectAttempts > 0) return <RefreshCw className="w-4 h-4 animate-spin" />;
    return <WifiOff className="w-4 h-4" />;
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${getStatusBg()}`}>
      {/* Status Icon */}
      <div className={getStatusColor()}>
        {getStatusIcon()}
      </div>

      {/* Status Text */}
      <span className={`text-sm font-medium ${getStatusColor()}`} title="All POS features work normally in offline mode">
        {getStatusText()}
      </span>

      {/* Reconnect Button */}
      {!status.connected && status.reconnectAttempts === 0 && (
        <button
          onClick={handleReconnect}
          className="p-1 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
          title="Try to reconnect to WebSocket"
        >
          <RefreshCw className="w-3 h-3 text-gray-600" />
        </button>
      )}

      {/* Warning Icon */}
      {status.reconnectAttempts > 3 && (
        <div className="text-yellow-600">
          <AlertTriangle className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
