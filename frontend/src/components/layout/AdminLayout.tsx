import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileCheck2,
  Users,
  Compass,
  ArrowLeft,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview & Analytics', end: true },
    { to: '/admin/items', icon: Package, label: 'All Item Listings' },
    { to: '/admin/claims', icon: FileCheck2, label: 'Claims Management' },
    { to: '/admin/users', icon: Users, label: 'Students & Users' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar on desktop */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">
                Admin<span className="text-blue-500">Console</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">CampusConnect Administration</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-500/30">
            {user?.fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-[10px] text-blue-400 font-mono">CAMPUS ADMINISTRATOR</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Return to Student Portal / Logout */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            to="/browse"
            className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Public Portal</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
