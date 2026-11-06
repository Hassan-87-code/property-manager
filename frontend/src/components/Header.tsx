import React from 'react';
import { Menu, RefreshCw, Calendar } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Management Dashboard',
    subtitle: 'High-level portfolio overview, occupancy rates, and cash flow',
  },
  properties: {
    title: 'Properties & Units',
    subtitle: 'Manage buildings, multi-family units, and leasing status',
  },
  tenants: {
    title: 'Tenant Directory',
    subtitle: 'Lease tracking, contact details, and payment histories',
  },
  rents: {
    title: 'Rent Collection',
    subtitle: 'Track rent payments, invoices, balances, and overdue accounts',
  },
  expenses: {
    title: 'Operating Expenses',
    subtitle: 'Monitor property maintenance, utility bills, taxes, and vendor invoices',
  },
  workers: {
    title: 'Workers & Work Orders',
    subtitle: 'Contractor directory, repair tasks, and maintenance coordination',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onRefresh,
  loading,
}) => {
  const current = TAB_TITLES[activeTab];
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="app-header sticky top-0 z-30 h-[76px] bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-5 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="app-header-title text-xl font-bold text-slate-900 tracking-tight leading-tight">
            {current.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block font-medium">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="app-date hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-600 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Data"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
};

