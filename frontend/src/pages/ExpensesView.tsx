import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Filter,
  DollarSign,
  Building2,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  PieChart,
  Tag,
  Wrench,
} from 'lucide-react';
import { Expense, Property, Unit, Worker, CategoryExpenseSummary } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [summary, setSummary] = useState<CategoryExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    property_id: 0,
    unit_id: '' as string | number,
    worker_id: '' as string | number,
    category: 'Repairs & Maintenance',
    amount: 150,
    expense_date: new Date().toISOString().split('T')[0],
    payee_vendor: '',
    payment_method: 'Credit Card',
    status: 'paid' as 'paid' | 'pending' | 'scheduled',
    receipt_ref: '',
    notes: '',
  });

  const categories = [
    'Repairs & Maintenance',
    'Utilities',
    'Property Taxes',
    'Insurance',
    'Mortgage',
    'Contractor Wages',
    'Supplies',
    'Management Fees',
    'Other',
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [expData, propsData, unitsData, workersData, sumData] = await Promise.all([
        api.getExpenses(
          propertyFilter === 'all' ? undefined : Number(propertyFilter),
          categoryFilter === 'all' ? undefined : categoryFilter,
          undefined,
          search
        ),
        api.getProperties(),
        api.getUnits(),
        api.getWorkers(),
        api.getExpenseSummary(),
      ]);
      setExpenses(expData);
      setProperties(propsData);
      setUnits(unitsData);
      setWorkers(workersData);
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, categoryFilter, propertyFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        unit_id: formData.unit_id ? Number(formData.unit_id) : null,
        worker_id: formData.worker_id ? Number(formData.worker_id) : null,
      };

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, payload);
      } else {
        await api.createExpense(payload);
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      loadData();
    } catch (err) {
      alert(`Error saving expense: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({
      property_id: exp.property_id,
      unit_id: exp.unit_id || '',
      worker_id: exp.worker_id || '',
      category: exp.category,
      amount: exp.amount,
      expense_date: exp.expense_date,
      payee_vendor: exp.payee_vendor,
      payment_method: exp.payment_method,
      status: exp.status,
      receipt_ref: exp.receipt_ref || '',
      notes: exp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      await api.deleteExpense(id);
      loadData();
    } catch (err) {
      alert(`Error deleting expense: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Category Summary Carousel / Chips */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Category Totals
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-900">
            Total Displayed: {formatCurrency(totalExpenseAmount)}
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {summary.map((item) => (
            <button
              key={item.category}
              onClick={() => setCategoryFilter(item.category)}
              className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                categoryFilter === item.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{item.category}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  categoryFilter === item.category ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {formatCurrency(item.total)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor, payee, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setEditingExpense(null);
            setFormData({
              property_id: properties[0]?.id || 1,
              unit_id: '',
              worker_id: '',
              category: 'Repairs & Maintenance',
              amount: 150,
              expense_date: new Date().toISOString().split('T')[0],
              payee_vendor: '',
              payment_method: 'Credit Card',
              status: 'paid',
              receipt_ref: '',
              notes: '',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No expenses logged</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your utility bills, contractor payouts, or maintenance receipts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Expense & Payee</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Property & Unit</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Payment Info</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Vendor / Payee */}
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{e.payee_vendor}</p>
                        {e.notes && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{e.notes}</p>
                        )}
                        {e.worker_name && (
                          <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                            <Wrench className="w-3 h-3" /> Worker: {e.worker_name}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {e.category}
                      </span>
                    </td>

                    {/* Property / Unit */}
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-800">{e.property_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {e.unit_number ? `Unit ${e.unit_number}` : 'Whole Property'}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{e.expense_date}</span>
                      </div>
                    </td>

                    {/* Payment Info & Receipt Ref */}
                    <td className="py-4 px-4 text-slate-600">
                      <div className="space-y-0.5">
                        <p className="font-medium">{e.payment_method}</p>
                        {e.receipt_ref && (
                          <p className="text-[10px] font-mono text-slate-400">{e.receipt_ref}</p>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4">
                      <p className="text-sm font-bold text-rose-600">
                        -{formatCurrency(e.amount)}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
        subtitle="Track operating expenditures, maintenance receipts, and vendor payouts"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property</label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit (Optional)
              </label>
              <select
                value={formData.unit_id}
                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Whole Property / Common Area</option>
                {units
                  .filter((u) => u.property_id === Number(formData.property_id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unit_number}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payee / Vendor Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Home Depot, Vance Plumbing, Xcel Energy"
                value={formData.payee_vendor}
                onChange={(e) => setFormData({ ...formData, payee_vendor: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Worker / Contractor
              </label>
              <select
                value={formData.worker_id}
                onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">None / External Vendor</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.specialty})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer / ACH</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Receipt / Invoice Number
            </label>
            <input
              type="text"
              placeholder="e.g. INV-99124 or Receipt #88"
              value={formData.receipt_ref}
              onChange={(e) => setFormData({ ...formData, receipt_ref: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Detailed description of goods purchased or repair services rendered..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
            >
              {editingExpense ? 'Save Changes' : 'Log Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
