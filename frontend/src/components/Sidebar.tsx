import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  Receipt,
  Wrench,
  Sparkles,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'properties' | 'tenants' | 'rents' | 'expenses' | 'workers';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
  onResetSeed?: () => void;
  resetting?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onCloseMobile,
  onResetSeed,
  resetting,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'Properties & Units', icon: Building2 },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'rents', label: 'Rent Payments', icon: DollarSign },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'workers', label: 'Workers & Jobs', icon: Wrench },
  ];

  const handleSelect = (tab: NavTab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800`}
      >
        {/* App Branding */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-xl">
            P
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">PropManager</h1>
            <p className="text-[11px] text-slate-400 font-medium">Landlord Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Demo Seed Reset Box */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">Demo Data</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Reset with realistic sample properties, tenants & maintenance logs.
            </p>
            <button
              onClick={onResetSeed}
              disabled={resetting}
              className="w-full py-1.5 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Reload Demo Data'}
            </button>
          </div>
        </div>

        {/* User profile footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
              LM
            </div>
            <div>
              <p className="text-slate-200 font-semibold leading-tight">Admin Manager</p>
              <p className="text-[11px] text-emerald-400">Online • SQLite DB</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

