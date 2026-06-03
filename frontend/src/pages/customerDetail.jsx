import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Phone, MapPin, Package, Calendar,
  IndianRupee, Wrench, Plus, CheckCircle, Clock,
  XCircle, X,
} from 'lucide-react';
import { getCustomer, sendReminder, getServiceVisitsByCustomer, createServiceVisit, renewAMC, getPaymentsByCustomer } from '../api';
import { useData } from '../context/DataContext';
import { uploadBill, deleteBill } from '../api';

const statusStyle = {
  active:   { badge: 'bg-green-500/10 text-green-400 border border-green-500/20', icon: CheckCircle, color: 'text-green-400' },
  expiring: { badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', icon: Clock, color: 'text-yellow-400' },
  expired:  { badge: 'bg-red-500/10 text-red-400 border border-red-500/20', icon: XCircle, color: 'text-red-400' },
  no_amc:   { badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', icon: XCircle, color: 'text-gray-400' },
};

const modeIcons = { Cash: '💵', UPI: '📱', 'Bank Transfer': '🏦', Cheque: '📄' };

const initialVisitForm = {
  date:       new Date().toISOString().split('T')[0],
  complaint:  '',
  parts:      '',
  technician: '',
  cost:       '',
  status:     'Pending',
  notes:      '',
};

const initialRenewForm = {
  startDate:     new Date().toISOString().split('T')[0],
  endDate:       '',
  amount:        '',
  paymentMode:   'Cash',
  isSplit:       false,
  splitPayments: [
    { paymentMode: 'Cash', amount: '', reference: '' },
    { paymentMode: 'UPI',  amount: '', reference: '' },
  ],
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer,       setCustomer]       = useState(null);
  const [visits,         setVisits]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [visitForm,      setVisitForm]      = useState(initialVisitForm);
  const [saving,         setSaving]         = useState(false);
  const [emailSending,   setEmailSending]   = useState(false);
  const [emailSent,      setEmailSent]      = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewForm,      setRenewForm]      = useState(initialRenewForm);
  const [renewing,       setRenewing]       = useState(false);
  const { refresh } = useData();

  const renewSplitTotal = renewForm.splitPayments.reduce(
    (sum, s) => sum + (Number(s.amount) || 0), 0
  );
const [bills,         setBills]         = useState([]);
const [uploadingBill, setUploadingBill] = useState(false);
const [billNote,      setBillNote]      = useState('');
const [previewBill,   setPreviewBill]   = useState(null);
const [payments, setPayments] = useState([]);


  useEffect(() => {
    Promise.all([getCustomer(id), getServiceVisitsByCustomer(id), getPaymentsByCustomer(id)])
      .then(([customerRes, visitsRes,paymentsRes]) => {
        setCustomer(customerRes.data);
        setBills(customerRes.data.bills || []);
        setVisits(visitsRes.data);
        setPayments(paymentsRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  function handleVisitChange(e) {
    setVisitForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleLogVisit() {
    if (!visitForm.complaint || !visitForm.date) {
      alert('Please fill date and complaint'); return;
    }
    setSaving(true);
    try {
      const res = await createServiceVisit({
        ...visitForm,
        customer: id,
        cost: Number(visitForm.cost) || 0,
      });
      setVisits(prev => [res.data, ...prev]);
      setShowModal(false);
      setVisitForm(initialVisitForm);
    } catch (err) {
      alert('Failed to save visit. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailReminder() {
    if (!customer.amc?.email) {
      alert('No email on file. Edit customer to add email.'); return;
    }
    setEmailSending(true);
    try {
      await sendReminder(customer._id);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send email');
    } finally {
      setEmailSending(false);
    }
  }

  function handleWhatsApp() {
    const daysLeft = Math.ceil(
      (new Date(customer.amc?.endDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    const message = `नमस्ते ${customer.name} जी! 🙏\n\nआपके *${customer.productType}* की AMC *${daysLeft} दिनों* में समाप्त हो रही है।\n\n📅 AMC समाप्ति तिथि: *${customer.amc?.endDate?.split('T')[0]}*\n💰 नवीनीकरण राशि: *₹${customer.amc?.amount?.toLocaleString()}*\n\nकृपया समय पर AMC नवीनीकृत करें।\n\n---\nHello ${customer.name} ji, your *${customer.productType}* AMC expires in *${daysLeft} days* on *${customer.amc?.endDate?.split('T')[0]}*. Renewal: *₹${customer.amc?.amount?.toLocaleString()}*\n\n_Water AMC System — Jaipur_ 💧`.trim();
    const phone = customer.phone.startsWith('91') ? customer.phone : `91${customer.phone}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  function handleRenewChange(e) {
    const { name, value } = e.target;
    setRenewForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'startDate' && value) {
        const end = new Date(value);
        end.setFullYear(end.getFullYear() + 1);
        updated.endDate = end.toISOString().split('T')[0];
      }
      return updated;
    });
  }

  function handleRenewSplitChange(index, field, value) {
    setRenewForm(prev => {
      const splits = [...prev.splitPayments];
      splits[index] = { ...splits[index], [field]: value };
      const total = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      return { ...prev, splitPayments: splits, amount: total > 0 ? String(total) : prev.amount };
    });
  }

  function addRenewSplitRow() {
    setRenewForm(prev => ({
      ...prev,
      splitPayments: [...prev.splitPayments, { paymentMode: 'Cash', amount: '', reference: '' }],
    }));
  }

  function removeRenewSplitRow(index) {
    setRenewForm(prev => {
      const splits = prev.splitPayments.filter((_, i) => i !== index);
      const total  = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      return { ...prev, splitPayments: splits, amount: total > 0 ? String(total) : '' };
    });
  }

  async function handleRenew() {
    if (!renewForm.startDate || !renewForm.endDate) {
      alert('Fill all fields'); return;
    }
    if (renewForm.isSplit) {
      const validSplits = renewForm.splitPayments.filter(s => Number(s.amount) > 0);
      if (validSplits.length < 2) { alert('Add at least 2 split payment modes'); return; }
      if (renewSplitTotal <= 0)   { alert('Total split amount must be greater than 0'); return; }
    } else {
      if (!renewForm.amount) { alert('Fill all fields'); return; }
    }

    setRenewing(true);
    try {
      const validSplits = renewForm.splitPayments.filter(s => Number(s.amount) > 0);
      const payload = {
        ...renewForm,
        amount:        renewForm.isSplit ? renewSplitTotal : Number(renewForm.amount),
        paymentMode:   renewForm.isSplit ? 'Split' : renewForm.paymentMode,
        isSplit:       renewForm.isSplit,
        splitPayments: renewForm.isSplit
          ? validSplits.map(s => ({ ...s, amount: Number(s.amount) }))
          : [],
      };
      const res = await renewAMC(customer._id, payload);
      setCustomer(res.data);
      refresh();
      setShowRenewModal(false);
    } catch (err) {
      alert('Renewal failed. Try again.');
    } finally {
      setRenewing(false);
    }
  }

  async function handleBillUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  setUploadingBill(true);
  try {
    const formData = new FormData();
    formData.append('bill', file);
    formData.append('note', billNote);

    const res = await uploadBill(customer._id, formData);
    setBills(prev => [...prev, res.data.bill]);
    setBillNote('');
  } catch (err) {
    alert('Failed to upload bill. Try again.');
  } finally {
    setUploadingBill(false);
    e.target.value = ''; // reset input
  }
}

async function handleDeleteBill(billId) {
  if (!window.confirm('Delete this bill photo?')) return;
  try {
    await deleteBill(customer._id, billId);
    setBills(prev => prev.filter(b => b._id !== billId));
  } catch (err) {
    alert('Failed to delete bill.');
  }
}

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 text-sm">Loading customer...</p>
    </div>
  );

  if (!customer) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-red-400 text-sm">Customer not found.</p>
    </div>
  );

  const status     = customer.amc?.status || 'active';
  const Style      = statusStyle[status];
  const StatusIcon = Style.icon;
  const today      = new Date();
  const end        = new Date(customer.amc?.endDate);
  const daysLeft   = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-4 lg:p-8 max-w-4xl">

      <button onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition">
        <ArrowLeft size={16} /> Back to Customers
      </button>

      {/* Profile card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 lg:p-6 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center font-bold text-xl">
            {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{customer.name}</h1>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Phone size={12} /> {customer.phone}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} /> {customer.address}
              </span>
              {customer.amc?.email && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  📧 {customer.amc.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={() => navigate(`/customers/edit/${customer._id}`)}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition">
            ✏️ Edit
          </button>

          {/* ✅ Renew AMC — hidden when no AMC */}
          {customer.hasAMC && customer.amc?.status !== 'no_amc' && (
            <button
              onClick={() => {
                setRenewForm({
                  ...initialRenewForm,
                  amount:      String(customer.amc?.amount || ''),
                  paymentMode: customer.amc?.paymentMode || 'Cash',
                });
                setShowRenewModal(true);
              }}
              className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-sm transition">
              🔄 Renew AMC
            </button>
          )}

          <button onClick={handleWhatsApp}
            className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-sm transition">
            📱 WhatsApp
          </button>
          <button onClick={handleEmailReminder} disabled={emailSending}
            className={`px-3 py-2 rounded-xl text-sm border transition disabled:opacity-50 ${
              emailSent
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20'
            }`}>
            {emailSent ? '✅ Sent!' : emailSending ? '⏳...' : '📧 Email'}
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Package size={15} className="text-purple-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</p>
          </div>
          <p className="text-lg font-bold text-white">{customer.productType}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Calendar size={11} /> Installed: {customer.installDate?.split('T')[0]}
          </p>
        </div>

        <div className={`bg-gray-900 rounded-2xl p-5 border ${
          status === 'active'   ? 'border-green-500/20' :
          status === 'expiring' ? 'border-yellow-500/20' : 'border-red-500/20'
        }`}>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <StatusIcon size={15} className={Style.color} />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AMC Status</p>
          </div>
          <span className={'px-3 py-1 rounded-full text-sm font-medium ' + Style.badge}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <p className="text-xs text-gray-500 mt-3">
            {daysLeft > 0 ? `${daysLeft} days remaining` : `Expired ${Math.abs(daysLeft)} days ago`}
          </p>
        </div>

        <div className="bg-gray-900 border border-green-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <IndianRupee size={15} className="text-green-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AMC Amount</p>
          </div>
          <p className="text-2xl font-bold text-white">₹{customer.amc?.amount?.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{customer.amc?.paymentMode}</p>
        </div>
      </div>

      {/* ✅ AMC Timeline — hidden when no AMC */}
      {customer.hasAMC && customer.amc?.status !== 'no_amc' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">AMC Timeline</p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Start Date</p>
              <p className="text-sm font-semibold text-white">{customer.amc?.startDate?.split('T')[0]}</p>
            </div>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${
                status === 'active'   ? 'bg-green-500' :
                status === 'expiring' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
                style={{ width: `${Math.min(100, Math.max(0, 100 - (daysLeft / 365) * 100))}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">End Date</p>
              <p className="text-sm font-semibold text-white">{customer.amc?.endDate?.split('T')[0]}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
<div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
  <div className="flex items-center gap-2 mb-5">
    <IndianRupee size={15} className="text-green-400" />
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
      Payment History ({payments.length})
    </p>
  </div>

  {payments.length === 0 ? (
    <p className="text-sm text-gray-500">No payments recorded yet.</p>
  ) : (
    <div className="space-y-3">
      {payments.map(p => (
        <div key={p._id}
          className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
              p.amcLinked
                ? 'bg-green-500/10'
                : 'bg-blue-500/10'
            }`}>
              {p.amcLinked ? '🔄' : '🔧'}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {p.description || (p.amcLinked ? 'AMC Payment' : 'Installation Payment')}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-500">{p.date?.split('T')[0]}</p>
                {p.isSplit ? (
                  <span className="text-xs text-purple-400">🔀 Split</span>
                ) : (
                  <span className="text-xs text-gray-500">
                    {p.paymentMode === 'Pending' ? '⏳ Pending' :
                     p.paymentMode === 'Cash'    ? '💵 Cash'   :
                     p.paymentMode === 'UPI'     ? '📱 UPI'    :
                     p.paymentMode === 'Cheque'  ? '📄 Cheque' :
                     '🏦 Bank Transfer'}
                  </span>
                )}
              </div>
              {/* Split breakdown */}
              {p.isSplit && p.splitPayments?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {p.splitPayments.map((s, i) => (
                    <span key={i} className="text-xs text-gray-500">
                      {s.paymentMode}: ₹{s.amount?.toLocaleString()}
                    </span>
                  ))}
                </div>
              )}
              {/* Partial info */}
              {p.status === 'Partial' && (
                <p className="text-xs text-yellow-400 mt-0.5">
                  Paid ₹{p.paidAmount?.toLocaleString()} · Due ₹{(p.amount - p.paidAmount)?.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-white">₹{p.amount?.toLocaleString()}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              p.status === 'Paid'    ? 'bg-green-500/10 text-green-400'  :
              p.status === 'Due'     ? 'bg-red-500/10 text-red-400'      :
              p.status === 'Partial' ? 'bg-yellow-500/10 text-yellow-400' :
              'bg-gray-500/10 text-gray-400'
            }`}>
              {p.status}
            </span>
          </div>
        </div>
      ))}

      {/* Total summary */}
      <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
        <p className="text-xs text-gray-500">Total Paid</p>
        <p className="text-sm font-bold text-green-400">
          ₹{payments.reduce((sum, p) => {
            if (p.status === 'Paid')    return sum + p.amount;
            if (p.status === 'Partial') return sum + (p.paidAmount || 0);
            return sum;
          }, 0).toLocaleString()}
        </p>
      </div>
      {payments.some(p => p.status === 'Due' || p.status === 'Partial') && (
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">Total Due</p>
          <p className="text-sm font-bold text-red-400">
            ₹{payments.reduce((sum, p) => {
              if (p.status === 'Due')     return sum + p.amount;
              if (p.status === 'Partial') return sum + (p.amount - (p.paidAmount || 0));
              return sum;
            }, 0).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )}
</div>

      {/* Notes */}
      {customer.notes && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
          <p className="text-sm text-gray-300">{customer.notes}</p>
        </div>
      )}
       
     {/* Bills / Photos */}
<div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2">
      <span className="text-lg">🧾</span>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Bills & Photos ({bills.length})
      </p>
    </div>

    {/* Upload button */}
    <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
      uploadingBill
        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
        : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20'
    }`}>
      {uploadingBill ? '⏳ Uploading...' : '📷 Upload Bill'}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleBillUpload}
        disabled={uploadingBill}
        className="hidden"
      />
    </label>
  </div>

  {/* Note input */}
  <div className="mb-4">
    <input
      value={billNote}
      onChange={e => setBillNote(e.target.value)}
      placeholder="Add a note for this bill (optional)..."
      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
    />
  </div>

  {bills.length === 0 ? (
    <div className="text-center py-8">
      <p className="text-4xl mb-2">🧾</p>
      <p className="text-sm text-gray-500">No bills uploaded yet.</p>
      <p className="text-xs text-gray-600 mt-1">Click Upload Bill to add a photo of the handwritten bill.</p>
    </div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {bills.map(bill => (
        <div key={bill._id} className="relative group">
          {/* Bill image */}
          <div
            className="aspect-square rounded-xl overflow-hidden bg-gray-800 cursor-pointer border border-gray-700 hover:border-blue-500/50 transition"
            onClick={() => setPreviewBill(bill)}
          >
            <img
              src={`http://localhost:5000${bill.url}`}
              alt="Bill"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Note */}
          {bill.note && (
            <p className="text-xs text-gray-500 mt-1 truncate">{bill.note}</p>
          )}

          {/* Date */}
          <p className="text-xs text-gray-600">{new Date(bill.uploadedAt).toLocaleDateString()}</p>

          {/* Delete button */}
          <button
            onClick={() => handleDeleteBill(bill._id)}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 hover:bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )}
</div>

{/* Bill Preview Modal */}
{previewBill && (
  <div
    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
    onClick={() => setPreviewBill(null)}
    style={{ zIndex: 9999 }}
  >
    <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setPreviewBill(null)}
        className="absolute -top-10 right-0 text-white text-sm bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-700 transition"
      >
        ✕ Close
      </button>
      <img
        src={`http://localhost:5000${previewBill.url}`}
        alt="Bill"
        className="w-full rounded-2xl"
      />
      {previewBill.note && (
        <p className="text-gray-300 text-sm mt-3 text-center">{previewBill.note}</p>
      )}
      <p className="text-gray-500 text-xs text-center mt-1">
        {new Date(previewBill.uploadedAt).toLocaleDateString()}
      </p>
      {/* Download button */}
      <a
        href={`http://localhost:5000${previewBill.url}`}
        download
        className="flex items-center justify-center gap-2 mt-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm transition"
        onClick={e => e.stopPropagation()}
      >
        ⬇️ Download Bill
      </a>
    </div>
  </div>
)}



      {/* Service History */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Wrench size={15} className="text-blue-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Service History ({visits.length})
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium transition">
            <Plus size={12} /> Log Visit
          </button>
        </div>

        {visits.length === 0 ? (
          <div className="text-center py-8">
            <Wrench size={30} className="text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No service visits recorded yet.</p>
            <button onClick={() => setShowModal(true)}
              className="mt-3 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/20 transition">
              Log First Visit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map(v => (
              <div key={v._id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{v.complaint}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {v.parts && `Parts: ${v.parts}`}
                      {v.technician && ` · Tech: ${v.technician}`}
                      {v.cost > 0 && ` · ₹${v.cost?.toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-500">{v.date?.split('T')[0]}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    v.status === 'Resolved'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : v.status === 'In Progress'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Log Visit Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Log Service Visit</h2>
              <button onClick={() => { setShowModal(false); setVisitForm(initialVisitForm); }}
                className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Date *</label>
                  <input type="date" name="date" value={visitForm.date} onChange={handleVisitChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Status</label>
                  <select name="status" value={visitForm.status} onChange={handleVisitChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Complaint *</label>
                <input name="complaint" value={visitForm.complaint} onChange={handleVisitChange}
                  placeholder="e.g. Low water pressure"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Parts Used</label>
                  <input name="parts" value={visitForm.parts} onChange={handleVisitChange}
                    placeholder="e.g. Filter membrane"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Technician</label>
                  <input name="technician" value={visitForm.technician} onChange={handleVisitChange}
                    placeholder="e.g. Ramesh"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Service Cost (₹)</label>
                <input type="number" name="cost" value={visitForm.cost} onChange={handleVisitChange}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Notes</label>
                <textarea name="notes" value={visitForm.notes} onChange={handleVisitChange}
                  placeholder="Any additional notes..." rows={2}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setVisitForm(initialVisitForm); }}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleLogVisit} disabled={saving}
                className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 disabled:opacity-50 transition">
                {saving ? 'Saving...' : 'Log Visit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Renew AMC Modal ─────────────────────────────────────────────────── */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Renew AMC</h2>
                <p className="text-xs text-gray-500 mt-0.5">{customer.name} — {customer.productType}</p>
              </div>
              <button onClick={() => setShowRenewModal(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">New Start Date</label>
                  <input type="date" name="startDate" value={renewForm.startDate} onChange={handleRenewChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">New End Date</label>
                  <input type="date" name="endDate" value={renewForm.endDate} onChange={handleRenewChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
                  <p className="text-xs text-gray-600 mt-1">Auto-set 1 year from start</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Renewal Amount (₹)</label>
                  <input
                    type="number" name="amount" value={renewForm.amount}
                    onChange={handleRenewChange} placeholder="e.g. 2500"
                    disabled={renewForm.isSplit}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Payment Mode</label>
                  <select
                    name="paymentMode" value={renewForm.paymentMode}
                    onChange={handleRenewChange} disabled={renewForm.isSplit}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed">
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>
              </div>
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
                    onClick={() => setRenewForm(prev => ({ ...prev, isSplit: !prev.isSplit }))}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                      renewForm.isSplit ? 'bg-blue-500' : 'bg-gray-600'
                    }`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      renewForm.isSplit ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </label>
              </div>
              {renewForm.isSplit && (
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Split Payment Breakdown</label>
                  <div className="space-y-2">
                    {renewForm.splitPayments.map((split, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={split.paymentMode}
                          onChange={e => handleRenewSplitChange(index, 'paymentMode', e.target.value)}
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
                            onChange={e => handleRenewSplitChange(index, 'amount', e.target.value)}
                            placeholder="Amount"
                            className="w-full pl-7 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                        </div>
                        <input
                          value={split.reference}
                          onChange={e => handleRenewSplitChange(index, 'reference', e.target.value)}
                          placeholder="Ref/UPI ID"
                          className="w-28 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                        {renewForm.splitPayments.length > 2 && (
                          <button
                            onClick={() => removeRenewSplitRow(index)}
                            className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={addRenewSplitRow}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/20 transition">
                      <Plus size={12} /> Add Mode
                    </button>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-lg font-bold text-white">₹{renewSplitTotal.toLocaleString()}</p>
                    </div>
                  </div>
                  {renewSplitTotal > 0 && (
                    <div className="mt-3">
                      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                        {renewForm.splitPayments.filter(s => Number(s.amount) > 0).map((s, i) => {
                          const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                          return (
                            <div
                              key={i}
                              className={`${colors[i % colors.length]} transition-all`}
                              style={{ width: `${(Number(s.amount) / renewSplitTotal) * 100}%` }}
                              title={`${s.paymentMode}: ₹${s.amount}`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {renewForm.splitPayments.filter(s => Number(s.amount) > 0).map((s, i) => {
                          const colors = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-purple-400'];
                          return (
                            <span key={i} className={`text-xs ${colors[i % colors.length]}`}>
                              {modeIcons[s.paymentMode]} {s.paymentMode}: ₹{Number(s.amount).toLocaleString()} ({Math.round((Number(s.amount) / renewSplitTotal) * 100)}%)
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs text-blue-400">
                  ✅ This will update the AMC dates and automatically set status to Active.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRenewModal(false)}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleRenew} disabled={renewing}
                className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 disabled:opacity-50 transition">
                {renewing
                  ? 'Renewing...'
                  : renewForm.isSplit
                  ? `🔄 Confirm Split ₹${renewSplitTotal.toLocaleString()}`
                  : '🔄 Confirm Renewal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}