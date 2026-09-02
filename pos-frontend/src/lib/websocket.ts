import { posApiClient } from './pos-api';

// Types for WebSocket events
export interface StockUpdateEvent {
  product_id: string;
  product_name: string;
  old_quantity: number;
  new_quantity: number;
  change_amount: number;
  source: 'ecommerce' | 'pos' | 'admin';
  store_id: string;
  operator: string;
  timestamp: string;
  sync_version: number;
}

export interface SyncStatusEvent {
  type: 'sync_started' | 'sync_completed' | 'sync_failed' | 'sync_conflict';
  product_id: string;
  store_id: string;
  timestamp: string;
  details?: any;
}

export interface ConnectionStatus {
  connected: boolean;
  lastConnected?: string;
  lastDisconnected?: string;
  reconnectAttempts: number;
}

class StockSyncManager {
  private socket: WebSocket | null = null;
  private callbacks: Map<string, Function[]> = new Map();
  private connectionStatus: ConnectionStatus = {
    connected: false,
    reconnectAttempts: 0
  };
  private reconnectTimer: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseReconnect();
        } else {
          this.resumeReconnect();
        }
      });

      // Handle page unload
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!posApiClient.isAuthenticated()) {
          reject(new Error('User not authenticated'));
          return;
        }

        // Add overall connection timeout
        const overallTimeout = setTimeout(() => {
          console.log('⏰ Overall connection timeout, switching to offline mode');
          this.connectionStatus.connected = false;
          this.connectionStatus.lastDisconnected = new Date().toISOString();
          this.emit('connection_status', this.connectionStatus);
          this.emit('websocket_unavailable', new Error('Connection timeout'));
          resolve(); // Resolve successfully but in offline mode
        }, 8000); // 8 second overall timeout

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/stock/';
        const token = localStorage.getItem('pos_access_token');
        const deviceId = posApiClient.getDeviceId();
        const storeId = posApiClient.getStoreId();

        console.log('🔌 Connecting to WebSocket:', wsUrl);

        // Create WebSocket connection with token in URL for Django
        const urlWithToken = `${wsUrl}?token=${encodeURIComponent(token || '')}&device_id=${encodeURIComponent(deviceId || '')}&store_id=${encodeURIComponent(storeId || '')}`;
        
        try {
          this.socket = new WebSocket(urlWithToken);
          
          // Set connection timeout
          setTimeout(() => {
            if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
              clearTimeout(overallTimeout);
              console.log('⏰ WebSocket connection timeout, switching to offline mode');
              this.socket.close();
              this.socket = null;
              this.connectionStatus.connected = false;
              this.connectionStatus.lastDisconnected = new Date().toISOString();
              this.emit('connection_status', this.connectionStatus);
              this.emit('websocket_unavailable', new Error('Connection timeout - WebSocket server not available'));
              console.log('🔄 WebSocket unavailable - POS will work in offline mode');
              console.log('💡 All POS features will work normally, just without real-time sync');
              resolve(); // Resolve successfully but in offline mode
            }
          }, 3000); // 3 second timeout
          
        } catch (error) {
          console.log('🔄 WebSocket not available, using fallback mode');
          this.connectionStatus.connected = false;
          this.connectionStatus.lastDisconnected = new Date().toISOString();
          this.emit('connection_status', this.connectionStatus);
          this.emit('websocket_unavailable', error);
          console.log('🔄 WebSocket unavailable - POS will work in offline mode');
          console.log('💡 All POS features will work normally, just without real-time sync');
          resolve(); // Resolve successfully but in offline mode
          return;
        }

        // Connection events
        this.socket.onopen = () => {
          clearTimeout(overallTimeout);
          console.log('✅ Connected to stock sync WebSocket');
          this.connectionStatus.connected = true;
          this.connectionStatus.lastConnected = new Date().toISOString();
          this.connectionStatus.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          
          this.emit('connection_status', this.connectionStatus);
          this.emit('connected', true);
          resolve();
        };

        this.socket.onclose = (event) => {
          console.log('❌ Disconnected from WebSocket:', event.reason);
          this.connectionStatus.connected = false;
          this.connectionStatus.lastDisconnected = new Date().toISOString();
          
          this.emit('connection_status', this.connectionStatus);
          this.emit('disconnected', event.reason);
          
          // Try to reconnect if not a normal closure
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (error) => {
          clearTimeout(overallTimeout);
          const errorMessage = 'Connection refused';
          console.error('❌ WebSocket connection error:', error);
          this.connectionStatus.reconnectAttempts++;
          
          this.emit('connection_status', this.connectionStatus);
          this.emit('connection_error', error);
        };

        // Message handler for incoming WebSocket messages
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);
            
            // Handle different message types
            switch (message.type) {
              case 'stock_update':
                this.emit('stock_update', message.data);
                break;
              case 'sync_status':
                this.emit('sync_status', message.data);
                break;
              case 'low_stock_alert':
                this.emit('low_stock_alert', message.data);
                break;
              case 'conflict_detected':
                this.emit('conflict_detected', message.data);
                break;
              case 'connected':
                this.emit('connected', message.data);
                break;
              default:
                console.log('🔍 Unknown message type:', message.type);
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

      } catch (error) {
        console.error('❌ Failed to initialize WebSocket:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from WebSocket');
      this.socket.close();
      this.socket = null;
    }
    
    this.connectionStatus.connected = false;
    this.connectionStatus.lastDisconnected = new Date().toISOString();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.emit('connection_status', this.connectionStatus);
  }

  pauseReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  resumeReconnect(): void {
    if (!this.connectionStatus.connected && !this.reconnectTimer) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.connectionStatus.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🚫 Max reconnection attempts reached');
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      console.log(`🔄 Scheduling reconnect attempt ${this.connectionStatus.reconnectAttempts + 1}`);
      this.connect().catch(() => {
        // Connection failed, will trigger automatic reconnect
      });
    }, this.reconnectDelay);
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.callbacks.has(event)) return;
    
    if (callback) {
      const callbacks = this.callbacks.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.callbacks.delete(event);
    }
  }

  public emit(event: string, data?: any): void {
    const callbacks = this.callbacks.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Error in WebSocket event callback for ${event}:`, error);
      }
    });
  }

  // Manual event sending
  sendStockUpdate(data: Partial<StockUpdateEvent>): void {
    if (this.socket && this.connectionStatus.connected) {
      this.socket.send(JSON.stringify({
        type: 'stock_update',
        data: data
      }));
    }
  }

  sendSyncStatus(data: Partial<SyncStatusEvent>): void {
    if (this.socket && this.connectionStatus.connected) {
      this.socket.send(JSON.stringify({
        type: 'sync_status',
        data: data
      }));
    }
  }

  // Get connection status
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  isConnected(): boolean {
    return this.connectionStatus.connected && this.socket?.readyState === WebSocket.OPEN;
  }

  // Get statistics
  getStats(): {
    connected: boolean;
    lastConnected?: string;
    lastDisconnected?: string;
    reconnectAttempts: number;
    uptime?: string;
  } {
    const stats: any = { ...this.connectionStatus };
    
    if (stats.lastConnected && stats.connected) {
      const connectedTime = new Date(stats.lastConnected).getTime();
      const now = Date.now();
      const uptime = now - connectedTime;
      stats.uptime = this.formatDuration(uptime);
    }
    
    return stats;
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Create singleton instance
export const stockSyncManager = new StockSyncManager();

// Types are already exported above

// Simple simulation for testing offline sync
export const simulateOfflineSync = () => {
  console.log('🔄 Simulating offline activity sync...');
  
  // Simulate stock updates that would normally come via WebSocket
  const mockStockUpdate = {
    type: 'stock_update',
    data: {
      product_id: '1',
      product_name: 'Test Product',
      old_quantity: 10,
      new_quantity: 15,
      change_amount: 5,
      source: 'pos' as const,
      store_id: 'main',
      operator: 'Test User',
      timestamp: new Date().toISOString(),
      sync_version: 1
    }
  };
  
  // Emit the simulated event
  stockSyncManager.emit('stock_update', mockStockUpdate.data);
  
  console.log('✅ Simulated stock update sent:', mockStockUpdate.data);
};
