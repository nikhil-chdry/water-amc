import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChurnRisk, getRevenueForecast } from '../api';
import { TrendingUp, AlertTriangle, Users, Phone, MessageCircle } from 'lucide-react';

const riskColor = {
  High:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20',    badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  Medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  Low:    { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20',  badge: 'bg-green-500/10 text-green-400 border border-green-500/20' },
};

export default function AIInsights() {
  const [churn,    setChurn]    = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getChurnRisk(), getRevenueForecast()])
      .then(([churnRes, forecastRes]) => {
        setChurn(churnRes.data);
        setForecast(forecastRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 text-sm">Analyzing your data...</p>
    </div>
  );

  const filtered = filter === 'All'
    ? churn?.customers
    : churn?.customers.filter(c => c.risk === filter);

  return (
    <div className="p-4 lg:p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white"> Insights</h1>
        <p className="text-sm text-gray-500 mt-1">
           analysing your customer data to predict churn risk and forecast revenue.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">High Risk</p>
          <p className="text-3xl font-bold text-red-400">{churn?.summary.high}</p>
          <p className="text-xs text-gray-600 mt-1">Likely to churn</p>
        </div>
        <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">Medium Risk</p>
          <p className="text-3xl font-bold text-yellow-400">{churn?.summary.medium}</p>
          <p className="text-xs text-gray-600 mt-1">Needs attention</p>
        </div>
        <div className="bg-gray-900 border border-green-500/20 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">Low Risk</p>
          <p className="text-3xl font-bold text-green-400">{churn?.summary.low}</p>
          <p className="text-xs text-gray-600 mt-1">Happy customers</p>
        </div>
        <div className="bg-gray-900 border border-blue-500/20 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">Avg Risk Score</p>
          <p className="text-3xl font-bold text-blue-400">{churn?.summary.avgScore}</p>
          <p className="text-xs text-gray-600 mt-1">Out of 100</p>
        </div>
      </div>

      {/* Revenue Forecast */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Revenue Forecast — Next 3 Months</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {forecast?.forecast.map((f, i) => (
            <div key={i} className={`rounded-xl p-4 border ${
              i === 0 ? 'bg-blue-500/10 border-blue-500/20' :
              i === 1 ? 'bg-purple-500/10 border-purple-500/20' :
              'bg-gray-800 border-gray-700'
            }`}>
              <p className="text-xs text-gray-500 mb-1">{f.month}</p>
              <p className="text-2xl font-bold text-white">₹{f.expectedRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{f.renewalCount} AMC renewal{f.renewalCount !== 1 ? 's' : ''} due</p>
              {f.customers.length > 0 && (
                <div className="mt-2 space-y-1">
                  {f.customers.slice(0, 3).map((c, j) => (
                    <p key={j} className="text-xs text-gray-400 truncate">
                      • {c.name} — ₹{c.amount?.toLocaleString()}
                    </p>
                  ))}
                  {f.customers.length > 3 && (
                    <p className="text-xs text-gray-600">+{f.customers.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Churn Risk List */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Customer Risk Analysis</h2>
          </div>
          {/* Filter */}
          <div className="flex gap-2">
            {['All', 'High', 'Medium', 'Low'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  filter === f
                    ? f === 'High'   ? 'bg-red-500/20 text-red-400 border-red-500/20'
                    : f === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                    : f === 'Low'    ? 'bg-green-500/20 text-green-400 border-green-500/20'
                    : 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered?.map(c => (
            <div key={c._id}
              className={`rounded-xl border p-4 ${riskColor[c.risk].bg} ${riskColor[c.risk].border}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${riskColor[c.risk].bg} ${riskColor[c.risk].text}`}>
                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone} · {c.productType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Risk score bar */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Risk Score</p>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.risk === 'High'   ? 'bg-red-500' :
                            c.risk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${c.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${riskColor[c.risk].text}`}>{c.score}</span>
                    </div>
                  </div>

                  {/* Risk badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${riskColor[c.risk].badge}`}>
                    {c.risk} Risk
                  </span>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/customers/${c._id}`)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition">
                      View
                    </button>
                    <button
                      onClick={() => {
                        const msg = `नमस्ते ${c.name} जी! 🙏\n\nआपकी AMC की जानकारी के लिए संपर्क कर रहे हैं।\n\nकृपया हमसे संपर्क करें।\n\n_Water AMC System — Jaipur_ 💧`;
                        const phone = c.phone.startsWith('91') ? c.phone : `91${c.phone}`;
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs transition">
                      📱 WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* Reasons */}
              {c.reasons.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {c.reasons.map((r, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">
                      ⚠️ {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Complaint Pattern Analysis */}
<div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mt-6">
  <div className="flex items-center gap-2 mb-5">
    <span className="text-lg">🔍</span>
    <h2 className="text-sm font-semibold text-white">How It Works</h2>
  </div>
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {[
      { icon: '🔵', name: 'Filter Issue',       keywords: 'pressure, taste, slow, dirty' },
      { icon: '⚙️', name: 'Motor/Pump',          keywords: 'noise, motor, not starting' },
      { icon: '💧', name: 'Leakage',             keywords: 'leak, drip, pipe, overflow' },
      { icon: '⚡', name: 'Electrical',           keywords: 'power, switch, trip, PCB' },
      { icon: '🪣', name: 'Tank Issue',           keywords: 'tank, overflow, not filling' },
      { icon: '☢️', name: 'UV/Purification',     keywords: 'UV lamp, bacteria, purify' },
      { icon: '❄️', name: 'Cooling Issue',        keywords: 'not cold, compressor, warm' },
      { icon: '🔧', name: 'Routine Maintenance', keywords: 'service, cleaning, annual' },
    ].map(cat => (
      <div key={cat.name} className="bg-gray-800 rounded-xl p-3">
        <p className="text-xl mb-1">{cat.icon}</p>
        <p className="text-xs font-medium text-white">{cat.name}</p>
        <p className="text-xs text-gray-600 mt-0.5">{cat.keywords}</p>
      </div>
    ))}
  </div>
  <p className="text-xs text-gray-600 mt-4">
    By analyzing customer complaints and feedback, our system identifies common issues and patterns. This helps us proactively address problems, improve service quality, and enhance customer satisfaction.
    
  </p>
</div>

    </div>
  );
}