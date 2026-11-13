import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck2, Search, ExternalLink, Calendar, User } from 'lucide-react';
import { adminService } from '../services/adminService';
import { Claim } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AdminClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAdminClaims({
        status: status || undefined,
        page,
        limit: 15,
      });
      setClaims(data.claims || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load admin claims:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [status, page]);

  return (
    <div className="p-6 sm:p-10 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Ownership Claims Oversight</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review, approve, decline, and track ownership claims and proof submissions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-400">Filter Status:</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="ADDITIONAL_INFORMATION_REQUIRED">ADDITIONAL_INFORMATION_REQUIRED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Total: {pagination.total} claims
        </span>
      </div>

      {/* Claims Table */}
      {isLoading ? (
        <LoadingSpinner message="Querying claims records..." />
      ) : claims.length > 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Claim ID</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Target Item</th>
                  <th className="px-5 py-3.5">Claimant</th>
                  <th className="px-5 py-3.5">Submitted On</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-5 py-4 font-mono font-bold text-blue-400">
                      {c.referenceNumber}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-white block">{c.item?.itemName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.item?.referenceNumber}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-white block">{c.claimant?.fullName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.claimant?.studentId}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/claim-verification/${c.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                      >
                        <span>Review</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
          No claims found matching filter criteria.
        </div>
      )}
    </div>
  );
};
