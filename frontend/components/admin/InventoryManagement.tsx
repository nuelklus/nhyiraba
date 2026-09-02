'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminInventoryApi, InventoryOverview, InventoryTransaction, StockAlert, ProductApproval } from '@/lib/admin-inventory-api';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Settings,
  BarChart3,
  Warehouse,
  Truck,
  DollarSign,
  Users,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';

export function InventoryManagement() {
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [approvals, setApprovals] = useState<ProductApproval[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'alerts' | 'approvals'>('overview');

  const [transactionFilter, setTransactionFilter] = useState('');
  const [alertFilter, setAlertFilter] = useState<'all' | 'resolved' | 'unresolved'>('all');

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<StockAlert | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<ProductApproval | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewData, transactionsData, alertsData, approvalsData] = await Promise.all([
        adminInventoryApi.getInventoryOverview(),
        adminInventoryApi.getInventoryTransactions({ page: 1, page_size: 10 }),
        adminInventoryApi.getStockAlerts(),
        adminInventoryApi.getPendingApprovals()
      ]);
      
      setOverview(overviewData);
      setTransactions(transactionsData.results);
      setAlerts(alertsData);
      setApprovals(approvalsData);
    } catch (err: any) {
      console.error('Failed to fetch inventory data:', err);
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'sale':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      case 'adjustment':
        return <Settings className="h-4 w-4 text-blue-600" />;
      case 'return':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case 'damage':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'out_of_stock':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'overstock':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getApprovalIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'update':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'price_change':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      case 'stock_adjustment':
        return <Package className="h-4 w-4 text-orange-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      setProcessing(true);
      await adminInventoryApi.resolveStockAlert(alertId);

      const updatedAlerts = await adminInventoryApi.getStockAlerts();
      setAlerts(updatedAlerts);
      
      setSelectedAlert(null);
    } catch (err: any) {
      console.error('Failed to resolve alert:', err);
      setError(err.message || 'Failed to resolve alert');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessApproval = async (approvalId: number, action: 'approve' | 'reject', notes?: string) => {
    try {
      setProcessing(true);
      await adminInventoryApi.processApproval(approvalId, action, notes);

      const updatedApprovals = await adminInventoryApi.getPendingApprovals();
      setApprovals(updatedApprovals);
      
      setSelectedApproval(null);
    } catch (err: any) {
      console.error('Failed to process approval:', err);
      setError(err.message || 'Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.overview.total_products}</p>
                  <p className="text-xs text-gray-500">{overview.overview.active_products} active</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">{overview.overview.in_stock}</p>
                  <p className="text-xs text-gray-500">{overview.overview.out_of_stock} out of stock</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{overview.overview.low_stock}</p>
                  <p className="text-xs text-gray-500">Needs attention</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-blue-600">
                    GHS {overview.warehouse_stock.total_value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{overview.warehouse_stock.total_stock} items</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3, count: undefined },
            { id: 'transactions', label: 'Transactions', icon: RefreshCw, count: transactions.length },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle, count: alerts.filter(a => !a.is_resolved).length },
            { id: 'approvals', label: 'Approvals', icon: CheckCircle, count: approvals.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-1 py-2 border-b-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {}
      {activeTab === 'overview' && overview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview.recent_transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium text-sm">{transaction.product.name}</p>
                        <p className="text-xs text-gray-600">{transaction.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium text-sm ${
                        transaction.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.quantity_change > 0 ? '+' : ''}{transaction.quantity_change}
                      </p>
                      <p className="text-xs text-gray-600">{transaction.created_at}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Inventory by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview.category_value.slice(0, 5).map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{category.category}</p>
                      <p className="text-xs text-gray-600">{category.total_products} products</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">GHS {category.total_value.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">{category.total_stock} items</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inventory Transactions</CardTitle>
            <div className="flex space-x-2">
              <Input
                placeholder="Search transactions..."
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className="w-64"
              />
              <Button onClick={() => setShowTransactionModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions
                .filter(t => 
                  transactionFilter === '' || 
                  t.product.name.toLowerCase().includes(transactionFilter.toLowerCase()) ||
                  t.reference.toLowerCase().includes(transactionFilter.toLowerCase())
                )
                .map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.product.name}</p>
                        <p className="text-sm text-gray-600">SKU: {transaction.product.sku}</p>
                        <p className="text-xs text-gray-500">{transaction.notes}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.quantity_change > 0 ? '+' : ''}{transaction.quantity_change}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transaction.quantity_before} -&gt; {transaction.quantity_after}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.created_at}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'alerts' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Stock Alerts</CardTitle>
            <div className="flex space-x-2">
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Alerts</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts
                .filter(alert => {
                  if (alertFilter === 'all') return true;
                  if (alertFilter === 'resolved') return alert.is_resolved;
                  if (alertFilter === 'unresolved') return !alert.is_resolved;
                  return true;
                })
                .map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getAlertIcon(alert.alert_type)}
                      <div>
                        <p className="font-medium">{alert.product.name}</p>
                        <p className="text-sm text-gray-600">SKU: {alert.product.sku}</p>
                        <p className="text-xs text-gray-500">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={alert.is_resolved ? "default" : "destructive"}>
                        {alert.is_resolved ? 'Resolved' : 'Active'}
                      </Badge>
                      {!alert.is_resolved && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'approvals' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getApprovalIcon(approval.change_type)}
                    <div>
                      <p className="font-medium">{approval.product.name}</p>
                      <p className="text-sm text-gray-600">{approval.change_type}</p>
                      <p className="text-xs text-gray-500">Requested by {approval.requested_by}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedApproval(approval)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Resolve Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Are you sure you want to resolve this alert?</p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedAlert.product.name}</p>
                  <p className="text-sm text-gray-600">{selectedAlert.message}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAlert(null)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleResolveAlert(selectedAlert.id)}
                    disabled={processing}
                  >
                    {processing ? 'Resolving...' : 'Resolve Alert'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Approval Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{selectedApproval.product.name}</p>
                  <p className="text-sm text-gray-600">{selectedApproval.change_type}</p>
                  <p className="text-xs text-gray-500">Requested by {selectedApproval.requested_by}</p>
                </div>
                
                {Object.keys(selectedApproval.old_values).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Old Values:</h4>
                    <pre className="text-xs bg-gray-50 p-2 rounded">
                      {JSON.stringify(selectedApproval.old_values, null, 2)}
                    </pre>
                  </div>
                )}
                
                {Object.keys(selectedApproval.new_values).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">New Values:</h4>
                    <pre className="text-xs bg-gray-50 p-2 rounded">
                      {JSON.stringify(selectedApproval.new_values, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedApproval(null)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleProcessApproval(selectedApproval.id, 'reject')}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </Button>
                  <Button
                    onClick={() => handleProcessApproval(selectedApproval.id, 'approve')}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
