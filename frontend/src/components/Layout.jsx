import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Wrench,
  Receipt, BarChart3, Droplets, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users,            label: 'Customers' },
  { to: '/service',   icon: Wrench,           label: 'Service Visits' },
  { to: '/payments',  icon: Receipt,          label: 'Payments' },
  { to: '/reports',   icon: BarChart3,        label: 'Reports' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Get initials from name
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex h-screen bg-gray-950 text-white">

      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-800">
          <div className="bg-blue-500 p-2 rounded-xl">
            <Droplets size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Water AMC</p>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-widest mb-3 px-3">Menu</p>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
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
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gray-900 border-b border-gray-800 rounded-lg px-8 py-4 flex items-center justify-between flex-shrink-0">
          <p className="text-lg text-gray-300">Water Solutions Sikar</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm text-gray-300">{user?.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-gray-950">
          <Outlet />
        </main>
      </div>

    </div>
  );
}