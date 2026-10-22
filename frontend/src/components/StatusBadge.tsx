import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'rent' | 'unit' | 'tenant' | 'work_order' | 'worker' | 'priority' | 'expense';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'rent' }) => {
  const s = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (s === 'paid' || s === 'completed' || s === 'active' || s === 'available' || s === 'occupied') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'pending' || s === 'assigned' || s === 'busy' || s === 'medium' || s === 'scheduled') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'in_progress' || s === 'partial' || s === 'high') {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (s === 'overdue' || s === 'emergency' || s === 'cancelled') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (s === 'vacant' || s === 'reported' || s === 'low') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (s === 'maintenance' || s === 'past' || s === 'inactive') {
    colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
  }

  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize tracking-wide ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {label}
    </span>
  );
};

