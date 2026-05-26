import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Droplets, Lock, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '../api';

export default function ResetPassword() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const [form,     setForm]     = useState({ password: '', confirmPassword: '' });
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit() {
    if (!form.password || !form.confirmPassword) { setError('Both fields required'); return; }
    if (form.password !== form.confirmPassword)  { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      await resetPassword(token, { password: form.password });
      setSuccess('Password reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-blue-500 p-2.5 rounded-xl">
            <Droplets size={24} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">Water AMC</p>
            <p className="text-xs text-gray-500">Reset Password</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-white mb-1">Set New Password</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your new password below.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-4">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">New Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input name="password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                <button onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input name="confirmPassword" type={showPass ? 'text' : 'password'}
                  value={form.confirmPassword} onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}