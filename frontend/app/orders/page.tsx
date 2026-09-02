'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { ordersApi } from '@/lib/orders-api';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  RefreshCw,
  Shield
} from 'lucide-react';

export default function OrdersPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchOrders();
    } else if (!authLoading && !isAuthenticated) {
      
      window.location.href = '/login?redirect=/orders';
    }
  }, [isAuthenticated, authLoading]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('🔍 DEBUG: Fetching orders...');
      console.log('🔍 DEBUG: User authenticated:', isAuthenticated);
      console.log('🔍 DEBUG: User data:', user);
      
      const response = await ordersApi.getOrders();
      
      console.log('🔍 DEBUG: Orders response:', response);
      setOrders(response || []);
    } catch (err: any) {
      console.error('🔍 DEBUG: Failed to fetch orders:', err);
      console.error('🔍 DEBUG: Error status:', err.response?.status);
      console.error('🔍 DEBUG: Error message:', err.response?.data);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
              <p className="text-gray-600 mt-2">
                Track and manage your orders
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>

          {}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {}
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Link href="/products">
                <Button>Start Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                  {}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.order_number}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right mt-4 sm:mt-0">
                      <div className="text-2xl font-bold text-gray-900">
                        GHS {order.grand_total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.payment_method === 'cod' ? 'Cash on Delivery' : 
                         order.payment_method === 'card' ? 'Bank Card' : 'Mobile Money'}
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Delivery Address
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{order.shipping_address}</p>
                        <p>{order.city}, {order.region}</p>
                        {order.postal_code && <p>{order.postal_code}</p>}
                      </div>
                    </div>

                    {}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Information
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {order.email}
                        </p>
                        <p className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {order.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="text-sm text-gray-600">
                      {order.items?.length || 0} items in this order
                    </div>
                  </div>

                  {}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Link href={`/orders/${order.order_number}`}>
                      <Button variant="outline" className="w-full sm:w-auto">
                        <Package className="h-4 w-4 mr-2" />
                        View Details & Track Order
                      </Button>
                    </Link>
                    {order.status === 'delivered' && (
                      <Button className="w-full sm:w-auto">
                        Order Again
                      </Button>
                    )}
                  </div>

                  {}
                  <div className="mt-4 space-y-2">
                    {order.payment_method === 'cod' && order.status !== 'delivered' && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-sm text-green-800">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span className="font-medium">Cash on Delivery</span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          Please have GHS {order.grand_total.toLocaleString()} ready when your order arrives
                        </p>
                      </div>
                    )}
                    
                    {order.status === 'shipped' && order.release_code && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center text-sm text-blue-800">
                          <Shield className="h-4 w-4 mr-2" />
                          <span className="font-medium">Ready for Delivery</span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          Your order is shipped! Check tracking for delivery confirmation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
