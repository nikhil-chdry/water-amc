import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser, forgotPassword } from '../api';
import { useAuth } from '../context/Authcontext';

export default function Login() {
  const [tab,      setTab]      = useState('login'); // login | register | forgot
  const [form,     setForm]     = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(''); setSuccess('');
  }

  function switchTab(t) {
    setTab(t);
    setError(''); setSuccess('');
    setForm({ name: '', email: '', password: '', confirmPassword: '' });
  }

  async function handleSubmit() {
    setLoading(true);
    setError(''); setSuccess('');

    try {
      if (tab === 'login') {
        if (!form.email || !form.password) { setError('Enter email and password'); return; }
        const res = await loginUser({ email: form.email, password: form.password });
        login(res.data);
        navigate('/dashboard');

      } else if (tab === 'register') {
        if (!form.name || !form.email || !form.password || !form.confirmPassword) {
          setError('All fields are required'); return;
        }
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match'); return;
        }
        if (form.password.length < 6) {
          setError('Password must be at least 6 characters'); return;
        }
        const res = await registerUser({ name: form.name, email: form.email, password: form.password });
        login(res.data);
        navigate('/dashboard');

      } else if (tab === 'forgot') {
        if (!form.email) { setError('Enter your email'); return; }
        await forgotPassword({ email: form.email });
        setSuccess('Reset link sent! Check your email inbox.');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-blue-500 p-2.5 rounded-xl">
            <Droplets size={24} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">Water AMC</p>
            <p className="text-xs text-gray-500">Management System — Jaipur</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

          {/* Tab switcher */}
          {tab !== 'forgot' && (
            <div className="flex gap-1 bg-gray-800 rounded-xl p-1 mb-6">
              <button onClick={() => switchTab('login')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  tab === 'login' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                Sign In
              </button>
              <button onClick={() => switchTab('register')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  tab === 'register' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                Create Account
              </button>
            </div>
          )}

          <h1 className="text-xl font-bold text-white mb-1">
            {tab === 'login'    ? 'Welcome back'       :
             tab === 'register' ? 'Create your account' :
             'Reset Password'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {tab === 'login'    ? 'Sign in to manage your business'  :
             tab === 'register' ? 'Start managing your AMC business' :
             'Enter your email to receive a reset link'}
          </p>

          {/* Error / Success */}
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

            {/* Name — only for register */}
            {tab === 'register' && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="your@email.com"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            {/* Password */}
            {tab !== 'forgot' && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input name="password" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={handleChange}
                    placeholder="••••••••"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full pl-9 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                  <button onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password — only for register */}
            {tab === 'register' && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input name="confirmPassword" type={showPass ? 'text' : 'password'}
                    value={form.confirmPassword} onChange={handleChange}
                    placeholder="••••••••"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            )}

            {/* Forgot password link */}
            {tab === 'login' && (
              <button onClick={() => switchTab('forgot')}
                className="text-xs text-blue-400 hover:text-blue-300 transition">
                Forgot password?
              </button>
            )}

            {/* Submit button */}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition">
              {loading ? 'Please wait...' :
               tab === 'login'    ? 'Sign In' :
               tab === 'register' ? 'Create Account' :
               'Send Reset Link'}
            </button>

            {/* Back to login */}
            {tab === 'forgot' && (
              <button onClick={() => switchTab('login')}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition">
                Back to Sign In
              </button>
            )}

          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Water AMC System — Jaipur 💧
        </p>
      </div>
    </div>
  );
}
