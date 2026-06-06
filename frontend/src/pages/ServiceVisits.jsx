import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Plus, X, Check, Clock, Trash2, Phone } from 'lucide-react';
import { getServiceVisits, createServiceVisit, updateServiceVisit, deleteServiceVisit } from '../api';
import { getCustomers } from '../api';
import ComplaintAnalyzer from '../components/ComplaintAnalyzer';

const statusStyle = {
  Pending:     'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  'In Progress': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Resolved:    'bg-green-500/10 text-green-400 border border-green-500/20',
};

const statusIcon = {
  Pending:       Clock,
  'In Progress': Wrench,
  Resolved:      Check,
};

const initialForm = {
  customer:   '',
  date:       new Date().toISOString().split('T')[0],
  complaint:  '',
  parts:      '',
  technician: '',
  cost:       '',
  status:     'Pending',
  notes:      '',
};

export default function ServiceVisits() {
  const [visits,    setVisits]    = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(initialForm);
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState('all');

  useEffect(() => {
    Promise.all([getServiceVisits(), getCustomers()])
      .then(([visitsRes, customersRes]) => {
        setVisits(visitsRes.data);
        setCustomers(customersRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.customer || !form.complaint || !form.date) {
      alert('Please fill customer, date and complaint'); return;
    }
    setSaving(true);
    try {
      const res = await createServiceVisit({
        ...form,
        cost: Number(form.cost) || 0,
      });
      setVisits(prev => [res.data, ...prev]);
      setShowModal(false);
      setForm(initialForm);
    } catch (err) {
      alert('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      const res = await updateServiceVisit(id, { status });
      setVisits(prev => prev.map(v => v._id === id ? res.data : v));
    } catch (err) {
      alert('Failed to update status');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this service visit?')) return;
    try {
      await deleteServiceVisit(id);
      setVisits(prev => prev.filter(v => v._id !== id));
    } catch (err) {
      alert('Failed to delete');
    }
  }

  const filtered = filter === 'all'
    ? visits
    : visits.filter(v => v.status === filter);

  const counts = {
    all:         visits.length,
    Pending:     visits.filter(v => v.status === 'Pending').length,
    'In Progress': visits.filter(v => v.status === 'In Progress').length,
    Resolved:    visits.filter(v => v.status === 'Resolved').length,
  };

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Service Visits</h1>
          <p className="text-sm text-gray-500 mt-1">{visits.length} total visits logged</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <Plus size={16} /> Log Visit
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'Pending', 'In Progress', 'Resolved'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={
              'px-4 py-2 rounded-xl text-sm font-medium border transition ' +
              (filter === s
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600')
            }
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Visits list */}
      {loading ? (
        <p className="text-gray-500 text-sm text-center py-20">Loading visits...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Wrench size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No service visits found.</p>
          <button onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition">
            Log First Visit
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(v => {
            const Icon = statusIcon[v.status] || Clock;
            return (
              <div key={v._id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-blue-500/20 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={18} className="text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-white text-sm">
                          {v.customer?.name || 'Unknown'}
                        </p>
                        <span className="text-xs text-gray-600">•</span>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone size={10} /> {v.customer?.phone}
                        </p>
                        <span className="text-xs text-gray-600">•</span>
                        <p className="text-xs text-gray-500">{v.customer?.productType}</p>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{v.complaint}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {v.parts      && <span>🔧 {v.parts}</span>}
                        {v.technician && <span>👤 {v.technician}</span>}
                        {v.cost > 0   && <span>💰 ₹{v.cost?.toLocaleString()}</span>}
                        <span>📅 {v.date?.split('T')[0]}</span>
                      </div>
                      {v.notes && <p className="text-xs text-gray-600 mt-2 italic">{v.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Status dropdown */}
                    <select
                      value={v.status}
                      onChange={e => handleStatusChange(v._id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
                    >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>

                    <span className={'px-2.5 py-1 rounded-full text-xs font-medium ' + statusStyle[v.status]}>
                      {v.status}
                    </span>

                    <button
                      onClick={() => handleDelete(v._id)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Visit Modal */}
      {showModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    style={{ zIndex: 9999 }}>
    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Log Service Visit</h2>
              <button onClick={() => { setShowModal(false); setForm(initialForm); }}
                className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Customer *</label>
                <select name="customer" value={form.customer} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="" disabled>Select customer...</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name} — {c.productType}</option>
                  ))}
                </select>
              </div>

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
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </div>
              </div>

              <div>
  <label className="text-xs text-gray-500 mb-1.5 block">Complaint *</label>
  <input name="complaint" value={form.complaint} onChange={handleChange}
    placeholder="e.g. Low water pressure, motor not working..."
    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />

  {/* AI Analyzer — appears as user types */}
  <ComplaintAnalyzer
    complaint={form.complaint}
    onSuggest={(field, value) => {
      setForm(prev => ({ ...prev, [field]: value }));
    }}
  />
</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Parts Used</label>
                  <input name="parts" value={form.parts} onChange={handleChange}
                    placeholder="e.g. Filter membrane"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Technician</label>
                  <input name="technician" value={form.technician} onChange={handleChange}
                    placeholder="e.g. Ramesh"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Service Cost (₹)</label>
                <input type="number" name="cost" value={form.cost} onChange={handleChange}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Any additional notes..."
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
                {saving ? 'Saving...' : 'Log Visit'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}