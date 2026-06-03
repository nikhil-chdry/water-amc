import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  Users, TrendingUp, TrendingDown, Wrench,
  CheckCircle, AlertTriangle, XCircle, IndianRupee,
} from 'lucide-react';
import { getReports } from '../api';
import { useData } from '../context/DataContext';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const { refreshKey } = useData();

  useEffect(() => {
    getReports()
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 text-sm">Loading reports...</p>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-red-400 text-sm">Failed to load reports.</p>
    </div>
  );

  const { customers, visits, financials, charts } = data;

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Full business overview — real data from your database</p>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Collected',  value: `₹${financials.totalCollected.toLocaleString()}`,  color: 'border-green-500/20',  text: 'text-green-400',  icon: TrendingUp },
          { label: 'Customer Dues',    value: `₹${financials.totalDue.toLocaleString()}`,         color: 'border-red-500/20',    text: 'text-red-400',    icon: AlertTriangle },
          { label: 'Total Spent',      value: `₹${financials.totalSpent.toLocaleString()}`,       color: 'border-blue-500/20',   text: 'text-blue-400',   icon: TrendingDown },
          { label: 'We Owe Suppliers', value: `₹${financials.totalOwed.toLocaleString()}`,        color: 'border-yellow-500/20', text: 'text-yellow-400', icon: AlertTriangle },
          { label: 'Net Profit',       value: `₹${financials.netProfit.toLocaleString()}`,        color: financials.netProfit >= 0 ? 'border-green-500/20' : 'border-red-500/20', text: financials.netProfit >= 0 ? 'text-green-400' : 'text-red-400', icon: IndianRupee },
        ].map(({ label, value, color, text, icon: Icon }) => (
          <div key={label} className={`bg-gray-900 border ${color} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={text} />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className={`text-xl font-bold ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Customer & Visit stats */}
      <div className="grid grid-col-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-blue-400" />
            <p className="text-sm font-semibold text-white">Customer Overview</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Total Customers</span>
              <span className="text-sm font-bold text-white">{customers.totalCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={11} /> Active AMC</span>
              <span className="text-sm font-bold text-green-400">{customers.activeAMC}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-xs text-yellow-400"><AlertTriangle size={11} /> Expiring</span>
              <span className="text-sm font-bold text-yellow-400">{customers.expiringAMC}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-xs text-red-400"><XCircle size={11} /> Expired</span>
              <span className="text-sm font-bold text-red-400">{customers.expiredAMC}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wrench size={16} className="text-purple-400" />
            <p className="text-sm font-semibold text-white">Service Visits</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Total Visits</span>
              <span className="text-sm font-bold text-white">{visits.totalVisits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-yellow-400">Pending</span>
              <span className="text-sm font-bold text-yellow-400">{visits.pendingVisits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-green-400">Resolved</span>
              <span className="text-sm font-bold text-green-400">{visits.resolvedVisits}</span>
            </div>
          </div>
        </div>

        {/* AMC Status Pie Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-4">AMC Status Split</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={charts.amcStatusData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
              >
                {charts.amcStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={value => <span style={{ color: '#9ca3af', fontSize: '11px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <p className="text-sm font-semibold text-white mb-5">Monthly Revenue (Last 6 Months)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={charts.revenueData} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]}
              label={{ position: 'top', fill: '#6b7280', fontSize: 10,
                formatter: v => v > 0 ? `₹${(v/1000).toFixed(1)}k` : '' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-col-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Monthly Service Visits Line Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-5">Monthly Service Visits</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={charts.visitsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6"
                strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Mode Pie Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-5">Collections by Mode</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={charts.modeData} cx="50%" cy="50%"
                outerRadius={70} paddingAngle={3} dataKey="value"
                label={({ name, value }) => value > 0 ? `${name}: ₹${(value/1000).toFixed(1)}k` : ''}
                labelLine={false}>
                {charts.modeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={v => [`₹${v.toLocaleString()}`, 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Product Type Breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-5">Customers by Product Type</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={charts.productData} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 12 }} width={120} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {charts.productData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}