import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Package, Calendar, IndianRupee, CheckCircle } from 'lucide-react';
import { getCustomer, updateCustomer } from '../api';

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

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm]       = useState(null);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved]     = useState(false);

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
          notes:       c.notes || '',
          amcStart:    c.amc?.startDate?.split('T')[0] || '',
          amcEnd:      c.amc?.endDate?.split('T')[0] || '',
          amcAmount:   c.amc?.amount || '',
          amcEmail:    c.amc?.email || '',
          paymentMode: c.amc?.paymentMode || 'Cash',
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

  function validate() {
    const e = {};
    if (!form.name.trim())    e.name        = 'Name is required';
    if (!form.phone.trim())   e.phone       = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter valid 10-digit number';
    if (!form.address.trim()) e.address     = 'Address is required';
    if (!form.productType)    e.productType = 'Select a product type';
    if (!form.amcAmount)      e.amcAmount   = 'AMC amount is required';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    try {
      await updateCustomer(id, {
        name:        form.name,
        phone:       form.phone,
        address:     form.address,
        productType: form.productType,
        installDate: form.installDate,
        notes:       form.notes,
        amc: {
          startDate:   form.amcStart,
          endDate:     form.amcEnd,
          amount:      Number(form.amcAmount),
          paymentMode: form.paymentMode,
          email:       form.amcEmail, 
        },
      });
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
      <button
        onClick={() => navigate('/customers')}
        className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition"
      >
        View Customers
      </button>
    </div>
  );

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition"
      >
        <ArrowLeft size={16} /> Back to Customers
      </button>
      <h1 className="text-2xl font-bold text-white mb-1">Edit Customer</h1>
      <p className="text-sm text-gray-500 mb-8">Update the customer details below.</p>

      <div className="space-y-6">

        {/* Personal Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Personal Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
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

        {/* Product Info */}
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

        {/* AMC Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <IndianRupee size={16} className="text-green-400" />
            <h2 className="text-sm font-semibold text-white">AMC Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">AMC Start Date</label>
              <input type="date" name="amcStart" value={form.amcStart} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
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
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              {errors.amcAmount && <p className="text-red-400 text-xs mt-1">{errors.amcAmount}</p>}
            </div>
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
                     <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1.5 block">Customer Email (for reminders)</label>
                       <input
                    name="amcEmail"
                   type="email"
                 value={form.amcEmail}
                 onChange={handleChange}
                placeholder="customer@email.com"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
                   />
               </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <label className="text-xs text-gray-500 mb-1.5 block">Notes (optional)</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
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