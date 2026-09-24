'use client';

import { useEffect, useState } from 'react';
import { posApiClient } from '@/lib/pos-api';

type Report = {
  date_range: string;
  branches: Array<{
    store_id: string;
    name: string;
    product_count: number;
    total_quantity: number;
    retail_value: number;
    cost_value: number;
    sales: { total_sales: number; transaction_count: number };
  }>;
  grand_total: {
    total_quantity: number;
    retail_value: number;
    cost_value: number;
    sales: { total_sales: number; transaction_count: number };
  };
  product_totals: Array<{
    product_id: number;
    name: string;
    sku: string;
    base_unit: string;
    quantity: number;
    retail_value: number;
    cost_value: number;
  }>;
};

const money = (value: number) => new Intl.NumberFormat('en-GH', {
  style: 'currency', currency: 'GHS',
}).format(value);

export default function BusinessReport({ refreshKey = 0 }: { refreshKey?: number }) {
  const [range, setRange] = useState('today');
  const [branch, setBranch] = useState('');
  const [branchOptions, setBranchOptions] = useState<Report['branches']>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    posApiClient.getBusinessReport(range, branch || undefined)
      .then(data => {
        if (!mounted) return;
        setReport(data);
        // Keep the selector populated with every branch after a filtered
        // response replaces the report with one branch.
        setBranchOptions(current => {
          const options = [...current];
          data.branches.forEach((item: Report['branches'][number]) => {
            if (!options.some(option => option.store_id === item.store_id)) {
              options.push(item);
            }
          });
          return options;
        });
      })
      .catch(() => mounted && setError('Unable to load the business report.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [range, branch, refreshKey]);

  if (loading) return <div className="rounded-lg bg-white p-6 shadow text-gray-600">Loading business report...</div>;
  if (error || !report) return <div className="rounded-lg bg-white p-6 shadow text-red-600">{error || 'No report data.'}</div>;

  return (
    <section className="space-y-4 rounded-lg bg-slate-50 p-4 shadow-inner sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Business Overview</h2>
          <p className="text-sm text-slate-600">Stock value, branch performance, and sales</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['today', 'week', 'month', 'year'].map(option => (
            <button key={option} onClick={() => setRange(option)} className={`rounded px-3 py-2 text-sm font-semibold capitalize ${range === option ? 'bg-blue-700 text-white' : 'bg-white text-slate-700'}`}>
              {option}
            </button>
          ))}
          <select value={branch} onChange={event => setBranch(event.target.value)} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800">
            <option value="">All branches</option>
            {branchOptions.map(item => <option key={item.store_id} value={item.store_id}>{item.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Grand stock quantity" value={report.grand_total.total_quantity.toLocaleString()} />
        <Metric label="Stock retail value" value={money(report.grand_total.retail_value)} />
        <Metric label="Stock cost value" value={money(report.grand_total.cost_value)} />
        <Metric label={`${range} sales`} value={money(report.grand_total.sales.total_sales)} />
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <h3 className="p-4 text-base font-bold text-slate-900">Branch stock and sales</h3>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Branch</th><th className="p-3">Quantity</th><th className="p-3">Retail value</th><th className="p-3">Cost value</th><th className="p-3">Sales</th></tr></thead>
          <tbody>
            {report.branches.map(item => (
              <tr key={item.store_id} className="border-t border-slate-200 text-slate-800">
                <td className="p-3 font-semibold">{item.name}<div className="text-xs text-slate-500">{item.store_id}</div></td>
                <td className="p-3">{item.total_quantity.toLocaleString()}</td>
                <td className="p-3">{money(item.retail_value)}</td>
                <td className="p-3">{money(item.cost_value)}</td>
                <td className="p-3">{money(item.sales.total_sales)} <span className="text-xs text-slate-500">({item.sales.transaction_count})</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <h3 className="p-4 text-base font-bold text-slate-900">Product totals across selected branches</h3>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Product</th><th className="p-3">Quantity</th><th className="p-3">Retail value</th><th className="p-3">Cost value</th></tr></thead>
          <tbody>
            {report.product_totals.map(item => (
              <tr key={item.product_id} className="border-t border-slate-200 text-slate-800">
                <td className="p-3 font-semibold">{item.name}<div className="text-xs text-slate-500">{item.sku}</div></td>
                <td className="p-3">{item.quantity.toLocaleString()} {item.base_unit}</td>
                <td className="p-3">{money(item.retail_value)}</td>
                <td className="p-3">{money(item.cost_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>;
}
