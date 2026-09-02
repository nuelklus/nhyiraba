'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApi, CreateOrderRequest } from '@/lib/orders-api';
import {
  ArrowLeft,
  Truck,
  Shield,
  RefreshCw,
  CreditCard,
  Smartphone,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  User,
  Check,
  AlertCircle
} from 'lucide-react';

export default function CheckoutPage() {
  const { items, total, itemCount, clearCart } = useCart();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'mobile_money'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Accra',
    region: 'Greater Accra',
    postalCode: '',
    notes: ''
  });

  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      
      sessionStorage.setItem('previousPage', '/checkout');
      window.location.href = '/login?redirect=/checkout';
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (user && isAuthenticated) {
      setShippingInfo(prev => ({
        ...prev,
        email: user.email,
        firstName: user.username.split(' ')[0] || user.username,
        lastName: user.username.split(' ').slice(1).join(' ') || '',
        phone: user.phone_number || prev.phone
      }));
    }
  }, [user, isAuthenticated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value
    });
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{authLoading ? 'Checking authentication...' : 'Redirecting to login...'}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      
      const requiredFields = {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email Address',
        phone: 'Phone Number',
        address: 'Delivery Address',
        city: 'City',
        region: 'Region'
      };

      for (const [field, label] of Object.entries(requiredFields)) {
        if (!shippingInfo[field as keyof typeof shippingInfo]) {
          throw new Error(`${label} is required`);
        }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(shippingInfo.email)) {
        throw new Error('Please enter a valid email address');
      }

      const phoneRegex = /^(\+233|0)[0-9]{9}$/;
      if (!phoneRegex.test(shippingInfo.phone.replace(/\s/g, ''))) {
        throw new Error('Please enter a valid Ghana phone number (e.g., +233 XX XXX XXXX or 0XX XXX XXXX)');
      }

      console.log('=== DETAILED ORDER DEBUG ===');
      console.log('1. Shipping Info:', JSON.stringify(shippingInfo, null, 2));
      console.log('2. Payment Method:', paymentMethod);
      console.log('3. Total Amount:', total);
      console.log('4. Cart Items:', JSON.stringify(items, null, 2));
      console.log('5. Item Count:', itemCount);

      const orderRequest: CreateOrderRequest = {
        first_name: shippingInfo.firstName,
        last_name: shippingInfo.lastName,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
        shipping_address: shippingInfo.address,
        city: shippingInfo.city,
        region: shippingInfo.region,
        postal_code: shippingInfo.postalCode,
        order_notes: shippingInfo.notes,
        total_amount: total,
        payment_method: paymentMethod,
        items: items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_sku: item.sku || 'N/A',
          price: item.price,
          quantity: item.quantity
        }))
      };

      console.log('6. Final Order Request:', JSON.stringify(orderRequest, null, 2));
      console.log('7. Order Request Types:', {
        first_name: typeof orderRequest.first_name,
        last_name: typeof orderRequest.last_name,
        email: typeof orderRequest.email,
        phone: typeof orderRequest.phone,
        shipping_address: typeof orderRequest.shipping_address,
        city: typeof orderRequest.city,
        region: typeof orderRequest.region,
        postal_code: typeof orderRequest.postal_code,
        order_notes: typeof orderRequest.order_notes,
        total_amount: typeof orderRequest.total_amount,
        payment_method: typeof orderRequest.payment_method,
        items: typeof orderRequest.items,
        items_length: orderRequest.items.length
      });

      console.log('🛒 Sending order to API...');
      const order = await ordersApi.createOrder(orderRequest);
      console.log('🛒 Order created successfully:', order);

      setOrderData(order);

      clearCart();
      setOrderComplete(true);
      
    } catch (error: any) {
      console.error('Order creation failed:', error);
      console.error('Error structure:', {
        message: error.message,
        response: error.response,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        status: error.status,
        data: error.data
      });

      // Handle different error types
      let errorMessage = 'Failed to create order. Please try again.';

      if (error.response?.status === 400) {
        // Validation error (e.g., insufficient inventory)
        errorMessage = error.response.data?.error || error.message || 'Invalid order data. Please check your cart.';
        console.log('🔍 400 Error message extracted:', errorMessage);
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 400) {
        // Fallback for error object with status property
        errorMessage = error.data?.error || error.message || 'Invalid order data. Please check your cart.';
        console.log('🔍 400 Error message extracted (fallback):', errorMessage);
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log('🔍 Final error message to display:', errorMessage);

      // Convert escaped \n to actual newlines for display
      errorMessage = errorMessage.replace(/\\n/g, '\n').replace(/\n/g, '<br />');

      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Complete!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for your order. We've sent a confirmation email to {shippingInfo.email}.
            </p>
            
            {orderData && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8 text-left">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-bold">{orderData.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Total:</span>
                    <span className="font-bold">GHS {orderData.grand_total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-bold">
                      {orderData.payment_method === 'cod' ? 'Cash on Delivery' : 
                       orderData.payment_method === 'card' ? 'Bank Card' : 'Mobile Money'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-bold text-blue-600">{orderData.status}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      <strong>Delivery Address:</strong><br />
                      {shippingInfo.address}, {shippingInfo.city}, {shippingInfo.region}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-green-900 mb-2">
                <DollarSign className="h-5 w-5 inline mr-2" />
                Cash on Delivery Information
              </h3>
              <ul className="text-sm text-green-800 space-y-2">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Order confirmation email sent to {shippingInfo.email}</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>We'll process your order within 1-2 business days</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Payment of GHS {orderData?.grand_total?.toLocaleString() || total.toLocaleString()} will be collected upon delivery</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Please have the exact amount ready for faster delivery</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">
                <Truck className="h-5 w-5 inline mr-2" />
                Delivery Information
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Delivery Address:</strong> {shippingInfo.address}, {shippingInfo.city}, {shippingInfo.region}</p>
                <p><strong>Contact Number:</strong> {shippingInfo.phone}</p>
                <p><strong>Expected Delivery:</strong> 3-5 business days after order processing</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/orders">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Truck className="h-4 w-4 mr-2" />
                  Track Order
                </Button>
              </Link>
              <Link href="/products">
                <Button className="w-full sm:w-auto">Continue Shopping</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">No Items in Cart</h1>
            <p className="text-gray-600 mb-8">Please add items to your cart before checkout.</p>
            <Link href="/products">
              <Button size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf8]">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/cart">
              <Button variant="outline" className="mr-0 border-[#f3c5d8] bg-white text-[#333] hover:bg-[#fff3f8] sm:mr-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cart
              </Button>
            </Link>
            <h1 className="text-3xl font-black text-gray-900">Checkout</h1>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {}
            <div className="space-y-6 lg:col-span-2">
              {}
              <div className="rounded-[24px] border border-pink-100 bg-white p-6 shadow-[0_18px_45px_rgba(241,39,123,0.06)]">
                <h2 className="mb-6 text-xl font-semibold text-gray-900">Shipping Information</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={shippingInfo.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-gray-200 bg-[#fffdfd] px-3 py-2.5 focus:border-[#F1277B] focus:outline-none focus:ring-2 focus:ring-[#F1277B]/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={shippingInfo.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-gray-200 bg-[#fffdfd] px-3 py-2.5 focus:border-[#F1277B] focus:outline-none focus:ring-2 focus:ring-[#F1277B]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={shippingInfo.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-gray-200 bg-[#fffdfd] px-3 py-2.5 focus:border-[#F1277B] focus:outline-none focus:ring-2 focus:ring-[#F1277B]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+233 XX XXX XXXX"
                      className="w-full rounded-xl border border-gray-200 bg-[#fffdfd] px-3 py-2.5 focus:border-[#F1277B] focus:outline-none focus:ring-2 focus:ring-[#F1277B]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleInputChange}
                      required
                      placeholder="Street address, house number, etc."
                      className="w-full rounded-xl border border-gray-200 bg-[#fffdfd] px-3 py-2.5 focus:border-[#F1277B] focus:outline-none focus:ring-2 focus:ring-[#F1277B]/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-gray-200 bg-[#fffdfd] px-3 py-2.5 focus:border-[#F1277B] focus:outline-none focus:ring-2 focus:ring-[#F1277B]/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Region
                      </label>
                      <input
                        type="text"
                        name="region"
                        value={shippingInfo.region}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-gray-200 bg-[#fffdfd] px-3 py-2.5 focus:border-[#F1277B] focus:outline-none focus:ring-2 focus:ring-[#F1277B]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={shippingInfo.notes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Special delivery instructions..."
                      className="w-full rounded-xl border border-gray-200 bg-[#fffdfd] px-3 py-2.5 focus:border-[#F1277B] focus:outline-none focus:ring-2 focus:ring-[#F1277B]/20"
                    />
                  </div>
                </form>
              </div>

              {}
              <div className="rounded-[24px] border border-pink-100 bg-white p-6 shadow-[0_18px_45px_rgba(241,39,123,0.06)]">
                <h2 className="mb-6 text-xl font-semibold text-gray-900">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center rounded-xl border-2 border-[#F1277B] bg-[#fff2f7] p-4">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-3"
                    />
                    <DollarSign className="mr-3 h-5 w-5 text-[#2aa66b]" />
                    <div className="flex-1">
                      <div className="font-medium text-[#1e7a52]">Cash on Delivery</div>
                      <div className="text-sm text-gray-600">Pay when you receive your order</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                  </label>

                  <div className="flex items-center rounded-xl border border-gray-200 p-4 opacity-60">
                    <input
                      type="radio"
                      name="payment"
                      value="mobile_money"
                      checked={paymentMethod === 'mobile_money'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-3"
                      disabled
                    />
                    <Smartphone className="mr-3 h-5 w-5 text-[#4a6ff6]" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-500">Mobile Money</div>
                      <div className="text-sm text-gray-400">MTN, Vodafone, AirtelTigo</div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500">Coming Soon</Badge>
                  </div>

                  <div className="flex items-center rounded-xl border border-gray-200 p-4 opacity-60">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-3"
                      disabled
                    />
                    <CreditCard className="mr-3 h-5 w-5 text-[#7a5bf1]" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-500">Bank Card</div>
                      <div className="text-sm text-gray-400">Visa, Mastercard, etc.</div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500">Coming Soon</Badge>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="lg:col-span-1">
              <div className="sticky top-6 rounded-[24px] border border-pink-100 bg-white p-6 shadow-[0_18px_45px_rgba(241,39,123,0.06)]">
                <h2 className="mb-6 text-xl font-semibold text-gray-900">Order Summary</h2>
                
                {}
                <div className="mb-6 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-cover"
                          unoptimized={item.image.includes('via.placeholder.com')}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        GHS {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                    <span className="font-medium">GHS {total.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-[#2aa66b]">Free</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-[#F1277B]">GHS {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {}
                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start">
                      <AlertCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                      <span className="font-medium text-red-800" dangerouslySetInnerHTML={{ __html: error }} />
                    </div>
                  </div>
                )}

                {}
                <Button 
                  onClick={handleSubmit}
                  className="mt-6 w-full bg-gradient-to-r from-[#F1277B] to-[#f55ca0] py-3 text-lg font-medium text-white shadow-[0_12px_25px_rgba(241,39,123,0.25)] hover:opacity-95"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    `Place Order • GHS ${total.toLocaleString()}`
                  )}
                </Button>

                {}
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex items-center text-sm text-green-800">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span className="font-medium">Cash on Delivery</span>
                  </div>
                  <p className="mt-1 text-xs text-green-700">
                    Pay GHS {total.toLocaleString()} when your order arrives
                  </p>
                </div>

                {}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    🔒 Secure checkout • Your information is protected
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
