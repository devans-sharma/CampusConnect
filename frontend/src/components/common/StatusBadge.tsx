import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'type' | 'status';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status', className = '' }) => {
  // Item type badge
  if (type === 'type' || status === 'LOST' || status === 'FOUND') {
    if (status === 'LOST') {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
          LOST
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
        FOUND
      </span>
    );
  }

  // Lifecycle status badge
  const statusStyles: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    ACTIVE: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Active Listing' },
    CLAIM_PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Claim Pending' },
    CLAIM_APPROVED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', label: 'Claim Approved' },
    AWAITING_COLLECTION: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', label: 'Awaiting Collection' },
    RETURNED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Reunited / Returned' },
    RESOLVED: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', label: 'Resolved' },
    MATCHED: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', label: 'Match Found' },
    CLOSED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400', label: 'Closed' },
    
    // Claim statuses
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Pending Review' },
    UNDER_REVIEW: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Under Review' },
    ADDITIONAL_INFORMATION_REQUIRED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', label: 'More Info Needed' },
    APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Approved' },
    REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', label: 'Declined' },
    
    // Collection statuses
    SCHEDULED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', label: 'Pickup Scheduled' },
    READY_FOR_PICKUP: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', label: 'Ready for Pickup' },
    COLLECTED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Collected' },
  };

  const current = statusStyles[status] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: status.replace(/_/g, ' '),
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${current.bg} ${current.text} border ${current.border} ${className}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${current.dot}`}></span>
      {current.label}
    </span>
  );
};
