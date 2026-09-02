// 'use client';

// import { Printer, Download, Mail } from 'lucide-react';
// import { formatCurrency } from '@/lib/utils';

// interface ReceiptItem {
//   product_name: string;
//   product_sku: string;
//   quantity: number;
//   unit_price: number;
//   total_price: number;
// }

// interface ReceiptProps {
//   transaction: {
//     transaction_id: string;
//     receipt_number: string;
//     created_at: string;
//     payment_method: string;
//     subtotal: number;
//     tax_amount: number;
//     total_amount: number;
//     amount_paid: number;
//     change_amount: number;
//     items: ReceiptItem[];
//     user_name: string;
//   };
// }

// export function Receipt({ transaction }: ReceiptProps) {
//   const handlePrint = () => {
//     const printWindow = window.open('', '_blank');
//     if (printWindow) {
//       printWindow.document.write(getReceiptHTML());
//       printWindow.document.close();
//       printWindow.print();
//     }
//   };

//   const handleDownload = () => {
//     const element = document.createElement('a');
//     const file = new Blob([getReceiptHTML()], { type: 'text/html' });
//     element.href = URL.createObjectURL(file);
//     element.download = `receipt-${transaction.receipt_number}.html`;
//     document.body.appendChild(element);
//     element.click();
//     document.body.removeChild(element);
//   };

//   const handleEmail = () => {
//     // Placeholder for email functionality
//     alert('Email receipt functionality will be implemented in Phase 3');
//   };

//   const getReceiptHTML = () => `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <title>Receipt - ${transaction.receipt_number}</title>
//       <style>
//         @page {
//           size: 80mm auto;
//           margin: 0;
//         }
//         body { 
//           font-family: 'Courier New', monospace; 
//           padding: 5mm; 
//           max-width: 80mm; 
//           margin: 0 auto; 
//           font-size: 10px;
//           color: #000;
//         }
//         .header { text-align: center; margin-bottom: 3mm; }
//         .header h1 { margin: 0; font-size: 12px; font-weight: bold; }
//         .header p { margin: 1mm 0; font-size: 9px; }
//         .transaction-info { margin-bottom: 3mm; }
//         .transaction-info div { margin: 1mm 0; }
//         .items-table { width: 100%; border-collapse: collapse; margin-bottom: 3mm; }
//         .items-table th, .items-table td { padding: 1mm; text-align: left; }
//         .items-table th { border-bottom: 1px dashed #000; }
//         .items-table td { border-bottom: 1px dotted #ccc; }
//         .totals { margin-bottom: 3mm; }
//         .totals div { display: flex; justify-content: space-between; margin: 1mm 0; }
//         .totals .total { font-weight: bold; font-size: 11px; border-top: 1px dashed #000; padding-top: 1mm; }
//         .footer { text-align: center; margin-top: 3mm; }
//         .payment-info { margin-bottom: 3mm; }
//         .separator { border-top: 1px dashed #000; margin: 2mm 0; }
//         .double-separator { border-top: 2px double #000; margin: 2mm 0; }
//         @media print {
//           body { padding: 2mm; }
//         }
//       </style>
//     </head>
//     <body>
//       <div class="double-separator"></div>
//       <div class="header">
//         <h1>Gee-Gees Unisex Salon and Spa</h1>
//         <p>Opposite Ho Teaching Hospital main Entrance, Ho</p>
//         <p>Tel: 0245821322</p>
//         <p>TIN: C0001234567</p>
//       </div>
//       <div class="double-separator"></div>

//       <div class="transaction-info">
//         <div><strong>Receipt No:</strong> ${transaction.receipt_number}</div>
//         <div><strong>Date:</strong> ${new Date(transaction.created_at).toLocaleString()}</div>
//         <div><strong>Cashier:</strong> ${transaction.user_name}</div>
//       </div>

//       <div class="separator"></div>

//       <table class="items-table">
//         <thead>
//           <tr>
//             <th style="width: 50%">Item</th>
//             <th style="width: 15%">Qty</th>
//             <th style="width: 35%">Total</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${transaction.items.map(item => `
//             <tr>
//               <td>${item.product_name}</td>
//               <td>${item.quantity}</td>
//               <td>${formatCurrency(item.total_price)}</td>
//             </tr>
//           `).join('')}
//         </tbody>
//       </table>

//       <div class="separator"></div>

//       <div class="totals">
//         <div><span>Sub Total:</span><span>${formatCurrency(transaction.subtotal)}</span></div>
//         <div><span>NHIL (2.5%):</span><span>${formatCurrency(transaction.tax_amount * 0)}</span></div>
//         <div><span>GETFund *****:</span><span>${formatCurrency(transaction.tax_amount * 0)}</span></div>
//         <div><span>VAT (15%):</span><span>${formatCurrency(transaction.tax_amount * 0)}</span></div>
//         <div class="total"><span>TOTAL:</span><span>${formatCurrency(transaction.total_amount)}</span></div>
//       </div>

//       <div class="separator"></div>

//       <div class="payment-info">
//         <div><strong>Payment:</strong> ${transaction.payment_method.toUpperCase()}</div>
//         <div><strong>Amount Paid:</strong> ${formatCurrency(transaction.amount_paid)}</div>
//         <div><strong>Change:</strong> ${formatCurrency(transaction.change_amount)}</div>
//       </div>

//       <div class="separator"></div>

//       <div class="footer">
//         <p>Thank You For Trusting Us</p>
//       </div>
//       <div class="double-separator"></div>
//     </body>
//     </html>
//   `;

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
//       {/* Receipt Header */}
//       <div className="text-center mb-6">
//         <h2 className="text-2xl font-bold text-gray-900">HARDWARE STORE</h2>
//         <p className="text-gray-600">123 Main Street, Accra, Ghana</p>
//         <p className="text-gray-600">Tel: +233 123 456 789</p>
//         <p className="text-gray-600">📧 info@hardwarestore.com</p>
//       </div>

//       {/* Transaction Info */}
//       <div className="mb-6 p-4 bg-gray-50 rounded-lg">
//         <div className="grid grid-cols-2 gap-2 text-sm">
//           <div><strong>Receipt #:</strong> {transaction.receipt_number}</div>
//           <div><strong>Transaction ID:</strong> {transaction.transaction_id}</div>
//           <div><strong>Date:</strong> {new Date(transaction.created_at).toLocaleString()}</div>
//           <div><strong>Cashier:</strong> {transaction.user_name}</div>
//         </div>
//       </div>

//       {/* Items Table */}
//       <div className="mb-6">
//         <table className="w-full border-collapse">
//           <thead>
//             <tr className="border-b-2 border-gray-200">
//               <th className="text-left py-2">Item</th>
//               <th className="text-center py-2">Qty</th>
//               <th className="text-right py-2">Price</th>
//               <th className="text-right py-2">Total</th>
//             </tr>
//           </thead>
//           <tbody>
//             {transaction.items.map((item, index) => (
//               <tr key={index} className="border-b border-gray-100">
//                 <td className="py-2">
//                   <div className="font-medium">{item.product_name}</div>
//                   <div className="text-xs text-gray-500">{item.product_sku}</div>
//                 </td>
//                 <td className="text-center py-2">{item.quantity}</td>
//                 <td className="text-right py-2">{formatCurrency(item.unit_price)}</td>
//                 <td className="text-right py-2 font-medium">{formatCurrency(item.total_price)}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Totals */}
//       <div className="mb-6 p-4 bg-gray-50 rounded-lg">
//         <div className="space-y-2">
//           <div className="flex justify-between">
//             <span>Subtotal:</span>
//             <span>{formatCurrency(transaction.subtotal)}</span>
//           </div>
//           <div className="flex justify-between">
//             <span>Tax (12%):</span>
//             <span>{formatCurrency(transaction.tax_amount)}</span>
//           </div>
//           <div className="flex justify-between font-bold text-lg border-t pt-2">
//             <span>Total:</span>
//             <span className="text-green-600">{formatCurrency(transaction.total_amount)}</span>
//           </div>
//         </div>
//       </div>

//       {/* Payment Info */}
//       <div className="mb-6 p-4 bg-blue-50 rounded-lg">
//         <div className="space-y-2">
//           <div className="flex justify-between">
//             <span><strong>Payment Method:</strong></span>
//             <span>{transaction.payment_method.toUpperCase()}</span>
//           </div>
//           <div className="flex justify-between">
//             <span><strong>Amount Paid:</strong></span>
//             <span>{formatCurrency(transaction.amount_paid)}</span>
//           </div>
//           <div className="flex justify-between">
//             <span><strong>Change:</strong></span>
//             <span className="text-green-600 font-medium">{formatCurrency(transaction.change_amount)}</span>
//           </div>
//         </div>
//       </div>

//       {/* Actions */}
//       <div className="flex space-x-3">
//         <button
//           onClick={handlePrint}
//           className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           <Printer className="w-4 h-4 mr-2" />
//           Print
//         </button>
//         <button
//           onClick={handleDownload}
//           className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//         >
//           <Download className="w-4 h-4 mr-2" />
//           Download
//         </button>
//         <button
//           onClick={handleEmail}
//           className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
//         >
//           <Mail className="w-4 h-4 mr-2" />
//           Email
//         </button>
//       </div>

//       {/* Footer */}
//       <div className="text-center mt-6 pt-4 border-t text-gray-600">
//         <p className="font-medium">Thank You For Trusting Us!</p>
//       </div>
//     </div>
//   );
// }