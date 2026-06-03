import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Phone, MapPin, Pencil, Trash2 } from 'lucide-react';
import { getCustomers, deleteCustomer } from '../api';
import { useData } from '../context/DataContext';

const statusStyle = {
  active:   'bg-green-500/10 text-green-400 border border-green-500/20',
  expiring: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  expired:  'bg-red-500/10 text-red-400 border border-red-500/20',
  no_amc:   'bg-gray-500/10 text-gray-400 border border-gray-500/20',
};

const filters = ['all', 'active', 'expiring', 'expired'];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();
  const { refreshKey } = useData();
  const { refresh } = useData();

  function fetchCustomers() {
    getCustomers()
      .then(res => setCustomers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCustomers(); }, [refreshKey]);

  async function handleDelete(id, name) {
  if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
  try {
    await deleteCustomer(id);
    setCustomers(prev => prev.filter(c => c._id !== id));
    refresh(); // ← ADD THIS
  } catch (err) {
    alert('Failed to delete. Try again.');
  }
}

  const filtered = customers.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchFilter = filter === 'all' || c.amc?.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} total customers</p>
        </div>
        <button
          onClick={() => navigate('/customers/add')}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        {filters.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={
              'px-4 py-2 rounded-xl text-sm font-medium border transition ' +
              (filter === s
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600')
            }
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-sm">Loading customers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10">No customers found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(c => (
            <div key={c._id}
            onClick={() => navigate(`/customers/${c._id}`)}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-blue-500/30 transition cursor-pointer"
            >
              <div className="flex items-center justify-between lg:justify-end gap-4 flex-wrap w-full lg:w-auto">
                <div className="w-11 h-11 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{c.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone size={11} /> {c.phone}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={11} /> {c.address}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">{c.productType}</p>
                  <p className="text-xs text-gray-600 mt-0.5">AMC ends: {c.amc?.endDate?.split('T')[0]}</p>
                </div>
                <span className={'px-3 py-1 rounded-full text-xs font-medium ' + (statusStyle[c.amc?.status] || '')}>
                  {c.amc?.status}
                </span>

                {/* Edit & Delete buttons */}
                <div className="flex items-center gap-2 ml-2">
                 <button
                   onClick={(e) => { e.stopPropagation(); navigate(`/customers/edit/${c._id}`); }}
                   className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-lg transition"
                    >
                    <Pencil size={14} />
                 </button>
                <button
                 onClick={(e) => { e.stopPropagation(); handleDelete(c._id, c.name); }}
                   className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition"
                  >
                     <Trash2 size={14} />
                      </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}