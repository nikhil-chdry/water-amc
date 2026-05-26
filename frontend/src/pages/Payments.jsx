import { useState, useEffect } from 'react';
import { IndianRupee, Plus, X, Trash2, TrendingUp, TrendingDown, AlertCircle, Wallet } from 'lucide-react';
import { getPayments, createPayment, deletePayment } from '../api';
import { getCustomers } from '../api';

const typeLabels = {
  customer_payment: { label: 'Customer Payment', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  raw_material:     { label: 'Raw Material',     color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20' },
  supplier_due:     { label: 'Supplier Due',     color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20' },
};

const statusStyle = {
  Paid:    'bg-green-500/10 text-green-400 border border-green-500/20',
  Due:     'bg-red-500/10 text-red-400 border border-red-500/20',
  Partial: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
};

const modeIcons = {
  Cash: '💵', UPI: '📱', 'Bank Transfer': '🏦', Cheque: '📄',
};

const initialForm = {
  type:        'customer_payment',
  customer:    '',
  amcLinked:   true,
  partyName:   '',
  description: '',
  amount:      '',
  paymentMode: 'Cash',
  date:        new Date().toISOString().split('T')[0],
  status:      'Paid',
  paidAmount:  '',
  notes:       '',
  reference:   '',
};

export default function Payments() {
  const [data,      setData]      = useState({ payments: [], stats: {} });
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(initialForm);
  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState('all');

  useEffect(() => {
    Promise.all([getPayments(), getCustomers()])
      .then(([paymentsRes, customersRes]) => {
        setData(paymentsRes.data);
        setCustomers(customersRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit() {
    if (!form.amount || !form.date) { alert('Amount and date are required'); return; }
    if (form.type === 'customer_payment' && !form.customer) { alert('Select a customer'); return; }
    if (form.type !== 'customer_payment' && !form.partyName) { alert('Enter party/supplier name'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        amount:     Number(form.amount),
        paidAmount: Number(form.paidAmount) || Number(form.amount),
      };
      if (form.type !== 'customer_payment') {
        payload.customer   = undefined;
        payload.amcLinked  = false;
      }
      const res = await createPayment(payload);
      setData(prev => ({
        payments: [res.data, ...prev.payments],
        stats: prev.stats,
      }));
      // Refresh to get updated stats
      getPayments().then(r => setData(r.data));
      setShowModal(false);
      setForm(initialForm);
    } catch (err) {
      alert('Failed to save payment. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this payment record?')) return;
    try {
      await deletePayment(id);
      setData(prev => ({
        ...prev,
        payments: prev.payments.filter(p => p._id !== id),
      }));
      getPayments().then(r => setData(r.data));
    } catch (err) {
      alert('Failed to delete');
    }
  }

  const filtered = tab === 'all'
    ? data.payments
    : data.payments.filter(p => p.type === tab);

  const { stats = {} } = data;

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Track all payments, dues and purchases</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-green-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-green-400" />
              <p className="text-xs text-gray-500">Total Collected</p>
            </div>
            <p className="text-2xl font-bold text-green-400">₹{(stats.totalCollected || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-xs text-gray-500">Customer Dues</p>
            </div>
            <p className="text-2xl font-bold text-red-400">₹{(stats.totalDue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-blue-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={16} className="text-blue-400" />
              <p className="text-xs text-gray-500">Raw Material Spent</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">₹{(stats.totalSpent || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={16} className="text-yellow-400" />
              <p className="text-xs text-gray-500">We Owe Suppliers</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">₹{(stats.totalOwed || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Payment mode breakdown */}
      {!loading && stats.byMode && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Collections by Payment Mode</p>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(stats.byMode).map(([mode, amount]) => (
              <div key={mode} className="text-center">
                <p className="text-2xl mb-1">{modeIcons[mode]}</p>
                <p className="text-lg font-bold text-white">₹{amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{mode}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {[
          { key: 'all',              label: 'All' },
          { key: 'customer_payment', label: 'Customer Payments' },
          { key: 'raw_material',     label: 'Raw Materials' },
          { key: 'supplier_due',     label: 'Supplier Dues' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={
              'px-4 py-2 rounded-xl text-sm font-medium border transition ' +
              (tab === t.key
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600')
            }>
            {t.label} ({t.key === 'all' ? data.payments.length : data.payments.filter(p => p.type === t.key).length})
          </button>
        ))}
      </div>

      {/* Payments list */}
      {loading ? (
        <p className="text-gray-500 text-sm text-center py-20">Loading payments...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <IndianRupee size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No payments recorded yet.</p>
          <button onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition">
            Record First Payment
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-800 bg-gray-900/50">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Party / Customer</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Mode</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20 transition">
                  <td className="px-5 py-3 text-gray-400 text-xs">{p.date?.split('T')[0]}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${typeLabels[p.type]?.bg}`}>
                      {typeLabels[p.type]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-white">
                    {p.type === 'customer_payment'
                      ? p.customer?.name || '—'
                      : p.partyName || '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">
                    {p.description || p.notes || '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {modeIcons[p.paymentMode]} {p.paymentMode}
                  </td>
                  <td className="px-5 py-3 font-semibold text-white">
                    ₹{p.amount?.toLocaleString()}
                    {p.status === 'Partial' && (
                      <span className="text-xs text-gray-500 block">Paid: ₹{p.paidAmount?.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(p._id)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ zIndex: 9999 }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Record Payment</h2>
              <button onClick={() => { setShowModal(false); setForm(initialForm); }}
                className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">

              {/* Payment Type */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Payment Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'customer_payment', label: '👤 Customer', desc: 'AMC payment received' },
                    { key: 'raw_material',     label: '🔧 Raw Material', desc: 'Parts/material bought' },
                    { key: 'supplier_due',     label: '🏪 Supplier Due', desc: 'We owe this amount' },
                  ].map(t => (
                    <button key={t.key} type="button"
                      onClick={() => setForm(prev => ({ ...prev, type: t.key }))}
                      className={`p-3 rounded-xl border text-left transition ${
                        form.type === t.key
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}>
                      <p className="text-xs font-medium text-white">{t.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer select — only for customer_payment */}
              {form.type === 'customer_payment' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Customer *</label>
                  <select name="customer" value={form.customer} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
                    <option value="" disabled>Select customer...</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} — {c.productType}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" name="amcLinked" checked={form.amcLinked} onChange={handleChange}
                      className="rounded" />
                    <span className="text-xs text-gray-400">Link to AMC (auto-update AMC status)</span>
                  </label>
                </div>
              )}

              {/* Party name — for raw_material & supplier_due */}
              {form.type !== 'customer_payment' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">
                    {form.type === 'raw_material' ? 'Supplier / Shop Name *' : 'Supplier Name *'}
                  </label>
                  <input name="partyName" value={form.partyName} onChange={handleChange}
                    placeholder="e.g. Jaipur Water Parts Supplier"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Description</label>
                <input name="description" value={form.description} onChange={handleChange}
                  placeholder={
                    form.type === 'customer_payment' ? 'e.g. Annual AMC renewal 2025' :
                    form.type === 'raw_material'     ? 'e.g. Filter membranes x10, pipes' :
                    'e.g. Pending payment for last order'
                  }
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Amount */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Amount (₹) *</label>
                  <input type="number" name="amount" value={form.amount} onChange={handleChange}
                    placeholder="e.g. 2500"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Date *</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Payment Mode */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Payment Mode</label>
                  <select name="paymentMode" value={form.paymentMode} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Status</label>
                  <select name="status" value={form.status} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
                    <option>Paid</option>
                    <option>Due</option>
                    <option>Partial</option>
                  </select>
                </div>
              </div>

              {/* Partial amount */}
              {form.status === 'Partial' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Amount Paid So Far (₹)</label>
                  <input type="number" name="paidAmount" value={form.paidAmount} onChange={handleChange}
                    placeholder="How much has been paid"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
              )}

              {/* Reference */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Reference No. (optional)</label>
                <input name="reference" value={form.reference} onChange={handleChange}
                  placeholder="UPI transaction ID / Cheque no."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Notes (optional)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Any additional info..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
              </div>

            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setForm(initialForm); }}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 disabled:opacity-50 transition">
                {saving ? 'Saving...' : 'Record Payment'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}