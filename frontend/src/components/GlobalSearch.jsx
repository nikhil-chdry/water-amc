import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Receipt, Wrench, X, Loader } from 'lucide-react';
import { searchAll } from '../api';

const statusStyle = {
  active:   'bg-green-500/10 text-green-400',
  expiring: 'bg-yellow-500/10 text-yellow-400',
  expired:  'bg-red-500/10 text-red-400',
  no_amc:   'bg-gray-500/10 text-gray-400',
};

export default function GlobalSearch() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const navigate  = useNavigate();
  const inputRef  = useRef();
  const wrapRef   = useRef();
  const debounce  = useRef();

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        setResults(null);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }
    clearTimeout(debounce.current);
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await searchAll(query);
        setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  const total = results
    ? results.customers.length + results.payments.length + results.visits.length
    : 0;

  function goTo(path) {
    navigate(path);
    setOpen(false);
    setQuery('');
    setResults(null);
  }

  return (
    <div ref={wrapRef} className="relative">

      {/* Search trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 text-sm hover:border-gray-600 transition"
      >
        <Search size={14} />
        <span className="hidden sm:block">Search...</span>
        <span className="hidden sm:block text-xs text-gray-600 bg-gray-700 px-1.5 py-0.5 rounded">
          Ctrl K
        </span>
      </button>

      {/* Search modal */}
      {open && (
        <div className="fixed inset-0 z-50" style={{ zIndex: 9999 }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setOpen(false); setQuery(''); setResults(null); }} />

          {/* Search box */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-xl px-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">

              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
                {loading
                  ? <Loader size={16} className="text-blue-400 animate-spin flex-shrink-0" />
                  : <Search size={16} className="text-gray-500 flex-shrink-0" />
                }
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search customers, payments, visits..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
                    className="text-gray-500 hover:text-white transition">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">

                {/* Empty state */}
                {!query && (
                  <div className="px-4 py-8 text-center">
                    <Search size={24} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Start typing to search...</p>
                    <p className="text-xs text-gray-600 mt-1">Customers, payments, service visits</p>
                  </div>
                )}

                {/* No results */}
                {query.length >= 2 && !loading && results && total === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-gray-500">No results for "<span className="text-white">{query}</span>"</p>
                  </div>
                )}

                {/* Short query */}
                {query.length === 1 && (
                  <div className="px-4 py-4 text-center">
                    <p className="text-xs text-gray-600">Type at least 2 characters...</p>
                  </div>
                )}

                {results && total > 0 && (
                  <div className="p-2">

                    {/* Customers */}
                    {results.customers.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wider px-2 py-1.5 flex items-center gap-1.5">
                          <Users size={11} /> Customers ({results.customers.length})
                        </p>
                        {results.customers.map(c => (
                          <button key={c._id}
                            onClick={() => goTo(`/customers/${c._id}`)}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-800 transition text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{c.name}</p>
                                <p className="text-xs text-gray-500">{c.phone} · {c.productType}</p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle[c.amc?.status] || statusStyle.no_amc}`}>
                              {c.amc?.status || 'no amc'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Payments */}
                    {results.payments.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wider px-2 py-1.5 flex items-center gap-1.5">
                          <Receipt size={11} /> Payments ({results.payments.length})
                        </p>
                        {results.payments.map(p => (
                          <button key={p._id}
                            onClick={() => goTo('/payments')}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-800 transition text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                                💰
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {p.description || p.partyName || 'Payment'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {p.customer?.name && `${p.customer.name} · `}
                                  {p.date?.split('T')[0]}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-white">₹{p.amount?.toLocaleString()}</p>
                              <span className={`text-xs ${
                                p.status === 'Paid'    ? 'text-green-400'  :
                                p.status === 'Due'     ? 'text-red-400'    :
                                'text-yellow-400'
                              }`}>{p.status}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Service Visits */}
                    {results.visits.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wider px-2 py-1.5 flex items-center gap-1.5">
                          <Wrench size={11} /> Service Visits ({results.visits.length})
                        </p>
                        {results.visits.map(v => (
                          <button key={v._id}
                            onClick={() => goTo('/service')}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-800 transition text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                                🔧
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{v.complaint}</p>
                                <p className="text-xs text-gray-500">
                                  {v.customer?.name && `${v.customer.name} · `}
                                  {v.date?.split('T')[0]}
                                  {v.technician && ` · ${v.technician}`}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              v.status === 'Resolved'
                                ? 'bg-green-500/10 text-green-400'
                                : v.status === 'In Progress'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {v.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  {results && total > 0 ? `${total} result${total > 1 ? 's' : ''}` : 'Type to search'}
                </p>
                <p className="text-xs text-gray-600">Press <span className="text-gray-500">Esc</span> to close</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}