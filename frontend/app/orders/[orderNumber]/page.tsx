'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertCircle,
  Shield,
  Navigation,
  User
} from 'lucide-react';

export default function OrderTrackingPage() {
  const { orderNumber } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releaseCode, setReleaseCode] = useState('');
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails();
    }
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getOrderDetails(orderNumber as string);
      setOrder(response);
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      setError(err.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'processing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <RefreshCw className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getTrackingSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', completed: true },
      { key: 'processing', label: 'Processing', completed: order?.status === 'processing' || order?.status === 'shipped' || order?.status === 'delivered' },
      { key: 'shipped', label: 'Shipped', completed: order?.status === 'shipped' || order?.status === 'delivered' },
      { key: 'delivered', label: 'Delivered', completed: order?.status === 'delivered' }
    ];
    return steps;
  };

  const handleConfirmDelivery = async () => {
    if (!releaseCode || releaseCode.length !== 6) {
      setError('Please enter a valid 6-digit release code');
      return;
    }

    try {
      setConfirmingDelivery(true);
      setError(null);
      
      const response = await ordersApi.confirmDelivery(orderNumber as string, releaseCode);
      
      if (response.success) {
        setDeliveryConfirmed(true);
        
        await fetchOrderDetails();
      } else {
        setError(response.message || 'Invalid release code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm delivery');
    } finally {
      setConfirmingDelivery(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-8">
              We couldn't find an order with that number. Please check the order number and try again.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/orders">
                <Button>View My Orders</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
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
          <div className="flex items-center mb-8">
            <Link href="/orders">
              <Button variant="outline" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-600 mt-1">
                Order #{orderNumber}
              </p>
            </div>
          </div>

          {order && (
            <div className="space-y-6">
              {}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 capitalize">
                        {order.status}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Last updated: {new Date(order.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.toUpperCase()}
                  </Badge>
                </div>

                {}
                <div className="relative">
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                  {getTrackingSteps().map((step, index) => (
                    <div key={step.key} className="relative flex items-center mb-6">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        step.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {step.completed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div className="ml-6">
                        <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {step.label}
                        </p>
                        {step.completed && (
                          <p className="text-sm text-gray-600">Completed</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {order.first_name} {order.last_name}
                      </p>
                      <p className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {order.email}
                      </p>
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {order.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Delivery Information</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                        {order.shipping_address}, {order.city}, {order.region}
                      </p>
                      {order.postal_code && (
                        <p>Postal Code: {order.postal_code}</p>
                      )}
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        Placed: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {order.items?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={`/api/products/${item.product}/image/`}
                            alt={item.product_name}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.product_name}</h5>
                          <p className="text-sm text-gray-600">SKU: {item.product_sku}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            GHS {(item.price * item.quantity).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">GHS {item.price.toLocaleString()} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {}
                <div className="mt-6 pt-6 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">GHS {order.total_amount.toLocaleString()}</span>
                    </div>
                    {order.shipping_cost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">GHS {order.shipping_cost.toLocaleString()}</span>
                      </div>
                    )}
                    {order.tax_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">GHS {order.tax_amount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-lg text-blue-600">
                        GHS {order.grand_total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {}
              {order.status === 'shipped' && order.release_code && !deliveryConfirmed && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-blue-900">Delivery Confirmation</h3>
                  </div>
                  <p className="text-blue-800 mb-4">
                    Your order has been shipped. Please enter the 6-digit release code provided by the delivery agent to confirm delivery.
                  </p>
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="Enter 6-digit release code"
                      value={releaseCode}
                      onChange={(e) => setReleaseCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleConfirmDelivery}
                      disabled={confirmingDelivery || releaseCode.length !== 6}
                      className="min-w-[120px]"
                    >
                      {confirmingDelivery ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Confirming...
                        </>
                      ) : (
                        'Confirm Delivery'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    For security purposes, only use the release code provided by our authorized delivery agent.
                  </p>
                </div>
              )}

              {}
              {deliveryConfirmed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="text-lg font-semibold text-green-900">Delivery Confirmed!</h3>
                  </div>
                  <p className="text-green-800">
                    Thank you for confirming your delivery. Your order has been successfully delivered.
                  </p>
                </div>
              )}

              {}
              {order.tracking_number && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Navigation className="h-5 w-5 mr-2" />
                    Tracking Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Tracking Number</span>
                      <span className="font-mono text-sm">{order.tracking_number}</span>
                    </div>
                    {order.estimated_delivery && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Estimated Delivery</span>
                        <span className="text-sm">{new Date(order.estimated_delivery).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
