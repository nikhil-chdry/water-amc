import { createCustomer } from '../api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Package, Calendar, IndianRupee, CheckCircle, Plus, X } from 'lucide-react';
import { useData } from '../context/DataContext';

const productTypes = [
  'RO Filter',
  'Water Cooler',
  'Plant (1-5k L)',
  'Plant (6-10k L)',
  'Water Dispenser',
  'softener plant',
  'DM Plant',
  'ETP Plant',
  'Other',
];

const modeIcons = { Cash: '💵', UPI: '📱', 'Bank Transfer': '🏦', Cheque: '📄' };

const initialForm = {
  name:        '',
  phone:       '',
  address:     '',
  productType: '',
  installDate: '',
  hasAMC:      true,

  // Installation payment — for ALL customers
  installAmount:       '',
  installPaymentMode:  'Cash',
  installStatus:       'Paid',
  installPaidAmount:   '',
  installIsSplit:      false,
  installSplitPayments: [
    { paymentMode: 'Cash', amount: '', reference: '' },
    { paymentMode: 'UPI',  amount: '', reference: '' },
  ],

  // AMC payment — only if hasAMC
  amcStart:    '',
  amcEnd:      '',
  amcAmount:   '',
  amcEmail:    '',
  paymentMode: 'Cash',
  isSplit:     false,
  splitPayments: [
    { paymentMode: 'Cash', amount: '', reference: '' },
    { paymentMode: 'UPI',  amount: '', reference: '' },
  ],
  notes: '',
};

export default function AddCustomer() {
  const navigate = useNavigate();
  const [form,      setForm]      = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors,    setErrors]    = useState({});
  const { refresh } = useData();

  // Derived: split total
  const splitTotal = form.splitPayments.reduce(
    (sum, s) => sum + (Number(s.amount) || 0), 0
  );
  const installSplitTotal = form.installSplitPayments.reduce(
  (sum, s) => sum + (Number(s.amount) || 0), 0
);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'amcStart' && value) {
        const end = new Date(value);
        end.setFullYear(end.getFullYear() + 1);
        updated.amcEnd = end.toISOString().split('T')[0];
      }
      return updated;
    });
    setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function handleSplitChange(index, field, value) {
    setForm(prev => {
      const splits = [...prev.splitPayments];
      splits[index] = { ...splits[index], [field]: value };
      const total = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      return { ...prev, splitPayments: splits, amcAmount: total > 0 ? String(total) : prev.amcAmount };
    });
    setErrors(prev => ({ ...prev, amcAmount: '' }));
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
      return { ...prev, splitPayments: splits, amcAmount: total > 0 ? String(total) : '' };
    });
  }

  function handleInstallSplitChange(index, field, value) {
  setForm(prev => {
    const splits = [...prev.installSplitPayments];
    splits[index] = { ...splits[index], [field]: value };
    const total = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    return { ...prev, installSplitPayments: splits, installAmount: total > 0 ? String(total) : prev.installAmount };
  });
}

function addInstallSplitRow() {
  setForm(prev => ({
    ...prev,
    installSplitPayments: [...prev.installSplitPayments, { paymentMode: 'Cash', amount: '', reference: '' }],
  }));
}

function removeInstallSplitRow(index) {
  setForm(prev => {
    const splits = prev.installSplitPayments.filter((_, i) => i !== index);
    const total  = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    return { ...prev, installSplitPayments: splits, installAmount: total > 0 ? String(total) : '' };
  });
}

  // ─── Validation ───────────────────────────────────────────────────────────
function validate() {
  const e = {};
  if (!form.name.trim())    e.name        = 'Customer name is required';
  if (!form.phone.trim())   e.phone       = 'Phone number is required';
  else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit number';
  if (!form.address.trim()) e.address     = 'Address is required';
  if (!form.productType)    e.productType = 'Select a product type';

  // Installation amount — required for ALL customers
  if (form.installStatus !== 'Due') {
    if (form.installIsSplit) {
      const validSplits = form.installSplitPayments.filter(s => Number(s.amount) > 0);
      if (validSplits.length < 2) e.installAmount = 'Add at least 2 split modes';
    } else {
      if (!form.installAmount) e.installAmount = 'Installation amount is required';
    }
  } else {
    if (!form.installAmount) e.installAmount = 'Installation amount is required';
  }

  // AMC fields — only if hasAMC
  if (form.hasAMC) {
    if (!form.amcStart) e.amcStart = 'AMC start date is required';
    if (form.isSplit) {
      const validSplits = form.splitPayments.filter(s => Number(s.amount) > 0);
      if (validSplits.length < 2) e.amcAmount = 'Add at least 2 split payment modes';
      else if (splitTotal <= 0)   e.amcAmount = 'Total split amount must be greater than 0';
    } else {
      if (!form.amcAmount) e.amcAmount = 'AMC amount is required';
    }
  }

  return e;
}

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
  const e = validate();
  if (Object.keys(e).length > 0) { setErrors(e); return; }

  try {
    const validSplits        = form.splitPayments.filter(s => Number(s.amount) > 0);
    const validInstallSplits = form.installSplitPayments.filter(s => Number(s.amount) > 0);

    await createCustomer({
      name:        form.name,
      phone:       form.phone,
      address:     form.address,
      productType: form.productType,
      installDate: form.installDate || undefined,
      hasAMC:      form.hasAMC,
      notes:       form.notes,

      // Installation payment — ALWAYS sent
      installationPayment: {
        amount:        form.installIsSplit ? installSplitTotal : Number(form.installAmount),
        paymentMode:   form.installStatus === 'Due' ? 'Pending'
                     : form.installIsSplit ? 'Split'
                     : form.installPaymentMode,
        status:        form.installStatus,
        paidAmount:    form.installStatus === 'Due'     ? 0
                     : form.installStatus === 'Partial' ? Number(form.installPaidAmount)
                     : form.installIsSplit ? installSplitTotal
                     : Number(form.installAmount),
        isSplit:       form.installStatus !== 'Due' && form.installIsSplit,
        splitPayments: form.installStatus !== 'Due' && form.installIsSplit
          ? validInstallSplits.map(s => ({ ...s, amount: Number(s.amount) }))
          : [],
      },

      // AMC — only if hasAMC
      amc: form.hasAMC ? {
        startDate:     form.amcStart,
        endDate:       form.amcEnd,
        amount:        form.isSplit ? splitTotal : Number(form.amcAmount),
        paymentMode:   form.isSplit ? 'Split' : form.paymentMode,
        email:         form.amcEmail,
        isSplit:       form.isSplit,
        splitPayments: form.isSplit
          ? validSplits.map(s => ({ ...s, amount: Number(s.amount) }))
          : [],
      } : { status: 'no_amc' },
    });

    refresh();
    setSubmitted(true);
  } catch (err) {
    console.error(err);
    alert('Something went wrong. Make sure backend is running.');
  }
}
  // ─── Success screen ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-16 text-center">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Customer Added!</h2>
        <p className="text-gray-500 text-sm mb-6">
          {form.name} has been added successfully.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setForm(initialForm); setSubmitted(false); }}
            className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition"
          >
            Add Another
          </button>
          <button
            onClick={() => navigate('/customers')}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition"
          >
            View Customers
          </button>
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-2xl">

      {/* Header */}
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition"
      >
        <ArrowLeft size={16} /> Back to Customers
      </button>
      <h1 className="text-2xl font-bold text-white mb-1">Add New Customer</h1>
      <p className="text-sm text-gray-500 mb-8">Fill in the details to register a new customer.</p>

      <div className="space-y-6">

        {/* Section 1 — Personal Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Personal Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">

            <div className="col-span-2 md:col-span-1">
              <label className="text-xs text-gray-500 mb-1.5 block">Full Name *</label>
              <input
                name="name" value={form.name} onChange={handleChange}
                placeholder="e.g. Ramesh Sharma"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="text-xs text-gray-500 mb-1.5 block">Phone Number *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  name="phone" value={form.phone} onChange={handleChange}
                  placeholder="10-digit mobile number" maxLength={10}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1.5 block">Address *</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-500" />
                <textarea
                  name="address" value={form.address} onChange={handleChange}
                  placeholder="Full address with area and city" rows={2}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            </div>

          </div>
        </div>

        {/* Section 2 — Product Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Package size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Product Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Product Type *</label>
              <select
                name="productType" value={form.productType} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>Select product...</option>
                {productTypes.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.productType && <p className="text-red-400 text-xs mt-1">{errors.productType}</p>}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Installation Date *</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="date" name="installDate" value={form.installDate} onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              {errors.installDate && <p className="text-red-400 text-xs mt-1">{errors.installDate}</p>}
            </div>

          </div>
        </div>

        {/* Section 3 — Installation Payment (ALWAYS shown) */}
<div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
  <div className="flex items-center gap-2 mb-5">
    <IndianRupee size={16} className="text-blue-400" />
    <h2 className="text-sm font-semibold text-white">Installation Payment</h2>
    <span className="text-xs text-gray-500 ml-auto">Charged for every customer</span>
  </div>
  <div className="space-y-4">

    {/* Amount + Status */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Installation Amount (₹) *</label>
        <div className="relative">
          <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="number"
            value={form.installAmount}
            onChange={e => setForm(prev => ({ ...prev, installAmount: e.target.value }))}
            placeholder="e.g. 15000"
            disabled={form.installIsSplit}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-40"
          />
          {errors.installAmount && <p className="text-red-400 text-xs mt-1">{errors.installAmount}</p>}
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Payment Status</label>
        <select
          value={form.installStatus}
          onChange={e => setForm(prev => ({ ...prev, installStatus: e.target.value }))}
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
          <option>Paid</option>
          <option>Due</option>
          <option>Partial</option>
        </select>
      </div>
    </div>

    {/* Payment mode — hide if Due */}
    {form.installStatus !== 'Due' && (
      <>
        {/* Split toggle */}
        <div className="bg-gray-800 rounded-xl p-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔀</span>
              <div>
                <p className="text-sm font-medium text-white">Split Payment</p>
                <p className="text-xs text-gray-500">Paid using multiple modes</p>
              </div>
            </div>
            <div
              onClick={() => setForm(prev => ({ ...prev, installIsSplit: !prev.installIsSplit }))}
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                form.installIsSplit ? 'bg-blue-500' : 'bg-gray-600'
              }`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                form.installIsSplit ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
          </label>
        </div>

        {/* Normal mode */}
        {!form.installIsSplit && (
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Payment Mode</label>
            <select
              value={form.installPaymentMode}
              onChange={e => setForm(prev => ({ ...prev, installPaymentMode: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
              <option>Cash</option>
              <option>UPI</option>
              <option>Bank Transfer</option>
              <option>Cheque</option>
            </select>
          </div>
        )}

        {/* Split rows */}
        {form.installIsSplit && (
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Split Breakdown</label>
            <div className="space-y-2">
              {form.installSplitPayments.map((split, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={split.paymentMode}
                    onChange={e => handleInstallSplitChange(index, 'paymentMode', e.target.value)}
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
                      onChange={e => handleInstallSplitChange(index, 'amount', e.target.value)}
                      placeholder="Amount"
                      className="w-full pl-7 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                  </div>
                  <input
                    value={split.reference}
                    onChange={e => handleInstallSplitChange(index, 'reference', e.target.value)}
                    placeholder="Ref/UPI ID"
                    className="w-28 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                  {form.installSplitPayments.length > 2 && (
                    <button onClick={() => removeInstallSplitRow(index)}
                      className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={addInstallSplitRow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/20 transition">
                <Plus size={12} /> Add Mode
              </button>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-white">₹{installSplitTotal.toLocaleString()}</p>
              </div>
            </div>
            {/* Visual bar */}
            {installSplitTotal > 0 && (
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mt-2">
                {form.installSplitPayments.filter(s => Number(s.amount) > 0).map((s, i) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                  return (
                    <div key={i} className={`${colors[i % colors.length]}`}
                      style={{ width: `${(Number(s.amount) / installSplitTotal) * 100}%` }} />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Partial */}
        {form.installStatus === 'Partial' && !form.installIsSplit && (
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Amount Paid So Far (₹)</label>
            <input type="number"
              value={form.installPaidAmount}
              onChange={e => setForm(prev => ({ ...prev, installPaidAmount: e.target.value }))}
              placeholder="How much paid"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            {Number(form.installAmount) > 0 && Number(form.installPaidAmount) > 0 && (
              <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex justify-between text-xs">
                <span className="text-gray-400">Remaining Due</span>
                <span className="text-yellow-400 font-bold">
                  ₹{Math.max(0, Number(form.installAmount) - Number(form.installPaidAmount)).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </>
    )}

    {/* Due info */}
    {form.installStatus === 'Due' && (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
        <p className="text-xs text-red-400">⚠️ Installation payment marked as Due.</p>
      </div>
    )}
  </div>
</div>


{/* Section 4 — AMC Details (only if hasAMC) */}
 
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

          {/* Header + AMC toggle */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <IndianRupee size={16} className="text-green-400" />
              <h2 className="text-sm font-semibold text-white">AMC Details</h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-gray-400">Has AMC?</span>
              <div
                onClick={() => setForm(prev => ({ ...prev, hasAMC: !prev.hasAMC }))}
                className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${
                  form.hasAMC ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  form.hasAMC ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </label>
          </div>

          {/* AMC fields — only when hasAMC is true */}
          {form.hasAMC ? (
            <div className="grid grid-cols-2 gap-4">

              {/* Dates */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">AMC Start Date *</label>
                <input
                  type="date" name="amcStart" value={form.amcStart} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
                {errors.amcStart && <p className="text-red-400 text-xs mt-1">{errors.amcStart}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">AMC End Date</label>
                <input
                  type="date" name="amcEnd" value={form.amcEnd} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">Auto-set to 1 year after start</p>
              </div>

              {/* Amount + Mode (disabled when split on) */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">AMC Amount (₹) *</label>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="number" name="amcAmount" value={form.amcAmount}
                    onChange={handleChange} placeholder="e.g. 2500"
                    disabled={form.isSplit}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
                {errors.amcAmount && <p className="text-red-400 text-xs mt-1">{errors.amcAmount}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Payment Mode</label>
                <select
                  name="paymentMode" value={form.paymentMode} onChange={handleChange}
                  disabled={form.isSplit}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>

              {/* Split toggle */}
              <div className="col-span-2">
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
              </div>

              {/* Split rows */}
              {form.isSplit && (
                <div className="col-span-2">
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
                          <input
                            type="number"
                            value={split.amount}
                            onChange={e => handleSplitChange(index, 'amount', e.target.value)}
                            placeholder="Amount"
                            className="w-full pl-7 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <input
                          value={split.reference}
                          onChange={e => handleSplitChange(index, 'reference', e.target.value)}
                          placeholder="Ref/UPI ID"
                          className="w-28 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
                        />
                        {form.splitPayments.length > 2 && (
                          <button
                            onClick={() => removeSplitRow(index)}
                            className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add row + total */}
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={addSplitRow}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/20 transition">
                      <Plus size={12} /> Add Mode
                    </button>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total Amount</p>
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
                            <div
                              key={i}
                              className={`${colors[i % colors.length]} transition-all`}
                              style={{ width: `${(Number(s.amount) / splitTotal) * 100}%` }}
                              title={`${s.paymentMode}: ₹${s.amount}`}
                            />
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
                </div>
              )}

              {/* Email */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1.5 block">Customer Email (for reminders)</label>
                <input
                  name="amcEmail" type="email" value={form.amcEmail} onChange={handleChange}
                  placeholder="customer@email.com"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400">No AMC for this customer.</p>
              <p className="text-xs text-gray-600 mt-1">
                Only installation recorded — no service contract.
              </p>
            </div>
          )}

        </div>



      
        {/* Notes */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <label className="text-xs text-gray-500 mb-1.5 block">Notes (optional)</label>
          <textarea
            name="notes" value={form.notes} onChange={handleChange}
            placeholder="Any extra info — e.g. special filter model, access instructions..."
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => navigate('/customers')}
            className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition"
          >
            {form.isSplit ? `Add Customer — ₹${splitTotal.toLocaleString()} Split` : 'Add Customer'}
          </button>
        </div>

      </div>
    </div>
  );
}