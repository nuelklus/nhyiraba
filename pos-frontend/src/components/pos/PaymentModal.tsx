'use client';

import { useState } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Printer, Check } from 'lucide-react';
import { shoppingCart, type CartItem } from '@/lib/cart';
import { posApiClient } from '@/lib/pos-api';
import { formatCurrency } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totals: { subtotal: number; tax: number; total: number; itemCount: number };
  onPaymentComplete?: () => void;
}

export function PaymentModal({ isOpen, onClose, cartItems, totals, onPaymentComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>(totals.total.toString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [change, setChange] = useState<number>(0);
  const [showReceiptConfirm, setShowReceiptConfirm] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // Calculate change when amount paid changes
  const handleAmountPaidChange = (value: string) => {
    setAmountPaid(value);
    const paid = parseFloat(value) || 0;
    const calculatedChange = Math.max(0, paid - totals.total);
    setChange(calculatedChange);
  };

  // Process payment
  const handlePayment = async () => {
    if (isProcessing) return;

    const paid = parseFloat(amountPaid) || 0;
    if (paid < totals.total) {
      alert('Amount paid must be at least the total amount');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare transaction data
      const transactionData = {
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: parseFloat(item.product.price),
          total_price: parseFloat(item.product.price) * item.quantity
        })),
        payment_method: paymentMethod,
        subtotal: totals.subtotal,
        tax_amount: totals.tax,
        total_amount: totals.total,
        amount_paid: paid,
        notes: '',
        store_id: posApiClient.getStoreId(),
        device_id: posApiClient.getDeviceId()
      };

      // Create transaction
      const response = await posApiClient.createTransaction(transactionData);
      
      if (response) {
        // Store transaction and show receipt confirmation
        setLastTransaction(response);
        setShowReceiptConfirm(true);
      } else {
        throw new Error('Failed to create transaction');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Payment failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Print receipt
  const printReceipt = (transaction: any) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 2,
      }).format(amount);
    };

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${transaction.receipt_number}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body { 
            font-family: 'Courier New', monospace; 
            padding: 5mm; 
            max-width: 80mm; 
            margin: 0 auto; 
            font-size: 10px;
            color: #000;
          }
          .header { text-align: center; margin-bottom: 3mm; }
          .header h1 { margin: 0; font-size: 12px; font-weight: bold; }
          .header p { margin: 1mm 0; font-size: 9px; }
          .transaction-info { margin-bottom: 3mm; }
          .transaction-info div { margin: 1mm 0; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 3mm; }
          .items-table th, .items-table td { padding: 1mm; text-align: left; }
          .items-table th { border-bottom: 1px dashed #000; }
          .items-table td { border-bottom: 1px dotted #ccc; }
          .totals { margin-bottom: 3mm; }
          .totals div { display: flex; justify-content: space-between; margin: 1mm 0; }
          .totals .total { font-weight: bold; font-size: 11px; border-top: 1px dashed #000; padding-top: 1mm; }
          .footer { text-align: center; margin-top: 3mm; }
          .payment-info { margin-bottom: 3mm; }
          .separator { border-top: 1px dashed #000; margin: 2mm 0; }
          .double-separator { border-top: 2px double #000; margin: 2mm 0; }
          @media print {
            body { padding: 2mm; }
          }
        </style>
      </head>
      <body>
        <div class="double-separator"></div>
        <div class="header">
          <h1>Gee-Gees Unisex Salon and Spa</h1>
          <p>Opposite Ho Teaching Hospital main Entrance, Ho</p>
          <p>Tel: 0245821322</p>
          <p>TIN: C0001234567</p>
        </div>
        <div class="double-separator"></div>

        <div class="transaction-info">
          <div><strong>Receipt No:</strong> ${transaction.receipt_number}</div>
          <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Cashier:</strong> ${transaction.user_name || 'Staff'}</div>
        </div>

        <div class="separator"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%">Item</th>
              <th style="width: 15%">Qty</th>
              <th style="width: 35%">Total</th>
            </tr>
          </thead>
          <tbody>
            ${transaction.items.map((item: any) => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.total_price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="separator"></div>

        <div class="totals">
          <div><span>Sub Total:</span><span>${formatCurrency(transaction.subtotal)}</span></div>
          <div><span>NHIL (2.5%):</span><span>${formatCurrency(transaction.tax_amount * 0.2083)}</span></div>
          <div><span>GETFund (2.5%):</span><span>${formatCurrency(transaction.tax_amount * 0.2083)}</span></div>
          <div><span>VAT (15%):</span><span>${formatCurrency(transaction.tax_amount * 0.5834)}</span></div>
          <div class="total"><span>TOTAL:</span><span>${formatCurrency(transaction.total_amount)}</span></div>
        </div>

        <div class="separator"></div>

        <div class="payment-info">
          <div><strong>Payment:</strong> ${transaction.payment_method.toUpperCase()}</div>
          <div><strong>Amount Paid:</strong> ${formatCurrency(transaction.amount_paid)}</div>
          <div><strong>Change:</strong> ${formatCurrency(transaction.change_amount)}</div>
        </div>

        <div class="separator"></div>

        <div class="footer">
          <p>Thank You For Trusting Us!</p>
        </div>
        <div class="double-separator"></div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Reset form
  const handleReset = () => {
    setAmountPaid(totals.total.toString());
    setChange(0);
  };

  // Handle receipt confirmation
  const handleReceiptYes = () => {
    if (lastTransaction) {
      printReceipt(lastTransaction);
    }
    // Clear cart and close modal
    shoppingCart.clear();
    setShowReceiptConfirm(false);
    setLastTransaction(null);
    onClose();
    // Trigger refresh callback
    if (onPaymentComplete) {
      onPaymentComplete();
    }
  };

  const handleReceiptNo = () => {
    // Clear cart and close modal
    shoppingCart.clear();
    setShowReceiptConfirm(false);
    setLastTransaction(null);
    onClose();
    // Trigger refresh callback
    if (onPaymentComplete) {
      onPaymentComplete();
    }
  };

  // Debug log
  console.log('🔍 PaymentModal rendering with back button');

  if (!isOpen) return null;

  console.log('🔍 PaymentModal rendering - full modal should be visible');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-lg mx-0 sm:mx-4 max-h-[90vh] sm:max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-4">Order Summary</h3>
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.product.name}</span>
                <span>{formatCurrency(parseFloat(item.product.price) * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (12%):</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-4">Payment Method</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'cash'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-medium">Cash</span>
            </button>
            
            <button
              onClick={() => setPaymentMethod('card')}
              disabled={true}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-medium">Card</span>
              <span className="text-xs text-gray-500 block mt-1">(Coming Soon)</span>
            </button>
            
            <button
              onClick={() => setPaymentMethod('mobile')}
              disabled={true}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'mobile'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-medium">Mobile</span>
              <span className="text-xs text-gray-500 block mt-1">(Coming Soon)</span>
            </button>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-medium mb-4">Payment Details</h3>
          
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid:
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => handleAmountPaidChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900"
                  placeholder="Enter amount paid"
                  step="0.01"
                  min="0"
                />
              </div>
              
              {change > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-green-700">Change:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(change)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentMethod !== 'cash' && (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-600">
                {paymentMethod === 'card' && 'Card payment processing will be available soon.'}
                {paymentMethod === 'mobile' && 'Mobile money payment will be available soon.'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!showReceiptConfirm ? (
          <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium font-bold text-sm sm:text-base"
            >
              ← Back
            </button>
            
            <button
              onClick={handleReset}
              className="w-full sm:flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm sm:text-base"
            >
              Reset
            </button>
            
            <button
              onClick={handlePayment}
              disabled={isProcessing || paymentMethod !== 'cash' || parseFloat(amountPaid) < totals.total}
              className="w-full sm:flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-t-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete Payment
                </>
              )}
            </button>
          </div>
        ) : (
          /* Receipt Confirmation */
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600">Transaction ID: {lastTransaction?.transaction_id}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-center text-gray-700 font-medium">Would you like to print a receipt?</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleReceiptNo}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm sm:text-base"
              >
                No, Skip
              </button>
              <button
                onClick={handleReceiptYes}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center text-sm sm:text-base"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
