import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  FileCheck2,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  Tag,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const data = await adminService.getDashboard();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading || !metrics) {
    return <LoadingSpinner message="Querying campus administrative database..." />;
  }

  const { overview, categoryDistribution, topLocations, recentAuditLogs } = metrics;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider">
            Live Administrative Overview
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Campus Property Operations
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time aggregated relational database metrics and audit tracking.
        </p>
      </div>

      {/* METRIC STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Registered Students</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{overview.totalStudents}</p>
          <span className="text-[11px] text-slate-500">Active university accounts</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Reported Lost</span>
            <Package className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400">{overview.totalLost}</p>
          <span className="text-[11px] text-slate-500">Items missing on campus</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Reported Found</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{overview.totalFound}</p>
          <span className="text-[11px] text-slate-500">Safely registered belongings</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Successful Returns</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold text-teal-400">{overview.completedCollections}</p>
          <span className="text-[11px] text-emerald-400 font-medium">{overview.reuniteRate}% recovery rate</span>
        </div>
      </div>

      {/* SECONDARY METRICS: Claims & Active Listings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Pending Claim Verifications</span>
            <p className="text-lg font-bold text-amber-400">{overview.pendingClaims} claims waiting</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Approved Claims</span>
            <p className="text-lg font-bold text-blue-400">{overview.approvedClaims} verified</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Active Available Listings</span>
            <p className="text-lg font-bold text-purple-400">{overview.activeListings} items</p>
          </div>
        </div>
      </div>

      {/* ANALYTICS SECTION: Categories & Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Tag className="w-4 h-4 text-blue-400" />
              <span>Category Distribution</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Real DB Items Count</span>
          </div>

          <div className="space-y-3">
            {categoryDistribution.map((cat: any) => {
              const maxCount = Math.max(1, ...categoryDistribution.map((c: any) => c.count));
              const pct = Math.round((cat.count / maxCount) * 100);
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{cat.name}</span>
                    <span className="text-slate-400 font-mono font-bold">{cat.count} items</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hotspot Locations */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Frequent Report Locations</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Campus Areas</span>
          </div>

          <div className="space-y-3">
            {topLocations.map((loc: any, idx: number) => (
              <div
                key={loc.location}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/60"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/20">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{loc.location}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">{loc.count} reports</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT AUDIT LOG FEED */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Campus Security Audit Trail</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Immutable System Logs</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {recentAuditLogs.map((log: any) => (
            <div key={log.id} className="py-3 flex items-start justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-blue-300">
                    {log.action}
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="font-semibold text-slate-200">
                    {log.actor?.fullName || 'System Automated'}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">{log.details}</p>
              </div>

              <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
