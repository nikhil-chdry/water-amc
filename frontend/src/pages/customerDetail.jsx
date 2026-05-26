import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Phone, MapPin, Package, Calendar,
  IndianRupee, Wrench, Plus, CheckCircle, Clock,
  XCircle, X,
} from 'lucide-react';
import { getCustomer, sendReminder, getServiceVisitsByCustomer, createServiceVisit, renewAMC } from '../api';

const statusStyle = {
  active:   { badge: 'bg-green-500/10 text-green-400 border border-green-500/20', icon: CheckCircle, color: 'text-green-400' },
  expiring: { badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', icon: Clock, color: 'text-yellow-400' },
  expired:  { badge: 'bg-red-500/10 text-red-400 border border-red-500/20', icon: XCircle, color: 'text-red-400' },
};

const initialVisitForm = {
  date:       new Date().toISOString().split('T')[0],
  complaint:  '',
  parts:      '',
  technician: '',
  cost:       '',
  status:     'Pending',
  notes:      '',
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ALL useState hooks must be inside here ↓
  const [customer,       setCustomer]       = useState(null);
  const [visits,         setVisits]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [visitForm,      setVisitForm]      = useState(initialVisitForm);
  const [saving,         setSaving]         = useState(false);
  const [emailSending,   setEmailSending]   = useState(false);
  const [emailSent,      setEmailSent]      = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewForm,      setRenewForm]      = useState({
    startDate:   new Date().toISOString().split('T')[0],
    endDate:     '',
    amount:      '',
    paymentMode: 'Cash',
  });
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    Promise.all([getCustomer(id), getServiceVisitsByCustomer(id)])
      .then(([customerRes, visitsRes]) => {
        setCustomer(customerRes.data);
        setVisits(visitsRes.data);
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

  async function handleRenew() {
    if (!renewForm.startDate || !renewForm.endDate || !renewForm.amount) {
      alert('Fill all fields'); return;
    }
    setRenewing(true);
    try {
      const res = await renewAMC(customer._id, {
        ...renewForm,
        amount: Number(renewForm.amount),
      });
      setCustomer(res.data);
      setShowRenewModal(false);
    } catch (err) {
      alert('Renewal failed. Try again.');
    } finally {
      setRenewing(false);
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
    <div className="p-8 max-w-4xl">

      <button onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition">
        <ArrowLeft size={16} /> Back to Customers
      </button>

      {/* Profile card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4 flex items-center justify-between">
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
          <button
            onClick={() => {
              setRenewForm({
                startDate:   new Date().toISOString().split('T')[0],
                endDate:     '',
                amount:      String(customer.amc?.amount || ''),
                paymentMode: customer.amc?.paymentMode || 'Cash',
              });
              setShowRenewModal(true);
            }}
            className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-sm transition">
            🔄 Renew AMC
          </button>
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
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={15} className="text-purple-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</p>
          </div>
          <p className="text-lg font-bold text-white">{customer.productType}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Calendar size={11} /> Installed: {customer.installDate?.split('T')[0]}
          </p>
        </div>

        <div className={`bg-gray-900 rounded-2xl p-5 border ${
          status === 'active' ? 'border-green-500/20' :
          status === 'expiring' ? 'border-yellow-500/20' : 'border-red-500/20'
        }`}>
          <div className="flex items-center gap-2 mb-4">
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
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee size={15} className="text-green-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AMC Amount</p>
          </div>
          <p className="text-2xl font-bold text-white">₹{customer.amc?.amount?.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{customer.amc?.paymentMode}</p>
        </div>
      </div>

      {/* AMC Timeline */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">AMC Timeline</p>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Start Date</p>
            <p className="text-sm font-semibold text-white">{customer.amc?.startDate?.split('T')[0]}</p>
          </div>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${
              status === 'active' ? 'bg-green-500' :
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

      {/* Notes */}
      {customer.notes && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
          <p className="text-sm text-gray-300">{customer.notes}</p>
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

      {/* Log Visit Modal */}
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

      {/* Renew AMC Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6">
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
                  <input type="number" name="amount" value={renewForm.amount} onChange={handleRenewChange}
                    placeholder="e.g. 2500"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Payment Mode</label>
                  <select name="paymentMode" value={renewForm.paymentMode} onChange={handleRenewChange}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>
              </div>
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
                {renewing ? 'Renewing...' : '🔄 Confirm Renewal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}