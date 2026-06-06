import { useState, useEffect, useRef } from 'react';
import { analyzeComplaint } from '../api';
import { Loader, Zap } from 'lucide-react';

const priorityStyle = {
  High:   'bg-red-500/10 text-red-400 border border-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Low:    'bg-green-500/10 text-green-400 border border-green-500/20',
};

const confidenceStyle = {
  High:   'text-green-400',
  Medium: 'text-yellow-400',
  Low:    'text-gray-500',
};

export default function ComplaintAnalyzer({ complaint, onSuggest }) {
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const debounce   = useRef();

  useEffect(() => {
    if (!complaint || complaint.trim().length < 4) {
      setResult(null);
      return;
    }

    clearTimeout(debounce.current);
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await analyzeComplaint(complaint);
        setResult(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(debounce.current);
  }, [complaint]);

  if (!complaint || complaint.trim().length < 4) return null;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-blue-500/20">

      {/* Header */}
      <div className="bg-blue-500/10 px-3 py-2 flex items-center gap-2">
        <Zap size={13} className="text-blue-400" />
        <p className="text-xs font-medium text-blue-400"> Analyzing</p>
        {loading && <Loader size={11} className="text-blue-400 animate-spin ml-auto" />}
      </div>

      {/* Results */}
      {result && !loading && (
        <div className="bg-gray-800/50 p-3 space-y-3">

          {/* Category + Priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{result.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{result.category}</p>
                <p className={`text-xs ${confidenceStyle[result.confidence]}`}>
                  {result.confidence} confidence
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityStyle[result.priority]}`}>
              {result.priority} Priority
            </span>
          </div>

          {/* Cost estimate */}
          <div className="bg-gray-900 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Estimated Repair Cost</p>
            <p className="text-sm font-bold text-white mt-0.5">
              ₹{result.cost.min.toLocaleString()} – ₹{result.cost.max.toLocaleString()}
            </p>
          </div>

          {/* Suggested parts */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Suggested Parts</p>
            <div className="flex flex-wrap gap-1.5">
              {result.parts.map((part, i) => (
                <button
                  key={i}
                  onClick={() => onSuggest && onSuggest('parts', part)}
                  className="px-2.5 py-1 bg-gray-900 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 rounded-lg text-xs transition"
                  title="Click to add to parts field"
                >
                  + {part}
                </button>
              ))}
            </div>
          </div>

          {/* Advice */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500 mb-0.5">Technician Advice</p>
            <p className="text-xs text-gray-300">{result.advice}</p>
          </div>

          {/* Also could be */}
          {result.allMatches.length > 0 && (
            <p className="text-xs text-gray-600">
              Could also be: {result.allMatches.join(', ')}
            </p>
          )}

        </div>
      )}
    </div>
  );
}