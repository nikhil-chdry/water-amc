import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, CheckCircle, AlertTriangle, XCircle, IndianRupee, Wrench } from 'lucide-react';
import { getCustomers, getPayments } from '../api';

const statusStyle = {
  active:   'bg-green-500/10 text-green-400 border border-green-500/20',
  expiring: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  expired:  'bg-red-500/10 text-red-400 border border-red-500/20',
};

export default function Dashboard() {
  const [customers,  setCustomers]  = useState([]);
  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const location = useLocation();
  const [serviceRevenue, setServiceRevenue] = useState(0);

  // Refetch every time user visits this page
useEffect(() => {
  setLoading(true);
  Promise.all([getCustomers(), getPayments()])
    .then(([custRes, payRes]) => {
      setCustomers(custRes.data);
      setPayments(payRes.data.payments || []);
      setServiceRevenue(payRes.data.stats?.serviceRevenue || 0);
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
}, [location.key]); // ← location.key changes every time you navigate here

  const total    = customers.length;
  const active   = customers.filter(c => c.amc?.status === 'active').length;
  const expiring = customers.filter(c => c.amc?.status === 'expiring').length;
  const expired  = customers.filter(c => c.amc?.status === 'expired').length;
  const urgent = customers.filter(c =>
  c.amc?.status === 'expiring' || c.amc?.status === 'expired'
);

  // Revenue from actual payments recorded
  const totalRevenue = payments
    .filter(p => p.type === 'customer_payment' && p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  // Payment mode breakdown
  const byMode = {
    Cash:            payments.filter(p => p.type === 'customer_payment' && p.status === 'Paid' && p.paymentMode === 'Cash').reduce((s, p) => s + p.amount, 0),
    UPI:             payments.filter(p => p.type === 'customer_payment' && p.status === 'Paid' && p.paymentMode === 'UPI').reduce((s, p) => s + p.amount, 0),
    'Bank Transfer': payments.filter(p => p.type === 'customer_payment' && p.status === 'Paid' && p.paymentMode === 'Bank Transfer').reduce((s, p) => s + p.amount, 0),
    Cheque:          payments.filter(p => p.type === 'customer_payment' && p.status === 'Paid' && p.paymentMode === 'Cheque').reduce((s, p) => s + p.amount, 0),
  };

  const totalDue = payments
    .filter(p => p.type === 'customer_payment' && p.status === 'Due')
    .reduce((sum, p) => sum + p.amount, 0);

  const statCards = [
    { label: 'Total Customers', value: total,    icon: Users,         color: 'bg-blue-500/10 text-blue-400',     border: 'border-blue-500/20' },
    { label: 'Active AMCs',     value: active,   icon: CheckCircle,   color: 'bg-green-500/10 text-green-400',   border: 'border-green-500/20' },
    { label: 'Expiring Soon',   value: expiring, icon: AlertTriangle, color: 'bg-yellow-500/10 text-yellow-400', border: 'border-yellow-500/20' },
    { label: 'Expired AMCs',    value: expired,  icon: XCircle,       color: 'bg-red-500/10 text-red-400',       border: 'border-red-500/20' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 text-sm">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-300 mt-1">Here's your business overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={'bg-gray-700 rounded-2xl border p-5 ' + border}>
            <div className={'w-10 h-10 rounded-xl flex items-center justify-center mb-4 ' + color}>
              <Icon size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-sm text-white mt-1">{label}</p>
          </div>
        ))}
      </div>

     {/* Revenue + Service + Dues */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
  <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 flex items-center justify-between">
    <div>
      <p className="text-blue-100 text-sm font-medium">AMC Collected</p>
      <p className="text-3xl font-bold text-white mt-1">₹{totalRevenue.toLocaleString()}</p>
      <p className="text-blue-200 text-xs mt-1">From payments</p>
    </div>
    <div className="bg-white/10 p-3 rounded-xl">
      <IndianRupee size={28} className="text-white" />
    </div>
  </div>
  <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-5 flex items-center justify-between">
    <div>
      <p className="text-purple-100 text-sm font-medium">Service Revenue</p>
      <p className="text-3xl font-bold text-white mt-1">₹{serviceRevenue.toLocaleString()}</p>
      <p className="text-purple-200 text-xs mt-1">From service visits</p>
    </div>
    <div className="bg-white/10 p-3 rounded-xl">
      <Wrench size={28} className="text-white" />
    </div>
  </div>
  <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-5 flex items-center justify-between">
    <div>
      <p className="text-red-100 text-sm font-medium">Total Dues</p>
      <p className="text-3xl font-bold text-white mt-1">₹{totalDue.toLocaleString()}</p>
      <p className="text-red-200 text-xs mt-1">Pending from customers</p>
    </div>
    <div className="bg-white/10 p-3 rounded-xl">
      <IndianRupee size={28} className="text-white" />
    </div>
  </div>
</div>

      {/* Payment mode breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Collections by Payment Mode</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(byMode).map(([mode, amount]) => (
            <div key={mode} className="text-center bg-gray-800 rounded-xl p-3">
              <p className="text-lg mb-1">
                {mode === 'Cash' ? '💵' : mode === 'UPI' ? '📱' : mode === 'Bank Transfer' ? '🏦' : '📄'}
              </p>
              <p className="text-lg font-bold text-white">₹{amount.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{mode}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Needs attention */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-white mb-5">⚠️ Needs Attention ({urgent.length})</h2>
        {urgent.length === 0 ? (
          <p className="text-sm text-gray-500">All AMCs are active. Great job! 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white border-b border-gray-800">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Phone</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Product</th>
                  <th className="pb-3 font-medium">AMC Ends</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {urgent.map(c => (
                  <tr key={c._id} className="border-b border-gray-800/50 last:border-0">
                    <td className="py-3 font-medium text-red-400 bg-gray-500/10">{c.name}</td>
                    <td className="py-3 text-white bg-gray-500/10 hidden sm:table-cell">{c.phone}</td>
                    <td className="py-3 text-white bg-gray-500/10 hidden md:table-cell">{c.productType}</td>
                    <td className="py-3 text-white bg-gray-500/10">{c.amc?.endDate?.split('T')[0]}</td>
                    <td className="py-3 bg-gray-500/10">
                      <span className={'px-2.5 py-1 rounded-full text-xs font-medium ' + statusStyle[c.amc?.status]}>
                        {c.amc?.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}