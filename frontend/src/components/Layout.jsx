import { useState,useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Wrench,
  Receipt, BarChart3, Droplets,
  LogOut, Menu, X, Settings,Brain
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users,            label: 'Customers' },
  { to: '/service',   icon: Wrench,           label: 'Service Visits' },
  { to: '/payments',  icon: Receipt,          label: 'Payments' },
  { to: '/reports',   icon: BarChart3,        label: 'Reports' },
  { to: '/ai',        icon: Brain,            label: 'AI Insights' },
  { to: '/settings',  icon: Settings,         label: 'Settings' },

];





export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall,   setShowInstall]   = useState(false);

  useEffect(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setInstallPrompt(e);
    setShowInstall(true);
  });
}, []);

async function handleInstall() {
  if (!installPrompt) return;
  installPrompt.prompt();
  const result = await installPrompt.userChoice;
  if (result.outcome === 'accepted') {
    setShowInstall(false);
    setInstallPrompt(null);
  }
}

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-xl">
            <Droplets size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Water AMC</p>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button onClick={() => setSidebarOpen(false)}
          className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs text-gray-600 font-medium uppercase tracking-widest mb-3 px-3">Menu</p>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ' +
              (isActive
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white')
            }>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)} />
          {/* Sidebar */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-gray-900 border-r border-gray-800 flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Install App Banner */}
{showInstall && (
  <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span>📱</span>
      <p className="text-white text-xs font-medium">
        Install Water AMC as an app on your phone!
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={handleInstall}
        className="px-3 py-1 bg-white text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition">
        Install
      </button>
      <button onClick={() => setShowInstall(false)}
        className="text-blue-200 hover:text-white text-xs">
        ✕
      </button>
    </div>
  </div>
)}

        {/* Top header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 lg:px-8 py-4 flex items-center justify-between flex-shrink-0">
          
  <div className="flex items-center gap-3">
    {/* Hamburger — mobile only */}
    <button onClick={() => setSidebarOpen(true)}
      className="lg:hidden w-9 h-9 flex items-center justify-center bg-gray-800 text-gray-400 hover:text-white rounded-xl transition">
      <Menu size={18} />
    </button>
    <p className="text-lg text-gray-200 hidden sm:block">Water Solution Sikar</p>
  </div>

  <div className="flex items-center gap-3">
    {/* Global Search */}
    <GlobalSearch />

    {/* User avatar */}
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
        {initials}
      </div>
      <span className="text-sm text-gray-300 hidden sm:block">{user?.name}</span>
    </div>
  </div>


</header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-950">
          <Outlet />
        </main>
      </div>

    </div>
  );
}