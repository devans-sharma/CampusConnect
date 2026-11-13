import React, { useState, useEffect } from 'react';
import { Search, Users, ShieldAlert, CheckCircle2, UserX, UserCheck } from 'lucide-react';
import { adminService } from '../services/adminService';
import { User } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getUsers({
        search: search.trim() || undefined,
        role: role || undefined,
        status: status || undefined,
        page,
        limit: 15,
      });
      setUsers(data.users || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, role, status, page]);

  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to change ${user.fullName}'s account status to ${nextStatus}?`)) {
      return;
    }
    try {
      await adminService.toggleUserStatus(user.id, nextStatus);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">University Student &amp; User Accounts</h1>
        <p className="text-xs text-slate-400 mt-1">
          Search student IDs, monitor activity participation, and manage access status.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student ID, name, email, department..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <LoadingSpinner message="Loading user directory from database..." />
      ) : users.length > 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Student / User</th>
                  <th className="px-5 py-3.5">Student ID</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5">Activity</th>
                  <th className="px-5 py-3.5 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-5 py-4">
                      <span className="font-semibold text-white block">{u.fullName}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">{u.email}</span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-blue-400">
                      {u.studentId}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white block">{u.department}</span>
                      <span className="text-[10px] text-slate-500">Year {u.yearOfStudy || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.accountStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                      {u._count?.items || 0} reports &bull; {u._count?.claims || 0} claims
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            u.accountStatus === 'ACTIVE'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {u.accountStatus === 'ACTIVE' ? 'Suspend Account' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
          No students or users found.
        </div>
      )}
    </div>
  );
};
