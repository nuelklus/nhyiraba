'use client';

import { Children, type ReactNode, useEffect, useState } from 'react';
import { posApiClient, type SalesSummaryResponse } from '@/lib/pos-api';

interface SalesSummaryProps {
  refreshKey?: number;
  storeId?: string;
}

interface CustomDates {
  from: string;
  to: string;
}

const localDateInputValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const currency = (amount: number | string) => new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
}).format(Number(amount) || 0);

const dateLabel = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function SalesSummary({ refreshKey, storeId }: SalesSummaryProps) {
  const [summary, setSummary] = useState<SalesSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [dateFromInput, setDateFromInput] = useState(localDateInputValue);
  const [dateToInput, setDateToInput] = useState(localDateInputValue);
  const [appliedDates, setAppliedDates] = useState<CustomDates | null>(null);
  const [filterError, setFilterError] = useState('');

  useEffect(() => {
    if (dateRange === 'custom' && !appliedDates) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');
    posApiClient.getSalesSummary(
      dateRange,
      storeId,
      appliedDates?.from,
      appliedDates?.to,
    ).then(data => {
      if (active) setSummary(data);
    }).catch(err => {
      if (!active) return;
      console.error('Failed to fetch sales summary:', err);
      setError(err.response?.data?.error || 'Failed to load sales report.');
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [dateRange, refreshKey, storeId, appliedDates]);

  const selectRange = (range: string) => {
    setFilterError('');
    setAppliedDates(null);
    setDateRange(range);
  };

  const applyCustomDates = () => {
    setFilterError('');
    if (!dateFromInput || !dateToInput) {
      setFilterError('Choose both a start date and an end date.');
      return;
    }
    if (dateFromInput > dateToInput) {
      setFilterError('The end date must be the same as or later than the start date.');
      return;
    }
    setDateRange('custom');
    setAppliedDates({ from: dateFromInput, to: dateToInput });
  };

  return (
    <section className="space-y-5 rounded-lg bg-white p-4 shadow sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Sales Report</h2>
          {summary && (
            <p className="mt-1 text-sm text-gray-500">
              {dateLabel(summary.start_date)} – {dateLabel(summary.end_date)}
              <span className="ml-2">Branch: {summary.store_id}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {['today', 'week', 'month', 'year'].map(range => (
            <button
              key={range}
              type="button"
              onClick={() => selectRange(range)}
              className={`rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
                dateRange === range ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setFilterError('');
              setDateRange('custom');
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              dateRange === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom dates
          </button>
        </div>
      </div>

      {dateRange === 'custom' && (
        <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            From
            <input
              type="date"
              value={dateFromInput}
              onChange={event => setDateFromInput(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            To
            <input
              type="date"
              value={dateToInput}
              onChange={event => setDateToInput(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
            />
          </label>
          <button
            type="button"
            onClick={applyCustomDates}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Apply dates
          </button>
          {filterError && <p role="alert" className="text-sm text-red-700">{filterError}</p>}
        </div>
      )}

      {loading && (
        <div className="rounded-lg bg-gray-50 p-5 text-sm text-gray-600" aria-live="polite">
          Loading sales report…
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {!loading && !error && summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total sales" value={currency(summary.total_sales)} />
            <Metric label="Transactions" value={summary.transaction_count.toLocaleString()} />
            <Metric label="Average sale" value={currency(summary.average_transaction_value)} />
            <Metric label="Payment methods" value={summary.payment_method_breakdown.length.toString()} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ReportTable
              title="Sales by day"
              emptyMessage="No sales in this date range."
              headers={['Date', 'Transactions', 'Sales']}
            >
              {summary.daily_sales.map(day => (
                <tr key={day.date} className="border-t border-gray-100">
                  <td className="p-3">{dateLabel(day.date)}</td>
                  <td className="p-3">{day.transaction_count}</td>
                  <td className="p-3 font-semibold">{currency(day.total)}</td>
                </tr>
              ))}
            </ReportTable>

            <ReportTable
              title="Top selling products"
              emptyMessage="No product sales in this date range."
              headers={['Product', 'Quantity', 'Sales']}
            >
              {summary.top_products.map(product => (
                <tr key={`${product.sku}-${product.name}`} className="border-t border-gray-100">
                  <td className="p-3 font-medium">
                    {product.name}<span className="block text-xs font-normal text-gray-500">{product.sku}</span>
                  </td>
                  <td className="p-3">{product.quantity.toLocaleString()}</td>
                  <td className="p-3 font-semibold">{currency(product.total_sales)}</td>
                </tr>
              ))}
            </ReportTable>
          </div>

          <ReportTable
            title="Payment method breakdown"
            emptyMessage="No completed payments in this date range."
            headers={['Method', 'Transactions', 'Sales']}
          >
            {summary.payment_method_breakdown.map(item => (
              <tr key={item.payment_method} className="border-t border-gray-100">
                <td className="p-3 capitalize">{item.payment_method.replaceAll('_', ' ')}</td>
                <td className="p-3">{item.count}</td>
                <td className="p-3 font-semibold">{currency(item.total)}</td>
              </tr>
            ))}
          </ReportTable>

          <div>
            <h3 className="mb-3 text-base font-bold text-gray-900">Sales transactions</h3>
            {summary.transactions.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No transactions in this date range.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                    <tr>
                      <th className="p-3">Receipt / time</th>
                      <th className="p-3">Cashier</th>
                      <th className="p-3">Items</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800">
                    {summary.transactions.map(transaction => (
                      <tr key={transaction.transaction_id} className="border-t border-gray-100 align-top">
                        <td className="p-3">
                          <span className="font-semibold">{transaction.receipt_number || transaction.transaction_id}</span>
                          <span className="mt-1 block text-xs text-gray-500">
                            {transaction.completed_at ? new Date(transaction.completed_at).toLocaleString('en-GH') : '—'}
                          </span>
                        </td>
                        <td className="p-3">{transaction.user_name}</td>
                        <td className="min-w-48 p-3">
                          {transaction.items.map((item, index) => (
                            <div key={`${item.product_name}-${index}`} className="text-xs">
                              {item.product_name} × {Number(item.quantity).toLocaleString()}{item.unit_name ? ` ${item.unit_name}` : ''}
                            </div>
                          ))}
                        </td>
                        <td className="p-3 capitalize">{transaction.payment_method.replaceAll('_', ' ')}</td>
                        <td className="p-3 text-right font-semibold">{currency(transaction.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {summary.transactions_limited && (
                  <p className="border-t bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Showing the latest 50 of {summary.transaction_count} transactions in this date range.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ReportTable({
  title,
  emptyMessage,
  headers,
  children,
}: {
  title: string;
  emptyMessage: string;
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <h3 className="p-3 text-sm font-bold text-gray-900">{title}</h3>
      <table className="min-w-full text-left text-sm text-gray-700">
        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>{headers.map(header => <th key={header} className="p-3">{header}</th>)}</tr>
        </thead>
        <tbody>
          {children}
          {Children.count(children) === 0 && (
            <tr><td colSpan={headers.length} className="p-4 text-gray-500">{emptyMessage}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
