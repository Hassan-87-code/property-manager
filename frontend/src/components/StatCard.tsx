import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`app-stat-card bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {trend.value}
              </span>
              <span className="text-xs text-slate-400">vs target</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBgColor} ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

