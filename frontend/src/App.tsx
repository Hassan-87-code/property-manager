import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './pages/DashboardView';
import { PropertiesView } from './pages/PropertiesView';
import { TenantsView } from './pages/TenantsView';
import { RentsView } from './pages/RentsView';
import { ExpensesView } from './pages/ExpensesView';
import { WorkersView } from './pages/WorkersView';
import { DashboardStats, RentPayment } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [dashboardAsOf, setDashboardAsOf] = useState<Date | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resettingSeed, setResettingSeed] = useState(false);
  const [selectedTenantForRent, setSelectedTenantForRent] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadDashboardStats = useCallback(async () => {
    const retryBriefly = async <T,>(load: () => Promise<T>): Promise<T> => {
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          return await load();
        } catch (error) {
          lastError = error;
          if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
      throw lastError;
    };

    try {
      setLoading(true);
      setDashboardError(null);
      const [statsResult, paymentsResult] = await Promise.allSettled([
        retryBriefly(api.getDashboardStats),
        retryBriefly(api.getRents),
      ]);

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
        setDashboardAsOf(new Date());
      } else {
        console.error('Failed to load dashboard metrics', statsResult.reason);
        setDashboardError(statsResult.reason instanceof Error ? statsResult.reason.message : String(statsResult.reason));
      }

      if (paymentsResult.status === 'fulfilled') {
        setRentPayments(paymentsResult.value);
      } else {
        console.warn('Rent reminders could not be refreshed', paymentsResult.reason);
        setRentPayments([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats, activeTab]);

  const handleResetSeed = async () => {
    if (!confirm('Reset the database with complete fresh demo data for properties, tenants, rents, and workers?')) return;
    try {
      setResettingSeed(true);
      await api.resetDatabase();
      showToast('Database reset and re-seeded successfully!');
      loadDashboardStats();
    } catch (err) {
      alert(`Error resetting demo database: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setResettingSeed(false);
    }
  };

  const handleQuickAction = (action: 'rent' | 'expense' | 'work_order' | 'tenant') => {
    if (action === 'rent') {
      setSelectedTenantForRent(null);
      setActiveTab('rents');
    } else if (action === 'expense') setActiveTab('expenses');
    else if (action === 'work_order') setActiveTab('workers');
    else setActiveTab('tenants');
  };

  const handleQuickPayFromTenant = (tenantId: number) => {
    setSelectedTenantForRent(tenantId);
    setActiveTab('rents');
  };

  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased selection:bg-blue-500 selection:text-white">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onResetSeed={handleResetSeed}
        resetting={resettingSeed}
      />
      <div className="app-workspace flex-1 flex flex-col md:pl-64 min-w-0 transition-all">
        <Header activeTab={activeTab} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} onRefresh={loadDashboardStats} loading={loading} />
        <main className="app-content flex-1 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
          {activeTab === 'dashboard' && <DashboardView stats={stats} rentPayments={rentPayments} asOfDate={dashboardAsOf} error={dashboardError} onRetry={loadDashboardStats} onNavigate={(tab) => setActiveTab(tab)} onQuickAction={handleQuickAction} />}
          {activeTab === 'properties' && <PropertiesView />}
          {activeTab === 'tenants' && <TenantsView onQuickPay={handleQuickPayFromTenant} />}
          {activeTab === 'rents' && <RentsView initialTenantId={selectedTenantForRent} />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'workers' && <WorkersView />}
        </main>
      </div>
    </div>
  );
}

export default App;
