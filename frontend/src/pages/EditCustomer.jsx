import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, MapPin, Package,
  Calendar, IndianRupee, CheckCircle, Plus, X,
} from 'lucide-react';
import { getCustomer, updateCustomer } from '../api';
import { useData } from '../context/DataContext';

const productTypes = [
  'RO Filter',
  'Water Cooler',
  'Plant (1-5k L)',
  'Plant (6-10k L)',
  'Water Dispenser',
  'Softener Plant',
  'DM Plant',
  'ETP Plant',
  'Other',
];

const modeIcons = { Cash: '💵', UPI: '📱', 'Bank Transfer': '🏦', Cheque: '📄' };

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refresh } = useData();

  const [form,    setForm]    = useState(null);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(true);
  const [saved,   setSaved]   = useState(false);

  // Derived split totals
  const splitTotal = form?.splitPayments?.reduce(
    (sum, s) => sum + (Number(s.amount) || 0), 0
  ) || 0;

  useEffect(() => {
    getCustomer(id)
      .then(res => {
        const c = res.data;
        setForm({
          name:        c.name,
          phone:       c.phone,
          address:     c.address,
          productType: c.productType,
          installDate: c.installDate?.split('T')[0] || '',
          hasAMC:      c.hasAMC !== false,
          notes:       c.notes || '',

          // AMC fields
          amcStart:    c.amc?.startDate?.split('T')[0] || '',
          amcEnd:      c.amc?.endDate?.split('T')[0]   || '',
          amcAmount:   c.amc?.amount   || '',
          amcEmail:    c.amc?.email    || '',
          paymentMode: c.amc?.paymentMode === 'Split' ? 'Cash' : (c.amc?.paymentMode || 'Cash'),
          isSplit:     c.amc?.isSplit  || false,
          splitPayments: c.amc?.splitPayments?.length
            ? c.amc.splitPayments
            : [
                { paymentMode: 'Cash', amount: '', reference: '' },
                { paymentMode: 'UPI',  amount: '', reference: '' },
              ],
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

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

  function validate() {
    const e = {};
    if (!form.name.trim())    e.name        = 'Name is required';
    if (!form.phone.trim())   e.phone       = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter valid 10-digit number';
    if (!form.address.trim()) e.address     = 'Address is required';
    if (!form.productType)    e.productType = 'Select a product type';

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

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    try {
      const validSplits = form.splitPayments.filter(s => Number(s.amount) > 0);
      await updateCustomer(id, {
        name:        form.name,
        phone:       form.phone,
        address:     form.address,
        productType: form.productType,
        installDate: form.installDate || undefined,
        hasAMC:      form.hasAMC,
        notes:       form.notes,
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
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Try again.');
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 text-sm">Loading customer...</p>
    </div>
  );

  if (saved) return (
    <div className="p-8 max-w-lg mx-auto mt-16 text-center">
      <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Customer Updated!</h2>
      <p className="text-gray-500 text-sm mb-6">{form.name} has been updated successfully.</p>
      <button onClick={() => navigate('/customers')}
        className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition">
        View Customers
      </button>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-2xl">

      <button onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition">
        <ArrowLeft size={16} /> Back to Customers
      </button>
      <h1 className="text-2xl font-bold text-white mb-1">Edit Customer</h1>
      <p className="text-sm text-gray-500 mb-8">Update the customer details below.</p>

      <div className="space-y-6">

        {/* Section 1 — Personal Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Personal Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="e.g. Ramesh Sharma"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Phone Number *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input name="phone" value={form.phone} onChange={handleChange} maxLength={10}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1.5 block">Address *</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-500" />
                <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
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
              <select name="productType" value={form.productType} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
                {productTypes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.productType && <p className="text-red-400 text-xs mt-1">{errors.productType}</p>}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Installation Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="date" name="installDate" value={form.installDate} onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

          </div>
        </div>

        {/* Section 3 — AMC Details with toggle */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <IndianRupee size={16} className="text-green-400" />
              <h2 className="text-sm font-semibold text-white">AMC Details</h2>
            </div>
            {/* AMC Toggle */}
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

          {form.hasAMC ? (
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">AMC Start Date *</label>
                <input type="date" name="amcStart" value={form.amcStart} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
                {errors.amcStart && <p className="text-red-400 text-xs mt-1">{errors.amcStart}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">AMC End Date</label>
                <input type="date" name="amcEnd" value={form.amcEnd} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
                <p className="text-xs text-gray-600 mt-1">Auto-set to 1 year after start</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">AMC Amount (₹) *</label>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="number" name="amcAmount" value={form.amcAmount} onChange={handleChange}
                    placeholder="e.g. 2500"
                    disabled={form.isSplit}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-40" />
                </div>
                {errors.amcAmount && <p className="text-red-400 text-xs mt-1">{errors.amcAmount}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Payment Mode</label>
                <select name="paymentMode" value={form.paymentMode} onChange={handleChange}
                  disabled={form.isSplit}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-40">
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
                        <p className="text-xs text-gray-500">Paid using multiple modes</p>
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
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-lg font-bold text-white">₹{splitTotal.toLocaleString()}</p>
                    </div>
                  </div>
                  {splitTotal > 0 && (
                    <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mt-2">
                      {form.splitPayments.filter(s => Number(s.amount) > 0).map((s, i) => {
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                        return (
                          <div key={i} className={colors[i % colors.length]}
                            style={{ width: `${(Number(s.amount) / splitTotal) * 100}%` }} />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1.5 block">Customer Email (for reminders)</label>
                <input name="amcEmail" type="email" value={form.amcEmail} onChange={handleChange}
                  placeholder="customer@email.com"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>

            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400">No AMC for this customer.</p>
              <p className="text-xs text-gray-600 mt-1">Only installation charge applies.</p>
            </div>
          )}
        </div>

        {/* Section 4 — Notes */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <label className="text-xs text-gray-500 mb-1.5 block">Notes (optional)</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="Any extra info..."
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pb-8">
          <button onClick={() => navigate('/customers')}
            className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition">
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}