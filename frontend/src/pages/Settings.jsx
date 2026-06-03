import { useState, useEffect } from 'react';
import {
  Building2, Phone, Mail, MapPin, Lock,
  Save, CheckCircle, Eye, EyeOff, Bell, User,
} from 'lucide-react';
import { getSettings, updateSettings, changePassword } from '../api';
import { useAuth } from '../context/AuthContext';

const initialBusiness = {
  businessName:    '',
  businessPhone:   '',
  businessEmail:   '',
  businessAddress: '',
  city:            '',
  reminderDays:    [30, 15, 7],
};

const initialPassword = {
  currentPassword: '',
  newPassword:     '',
  confirmPassword: '',
};

export default function Settings() {
  const { user } = useAuth();
  const [business,     setBusiness]     = useState(initialBusiness);
  const [password,     setPassword]     = useState(initialPassword);
  const [loading,      setLoading]      = useState(true);
  const [bizSaving,    setBizSaving]    = useState(false);
  const [passSaving,   setPassSaving]   = useState(false);
  const [bizSuccess,   setBizSuccess]   = useState(false);
  const [passSuccess,  setPassSuccess]  = useState(false);
  const [passError,    setPassError]    = useState('');
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);

  useEffect(() => {
    getSettings()
      .then(res => {
        const s = res.data;
        setBusiness({
          businessName:    s.businessName    || '',
          businessPhone:   s.businessPhone   || '',
          businessEmail:   s.businessEmail   || '',
          businessAddress: s.businessAddress || '',
          city:            s.city            || '',
          reminderDays:    s.reminderDays    || [30, 15, 7],
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  function handleBizChange(e) {
    setBusiness(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePassChange(e) {
    setPassword(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPassError('');
  }

  function toggleReminderDay(day) {
    setBusiness(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(day)
        ? prev.reminderDays.filter(d => d !== day)
        : [...prev.reminderDays, day].sort((a, b) => b - a),
    }));
  }

  async function handleSaveBusiness() {
    setBizSaving(true);
    try {
      await updateSettings(business);
      setBizSuccess(true);
      setTimeout(() => setBizSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setBizSaving(false);
    }
  }

  async function handleChangePassword() {
    setPassError('');
    if (!password.currentPassword || !password.newPassword || !password.confirmPassword) {
      setPassError('All fields are required'); return;
    }
    if (password.newPassword !== password.confirmPassword) {
      setPassError('New passwords do not match'); return;
    }
    if (password.newPassword.length < 6) {
      setPassError('Password must be at least 6 characters'); return;
    }
    setPassSaving(true);
    try {
      await changePassword({
        currentPassword: password.currentPassword,
        newPassword:     password.newPassword,
      });
      setPassSuccess(true);
      setPassword(initialPassword);
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPassSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 text-sm">Loading settings...</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and business profile</p>
      </div>

      {/* Account info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <User size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Account Information</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 font-bold text-lg">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs">
              Active Account
            </span>
          </div>
        </div>
      </div>

      {/* Business Profile */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Business Profile</h2>
          </div>
          <p className="text-xs text-gray-500">Used in email reminders</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Business Name</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input name="businessName" value={business.businessName} onChange={handleBizChange}
                placeholder="e.g. Sharma Water Solutions"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Business Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input name="businessPhone" value={business.businessPhone} onChange={handleBizChange}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Business Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input name="businessEmail" value={business.businessEmail} onChange={handleBizChange}
                  placeholder="e.g. info@yourwater.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">City</label>
              <input name="city" value={business.city} onChange={handleBizChange}
                placeholder="e.g. Jaipur"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Address</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input name="businessAddress" value={business.businessAddress} onChange={handleBizChange}
                  placeholder="Shop/office address"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSaveBusiness} disabled={bizSaving}
          className={`mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
            bizSuccess
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}>
          {bizSuccess
            ? <><CheckCircle size={15} /> Saved!</>
            : bizSaving
            ? 'Saving...'
            : <><Save size={15} /> Save Business Profile</>
          }
        </button>
      </div>

      {/* Reminder Settings */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={16} className="text-yellow-400" />
          <h2 className="text-sm font-semibold text-white">AMC Reminder Days</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">Send reminders this many days before AMC expires:</p>
        <div className="flex gap-3 flex-wrap">
          {[60, 45, 30, 15, 7, 3].map(day => (
            <button key={day} onClick={() => toggleReminderDay(day)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                business.reminderDays.includes(day)
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
              }`}>
              {day} days
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Currently sending at: {business.reminderDays.sort((a,b) => b-a).join(', ')} days before expiry
        </p>
        <button onClick={handleSaveBusiness} disabled={bizSaving}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition disabled:opacity-50">
          <Save size={15} /> Save Reminder Settings
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-white">Change Password</h2>
        </div>

        {passError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
            {passError}
          </div>
        )}
        {passSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-4">
            ✅ Password changed successfully!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Current Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input name="currentPassword" type={showCurrent ? 'text' : 'password'}
                value={password.currentPassword} onChange={handlePassChange}
                placeholder="Enter current password"
                className="w-full pl-9 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              <button onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">New Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input name="newPassword" type={showNew ? 'text' : 'password'}
                value={password.newPassword} onChange={handlePassChange}
                placeholder="Min 6 characters"
                className="w-full pl-9 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              <button onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Confirm New Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input name="confirmPassword" type="password"
                value={password.confirmPassword} onChange={handlePassChange}
                placeholder="Repeat new password"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <button onClick={handleChangePassword} disabled={passSaving}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition disabled:opacity-50">
          <Lock size={15} />
          {passSaving ? 'Changing...' : 'Change Password'}
        </button>
      </div>

    </div>
  );
}