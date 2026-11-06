import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  Printer,
  Sparkles,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { RentPayment, Tenant } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../utils/currency';

interface RentsViewProps {
  initialTenantId?: number | null;
}

export const RentsView: React.FC<RentsViewProps> = ({ initialTenantId }) => {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'partial'>('all');
  const [generating, setGenerating] = useState(false);

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPaymentForPay, setSelectedPaymentForPay] = useState<RentPayment | null>(null);
  const [payForm, setPayForm] = useState({
    amount_paid: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    reference_number: '',
    notes: '',
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    tenant_id: '' as string | number,
    amount_due: 65000,
    amount_paid: 0,
    due_date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    status: 'pending' as 'paid' | 'partial' | 'pending' | 'overdue',
    reference_number: '',
    notes: '',
  });

  const [receiptPayment, setReceiptPayment] = useState<RentPayment | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rentsData, tenantsData] = await Promise.all([
        api.getRents(
          statusFilter === 'all' ? undefined : statusFilter,
          initialTenantId || undefined,
          search
        ),
        api.getTenants(),
      ]);
      setPayments(rentsData);
      setTenants(tenantsData);
    } catch (err) {
      console.error('Failed to load rent payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, initialTenantId]);

  // Record Payment
  const handleRecordPayment = (rent: RentPayment) => {
    setSelectedPaymentForPay(rent);
    const balance = rent.amount_due - (rent.amount_paid || 0);
    setPayForm({
      amount_paid: balance > 0 ? balance : rent.amount_due,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: rent.payment_method || 'Bank Transfer',
      reference_number: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: '',
    });
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForPay) return;
    try {
      await api.recordPayment(selectedPaymentForPay.id, payForm);
      setIsPayModalOpen(false);
      setSelectedPaymentForPay(null);
      loadData();
    } catch (err) {
      alert(`Error recording payment: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Create Rent Invoice
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRent({
        ...createForm,
        tenant_id: Number(createForm.tenant_id),
      });
      setIsCreateModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Error creating rent invoice: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Generate Monthly Rents
  const handleGenerateMonthly = async () => {
    if (!confirm('Auto-generate rent dues for all active tenants for this current month?')) return;
    try {
      setGenerating(true);
      const created = await api.generateMonthlyRents();
      alert(`Successfully generated ${created.length} new monthly rent invoices!`);
      loadData();
    } catch (err) {
      alert(`Error generating monthly rent: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rent record?')) return;
    try {
      await api.deleteRent(id);
      loadData();
    } catch (err) {
      alert(`Error deleting rent record: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Financial Summary Numbers
  const totalDue = payments.reduce((sum, p) => sum + p.amount_due, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);
  const totalOutstanding = Math.max(totalDue - totalPaid, 0);
  const overdueCount = payments.filter((p) => p.status === 'overdue').length;

  return (
    <div className="app-page space-y-6">
      {/* Top Ledger Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="app-panel bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Paid Collections
          </p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaid)}</h3>
          <p className="text-xs text-slate-400 mt-1">From recorded transactions</p>
        </div>

        <div className="app-panel bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Outstanding Balance
          </p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalOutstanding)}</h3>
          <p className="text-xs text-slate-400 mt-1">Pending and partial rent</p>
        </div>

        <div className="app-panel bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overdue Invoices
          </p>
          <h3 className={`text-2xl font-bold mt-1 ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {overdueCount} Past Due
          </h3>
          <p className="text-xs text-slate-400 mt-1">Requires follow-up</p>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by tenant name, unit, reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['all', 'paid', 'pending', 'overdue', 'partial'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateMonthly}
            disabled={generating}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{generating ? 'Generating...' : 'Auto-Generate Monthly'}</span>
          </button>

          <button
            onClick={() => {
              setCreateForm({
                tenant_id: tenants[0]?.id || '',
                amount_due: tenants[0]?.rent_amount || 65000,
                amount_paid: 0,
                due_date: new Date().toISOString().split('T')[0],
                payment_method: 'Bank Transfer',
                status: 'pending',
                reference_number: '',
                notes: '',
              });
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Rent Payments Ledger Table */}
      <div className="app-panel bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading ledger...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No rent records found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Auto-Generate Monthly" or "Create Invoice" to add rent records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Tenant & Unit</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Amount Due</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const balance = p.amount_due - (p.amount_paid || 0);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tenant & Unit */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{p.tenant_name}</p>
                          <p className="text-[11px] text-slate-400">
                            {p.property_name} • Unit {p.unit_number || 'N/A'}
                          </p>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.due_date}</span>
                        </div>
                        {p.payment_date && (
                          <p className="text-[10px] text-emerald-600 mt-0.5">
                            Paid: {p.payment_date}
                          </p>
                        )}
                      </td>

                      {/* Amount Due */}
                      <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                        {formatCurrency(p.amount_due)}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-4 px-4">
                        <p
                          className={`font-bold text-sm ${
                            p.amount_paid > 0 ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(p.amount_paid)}
                        </p>
                        {balance > 0 && p.amount_paid > 0 && (
                          <p className="text-[10px] text-amber-600 font-medium">
                            Rem: {formatCurrency(balance)}
                          </p>
                        )}
                      </td>

                      {/* Method & Ref */}
                      <td className="py-4 px-4 text-slate-600">
                        <p className="font-medium text-xs">{p.payment_method}</p>
                        {p.reference_number && (
                          <p className="text-[10px] font-mono text-slate-400">{p.reference_number}</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <StatusBadge status={p.status} type="rent" />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status !== 'paid' ? (
                            <button
                              onClick={() => handleRecordPayment(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-2xs flex items-center gap-1 transition-all active:scale-95"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Record Pay</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setReceiptPayment(p)}
                              title="View / Print Receipt"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Rent Payment"
        subtitle={
          selectedPaymentForPay
            ? `Invoice #${selectedPaymentForPay.id} for ${selectedPaymentForPay.tenant_name}`
            : ''
        }
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (KSh)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={payForm.amount_paid}
              onChange={(e) =>
                setPayForm({ ...payForm, amount_paid: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={payForm.payment_date}
                onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={payForm.payment_method}
                onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Bank Transfer">Bank Transfer (ACH)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Zelle">Zelle</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / Confirmation Number
            </label>
            <input
              type="text"
              placeholder="e.g. ACH-99210 or Check #402"
              value={payForm.reference_number}
              onChange={(e) => setPayForm({ ...payForm, reference_number: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Memo</label>
            <input
              type="text"
              placeholder="e.g. Paid in full via tenant portal"
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
            >
              Confirm & Save Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Rent Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Rent Charge / Invoice"
        subtitle="Manually create a rent invoice for a tenant"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Tenant</label>
            <select
              value={createForm.tenant_id}
              onChange={(e) => {
                const tId = e.target.value;
                const sel = tenants.find((t) => t.id === Number(tId));
                setCreateForm({
                  ...createForm,
                  tenant_id: tId,
                  amount_due: sel ? sel.rent_amount : createForm.amount_due,
                });
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">-- Choose Tenant --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name} ({t.property_name || 'Unit'} - Unit {t.unit_number || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Due (KSh)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={createForm.amount_due}
                onChange={(e) =>
                  setCreateForm({ ...createForm, amount_due: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={createForm.due_date}
                onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Notes</label>
            <input
              type="text"
              placeholder="e.g. Monthly rent + parking fee"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      {receiptPayment && (
        <Modal
          isOpen={!!receiptPayment}
          onClose={() => setReceiptPayment(null)}
          title="Rent Payment Receipt"
          subtitle={`Receipt #${receiptPayment.reference_number || receiptPayment.id}`}
        >
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Payment Confirmed</h4>
              <p className="text-xs text-slate-500">Official Landlord Rent Receipt</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Tenant:</span>
                <span className="font-bold text-slate-800">{receiptPayment.tenant_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Property / Unit:</span>
                <span className="font-semibold text-slate-800">
                  {receiptPayment.property_name} • Unit {receiptPayment.unit_number}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-semibold text-slate-800">
                  {receiptPayment.payment_date || receiptPayment.due_date}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">
                  {receiptPayment.payment_method}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono text-slate-800">
                  {receiptPayment.reference_number || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-slate-900">
                <span>Amount Paid:</span>
                <span className="text-emerald-600 text-base">
                  {formatCurrency(receiptPayment.amount_paid)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
