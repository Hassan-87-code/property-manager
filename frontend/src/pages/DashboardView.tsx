import React from 'react';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Receipt,
  Wrench,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  stats: DashboardStats | null;
  onNavigate: (tab: NavTab) => void;
  onQuickAction: (action: 'rent' | 'expense' | 'work_order' | 'tenant') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onNavigate,
  onQuickAction,
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Loading portfolio analytics...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const collectionPercent =
    stats.monthly_expected_rent > 0
      ? Math.round((stats.monthly_collected_rent / stats.monthly_expected_rent) * 100)
      : 0;

  // Max expense for category percentage calculation
  const totalCategoryExpenses = stats.expenses_by_category.reduce((sum, item) => sum + item.total, 0) || 1;

  // Max for trend chart bar scaling
  const maxTrend = Math.max(
    ...stats.monthly_trends.map((t) => Math.max(t.income, t.expense)),
    1000
  );

  return (
    <div className="space-y-6">
      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/20 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Portfolio Health: Optimal
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, Property Manager
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              You have {stats.occupied_units} of {stats.total_units} units occupied ({stats.occupancy_rate}%),{' '}
              {stats.pending_rents_count} pending rent payments, and {stats.open_work_orders_count} open maintenance jobs.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onQuickAction('rent')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Rent</span>
            </button>
            <button
              onClick={() => onQuickAction('expense')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 shadow-sm transition-all active:scale-95"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Log Expense</span>
            </button>
            <button
              onClick={() => onQuickAction('work_order')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 shadow-sm transition-all active:scale-95"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>New Work Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancy_rate}%`}
          subtitle={`${stats.occupied_units} Occupied / ${stats.vacant_units} Vacant Units`}
          icon={Building2}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          onClick={() => onNavigate('properties')}
        />

        <StatCard
          title="Rent Collected (Mo)"
          value={formatCurrency(stats.monthly_collected_rent)}
          subtitle={`${collectionPercent}% of ${formatCurrency(stats.monthly_expected_rent)} expected`}
          icon={DollarSign}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{
            value: `${collectionPercent}% collected`,
            isPositive: collectionPercent >= 80,
          }}
          onClick={() => onNavigate('rents')}
        />

        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(stats.monthly_expenses)}
          subtitle="Utilities, repairs, taxes & wages"
          icon={Receipt}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
          onClick={() => onNavigate('expenses')}
        />

        <StatCard
          title="Net Operating Income"
          value={formatCurrency(stats.monthly_net_operating_income)}
          subtitle="Net cash flow this month"
          icon={TrendingUp}
          iconBgColor={stats.monthly_net_operating_income >= 0 ? 'bg-indigo-50' : 'bg-rose-50'}
          iconColor={stats.monthly_net_operating_income >= 0 ? 'text-indigo-600' : 'text-rose-600'}
        />
      </div>

      {/* Two Columns: Financial Trend & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Cash Flow Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cash Flow History</h3>
              <p className="text-xs text-slate-500">6-Month Income vs Operating Expenses</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> Rent Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Expenses
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-48 border-b border-slate-100 pb-3">
              {stats.monthly_trends.map((item, idx) => {
                const incomeHeight = Math.max((item.income / maxTrend) * 100, 6);
                const expenseHeight = Math.max((item.expense / maxTrend) * 100, 6);

                return (
                  <div key={idx} className="flex flex-col items-center justify-end h-full gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] rounded-lg p-2 shadow-lg pointer-events-none z-20 whitespace-nowrap">
                      <p className="font-semibold">{item.month}</p>
                      <p className="text-emerald-300">Income: {formatCurrency(item.income)}</p>
                      <p className="text-rose-300">Exp: {formatCurrency(item.expense)}</p>
                      <p className="text-blue-200 font-bold">Net: {formatCurrency(item.net)}</p>
                    </div>

                    <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-full">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${incomeHeight}%` }}
                        className="w-3 sm:w-5 bg-blue-600 rounded-t-sm transition-all group-hover:bg-blue-500"
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${expenseHeight}%` }}
                        className="w-3 sm:w-5 bg-rose-400 rounded-t-sm transition-all group-hover:bg-rose-500"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 mt-2 truncate max-w-full">
                      {item.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick summary below chart */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                <ArrowUpRight className="w-4 h-4" />
                <span>
                  Avg Monthly Income: {formatCurrency(stats.monthly_trends.reduce((a, b) => a + b.income, 0) / 6)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 font-medium">
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span>
                  Avg Expenses: {formatCurrency(stats.monthly_trends.reduce((a, b) => a + b.expense, 0) / 6)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses by Category Breakdown (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Expense Allocation</h3>
                <p className="text-xs text-slate-500">Distribution by operational category</p>
              </div>
              <button
                onClick={() => onNavigate('expenses')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3.5">
              {stats.expenses_by_category.slice(0, 5).map((cat, i) => {
                const percent = Math.round((cat.total / totalCategoryExpenses) * 100);
                const colors = [
                  'bg-blue-600',
                  'bg-indigo-500',
                  'bg-emerald-500',
                  'bg-amber-500',
                  'bg-purple-500',
                ];
                const barColor = colors[i % colors.length];

                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 truncate max-w-[160px]">
                        {cat.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{formatCurrency(cat.total)}</span>
                        <span className="text-[11px] text-slate-400">({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">All-time Recorded Expenses</span>
            <span className="text-sm font-bold text-slate-900">
              {formatCurrency(totalCategoryExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Bottom Section: Recent Rent Payments & Active Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Rent Activity</h3>
              <p className="text-xs text-slate-500">Latest receipts and billing records</p>
            </div>
            <button
              onClick={() => onNavigate('rents')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Full Ledger &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="pb-2.5">Tenant & Unit</th>
                  <th className="pb-2.5">Amount</th>
                  <th className="pb-2.5">Date</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent_payments.slice(0, 5).map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pr-2">
                      <p className="font-semibold text-slate-800">{pay.tenant_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {pay.property_name} • Unit {pay.unit_number || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      {formatCurrency(pay.amount_paid > 0 ? pay.amount_paid : pay.amount_due)}
                    </td>
                    <td className="py-3 text-slate-500">
                      {pay.payment_date || pay.due_date}
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={pay.status} type="rent" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Work Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Maintenance & Work Orders</h3>
              <p className="text-xs text-slate-500">Assigned workers & pending repair tickets</p>
            </div>
            <button
              onClick={() => onNavigate('workers')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Manage Tasks &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {stats.recent_work_orders.slice(0, 5).map((wo) => (
              <div
                key={wo.id}
                className="flex items-start justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{wo.title}</h4>
                    <StatusBadge status={wo.priority} type="priority" />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {wo.property_name} • Unit {wo.unit_number || 'Building'}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Reported: {wo.reported_date}</span>
                    {wo.worker_name && (
                      <span className="text-blue-600 font-medium">• Assigned: {wo.worker_name}</span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={wo.status} type="work_order" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

