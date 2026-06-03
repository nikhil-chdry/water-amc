import { useState, useEffect } from 'react';
import { IndianRupee, Plus, X, Trash2, TrendingUp, TrendingDown, AlertCircle, Wallet, Split } from 'lucide-react';
import { getPayments, createPayment, deletePayment } from '../api';
import { getCustomers } from '../api';
import { useData } from '../context/DataContext';

const typeLabels = {
  customer_payment: { label: 'Customer Payment', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  raw_material:     { label: 'Raw Material',     color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  supplier_due:     { label: 'Supplier Due',      color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
};

const statusStyle = {
  Paid:    'bg-green-500/10 text-green-400 border border-green-500/20',
  Due:     'bg-red-500/10 text-red-400 border border-red-500/20',
  Partial: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
};

const modeIcons = { Cash: '💵', UPI: '📱', 'Bank Transfer': '🏦', Cheque: '📄', Split: '🔀' };

const initialForm = {
  type:        'customer_payment',
  customer:    '',
  amcLinked:   true,
  partyName:   '',
  description: '',
  amount:      '',
  paymentMode: 'Cash',
  isSplit:     false,
  splitPayments: [
    { paymentMode: 'Cash', amount: '', reference: '' },
    { paymentMode: 'UPI',  amount: '', reference: '' },
  ],
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
  const { refresh } = useData();

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

  function handleSplitChange(index, field, value) {
  setForm(prev => {
    const splits = [...prev.splitPayments];
    splits[index] = { ...splits[index], [field]: value };
    const total = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    // For Partial — total amount stays fixed, split = how much paid so far
    // For Paid — total amount auto-updates from split
    const newAmount = prev.status === 'Partial'
      ? prev.amount
      : (total > 0 ? String(total) : prev.amount);

    return { ...prev, splitPayments: splits, amount: newAmount };
  });
}

  function addSplitRow() {
    setForm(prev => ({
      ...prev,
      splitPayments: [...prev.splitPayments, { paymentMode: 'Cash', amount: '', reference: '' }],
    }));
  }

  function removeSplitRow(index) {
    setForm(prev => {
      const splits = prev.splitPayments.filter((_, i) => i !== index);
      const total  = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      return { ...prev, splitPayments: splits, amount: total > 0 ? String(total) : '' };
    });
  }

  // Calculate split total
  const splitTotal = form.splitPayments.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  
  async function handleSubmit() {
  if (!form.date)                                              { alert('Date is required'); return; }
  if (!form.amount || Number(form.amount) <= 0)               { alert('Enter a valid amount'); return; }
  if (form.type === 'customer_payment' && !form.customer)     { alert('Select a customer'); return; }
  if (form.type !== 'customer_payment' && !form.partyName)    { alert('Enter party name'); return; }

  // Split validation — only when not Due
  if (form.status !== 'Due' && form.isSplit) {
    const validSplits = form.splitPayments.filter(s => Number(s.amount) > 0);
    if (validSplits.length < 2) { alert('Add at least 2 split payment modes'); return; }
    if (splitTotal <= 0)        { alert('Total split amount must be greater than 0'); return; }
  }

  // Partial validation
  if (form.status === 'Partial' && !form.isSplit) {
    if (!form.paidAmount || Number(form.paidAmount) <= 0) {
      alert('Enter how much has been paid so far'); return;
    }
    if (Number(form.paidAmount) >= Number(form.amount)) {
      alert('Paid amount must be less than total — use Paid status instead'); return;
    }
  }

  setSaving(true);
  try {
    const validSplits      = form.splitPayments.filter(s => Number(s.amount) > 0);
    const isDue            = form.status === 'Due';
    const isNormalPartial  = form.status === 'Partial' && !form.isSplit;
    const isSplitPartial   = form.status === 'Partial' && form.isSplit;
    const isPaid           = form.status === 'Paid';

    const payload = {
      ...form,
      amount:        Number(form.amount),
      paidAmount:    isDue           ? 0
                   : isNormalPartial ? Number(form.paidAmount)
                   : isSplitPartial  ? splitTotal
                   : Number(form.amount), // Paid in full
      paymentMode: isDue ? 'Pending' : form.isSplit ? 'Split' : form.paymentMode,
      isSplit:       !isDue && form.isSplit,
      splitPayments: !isDue && form.isSplit
        ? validSplits.map(s => ({ ...s, amount: Number(s.amount) }))
        : [],
    };

    if (form.type !== 'customer_payment') {
      payload.customer  = undefined;
      payload.amcLinked = false;
    }

    const res = await createPayment(payload);
    setData(prev => ({ payments: [res.data, ...prev.payments], stats: prev.stats }));
    getPayments().then(r => setData(r.data));
    refresh();
    setShowModal(false);
    setForm(initialForm);
  } catch (err) {
    console.error(err);
    alert('Failed to save. Try again.');
  } finally {
    setSaving(false);
  }
}
  // ────────────────────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await deletePayment(id);
      setData(prev => ({ ...prev, payments: prev.payments.filter(p => p._id !== id) }));
      getPayments().then(r => setData(r.data));
      refresh();
    } catch (err) {
      alert('Failed to delete');
    }
  }

  const filtered = tab === 'all' ? data.payments : data.payments.filter(p => p.type === tab);
  const { stats = {} } = data;

  return (
    <div className="p-4 lg:p-8">

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-green-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-green-400" /><p className="text-xs text-gray-500">Total Collected</p></div>
            <p className="text-2xl font-bold text-green-400">₹{(stats.totalCollected || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><AlertCircle size={16} className="text-red-400" /><p className="text-xs text-gray-500">Customer Dues</p></div>
            <p className="text-2xl font-bold text-red-400">₹{(stats.totalDue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-blue-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><TrendingDown size={16} className="text-blue-400" /><p className="text-xs text-gray-500">Raw Material Spent</p></div>
            <p className="text-2xl font-bold text-blue-400">₹{(stats.totalSpent || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet size={16} className="text-yellow-400" /><p className="text-xs text-gray-500">We Owe Suppliers</p></div>
            <p className="text-2xl font-bold text-yellow-400">₹{(stats.totalOwed || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Payment mode breakdown */}
      {!loading && stats.byMode && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Collections by Payment Mode</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.byMode).map(([mode, amount]) => (
              <div key={mode} className="text-center bg-gray-800 rounded-xl p-3">
                <p className="text-2xl mb-1">{modeIcons[mode]}</p>
                <p className="text-lg font-bold text-white">₹{amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{mode}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all',              label: 'All' },
          { key: 'customer_payment', label: 'Customer' },
          { key: 'raw_material',     label: 'Raw Material' },
          { key: 'supplier_due',     label: 'Supplier Due' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={
              'px-4 py-2 rounded-xl text-sm font-medium border transition whitespace-nowrap ' +
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
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-800 bg-gray-900/50">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Party / Customer</th>
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
                    {p.type === 'customer_payment' ? p.customer?.name || '—' : p.partyName || '—'}
                  </td>
                  <td className="px-5 py-3">
                    {p.isSplit ? (
                      <div>
                        <span className="text-xs text-purple-400 font-medium">🔀 Split</span>
                        <div className="flex flex-col gap-0.5 mt-1">
                          {p.splitPayments?.map((s, i) => (
                            <span key={i} className="text-xs text-gray-500">
                              {modeIcons[s.paymentMode]} {s.paymentMode}: ₹{s.amount?.toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">{modeIcons[p.paymentMode]} {p.paymentMode}</span>
                    )}
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

      {/* Modal */}
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

              {/* Type selector */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Payment Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'customer_payment', label: '👤 Customer',     desc: 'AMC payment received' },
                    { key: 'raw_material',     label: '🔧 Raw Material', desc: 'Parts/material bought' },
                    { key: 'supplier_due',     label: '🏪 Supplier Due', desc: 'We owe this amount' },
                  ].map(t => (
                    <button key={t.key} type="button"
                      onClick={() => setForm(prev => ({ ...prev, type: t.key }))}
                      className={`p-3 rounded-xl border text-left transition ${
                        form.type === t.key ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}>
                      <p className="text-xs font-medium text-white">{t.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer select */}
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
                    <input type="checkbox" name="amcLinked" checked={form.amcLinked} onChange={handleChange} />
                    <span className="text-xs text-gray-400">Link to AMC</span>
                  </label>
                </div>
              )}

              {/* Party name */}
              {form.type !== 'customer_payment' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Supplier / Party Name *</label>
                  <input name="partyName" value={form.partyName} onChange={handleChange}
                    placeholder="e.g. Jaipur Water Parts"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Description</label>
                <input name="description" value={form.description} onChange={handleChange}
                  placeholder="e.g. Annual AMC renewal 2025"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>

              {/* Date + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Date *</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
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

              {/* ── CHANGE 1: Amount + conditional payment mode / split section ── */}

              {/* Amount */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Total Amount (₹) *</label>
                <input type="number" name="amount" value={form.amount} onChange={handleChange}
                  placeholder="e.g. 2500"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>

              {/* Only show payment mode + split when NOT Due */}
              {form.status !== 'Due' && (
                <>
                  {/* Split toggle */}
                  <div className="bg-gray-800 rounded-xl p-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔀</span>
                        <div>
                          <p className="text-sm font-medium text-white">Split Payment</p>
                          <p className="text-xs text-gray-500">Customer paid using multiple modes</p>
                        </div>
                      </div>
                      <div
                        onClick={() => setForm(prev => ({ ...prev, isSplit: !prev.isSplit }))}
                        className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                          form.isSplit ? 'bg-blue-500' : 'bg-gray-600'
                        }`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          form.isSplit ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </div>
                    </label>
                  </div>

                  {/* Normal payment mode */}
                  {!form.isSplit && (
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
                  )}

                  {/* Split rows */}
                  {form.isSplit && (
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">Split Payment Breakdown</label>
                      <div className="space-y-2">
                        {form.splitPayments.map((split, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <select
                              value={split.paymentMode}
                              onChange={e => handleSplitChange(index, 'paymentMode', e.target.value)}
                              className="w-36 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
                              <option>Cash</option>
                              <option>UPI</option>
                              <option>Bank Transfer</option>
                              <option>Cheque</option>
                            </select>
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                              <input type="number"
                                value={split.amount}
                                onChange={e => handleSplitChange(index, 'amount', e.target.value)}
                                placeholder="Amount"
                                className="w-full pl-7 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                            </div>
                            <input
                              value={split.reference}
                              onChange={e => handleSplitChange(index, 'reference', e.target.value)}
                              placeholder="Ref/UPI ID"
                              className="w-28 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                            {form.splitPayments.length > 2 && (
                              <button onClick={() => removeSplitRow(index)}
                                className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <button onClick={addSplitRow}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/20 transition">
                          <Plus size={12} /> Add Mode
                        </button>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total Paid</p>
                          <p className="text-lg font-bold text-white">₹{splitTotal.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Visual split bar */}
                      {splitTotal > 0 && (
                        <div className="mt-3">
                          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                            {form.splitPayments.filter(s => Number(s.amount) > 0).map((s, i) => {
                              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                              return (
                                <div key={i} className={`${colors[i % colors.length]} transition-all`}
                                  style={{ width: `${(Number(s.amount) / splitTotal) * 100}%` }} />
                              );
                            })}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {form.splitPayments.filter(s => Number(s.amount) > 0).map((s, i) => {
                              const colors = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-purple-400'];
                              return (
                                <span key={i} className={`text-xs ${colors[i % colors.length]}`}>
                                  {modeIcons[s.paymentMode]} {s.paymentMode}: ₹{Number(s.amount).toLocaleString()} ({Math.round((Number(s.amount) / splitTotal) * 100)}%)
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Show remaining due if partial + split */}
                      {form.status === 'Partial' && Number(form.amount) > 0 && splitTotal > 0 && (
                        <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Total Amount</span>
                            <span className="text-white font-medium">₹{Number(form.amount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-gray-400">Paid so far (split)</span>
                            <span className="text-green-400 font-medium">₹{splitTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs mt-1 pt-1 border-t border-yellow-500/20">
                            <span className="text-yellow-400 font-medium">Remaining Due</span>
                            <span className="text-yellow-400 font-bold">₹{Math.max(0, Number(form.amount) - splitTotal).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Partial normal — show paid + due breakdown */}
                  {form.status === 'Partial' && !form.isSplit && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Amount Paid So Far (₹)</label>
                      <input type="number" name="paidAmount" value={form.paidAmount} onChange={handleChange}
                        placeholder="How much has been paid"
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                      {Number(form.amount) > 0 && Number(form.paidAmount) > 0 && (
                        <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Total Amount</span>
                            <span className="text-white font-medium">₹{Number(form.amount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-gray-400">Paid so far</span>
                            <span className="text-green-400 font-medium">₹{Number(form.paidAmount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs mt-1 pt-1 border-t border-yellow-500/20">
                            <span className="text-yellow-400 font-medium">Remaining Due</span>
                            <span className="text-yellow-400 font-bold">₹{Math.max(0, Number(form.amount) - Number(form.paidAmount)).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* When Due — show info box instead */}
              {form.status === 'Due' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-xs text-red-400">
                    ⚠️ This payment is marked as <strong>Due</strong> — no payment has been received yet.
                    Payment mode will be recorded when the customer pays.
                  </p>
                </div>
              )}

              {/* ── END CHANGE 1 ── */}

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Notes (optional)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Any additional info..." rows={2}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
              </div>

            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setForm(initialForm); }}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition">
                Cancel
              </button>

              {/* ── CHANGE 3: updated submit button label ── */}
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 disabled:opacity-50 transition">
                {saving
                  ? 'Saving...'
                  : form.status === 'Due'
                    ? `Record Due ₹${Number(form.amount || 0).toLocaleString()}`
                  : form.status === 'Partial'
                    ? `Record Partial ₹${form.isSplit ? splitTotal : Number(form.paidAmount || 0)} / ₹${Number(form.amount || 0).toLocaleString()}`
                  : form.isSplit
                    ? `Record Split ₹${splitTotal.toLocaleString()}`
                  : 'Record Payment'}
              </button>
              {/* ── END CHANGE 3 ── */}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}