import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Phone,
  Mail,
  Building2,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Receipt,
  UserCheck,
  ArrowRight,
  ChevronRight,
  HardHat,
} from 'lucide-react';
import { Worker, WorkOrder, Property, Unit } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const WorkersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'work_orders' | 'directory'>('work_orders');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modals
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    specialty: 'Plumbing',
    phone: '',
    email: '',
    hourly_rate: 65,
    company_name: '',
    status: 'available' as 'available' | 'busy' | 'inactive',
    notes: '',
  });

  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [orderForm, setOrderForm] = useState({
    title: '',
    description: '',
    property_id: 0,
    unit_id: '' as string | number,
    worker_id: '' as string | number,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'emergency',
    status: 'reported' as 'reported' | 'assigned' | 'in_progress' | 'completed' | 'cancelled',
    estimated_cost: 150,
    actual_cost: 0,
    hours_spent: 0,
    reported_date: new Date().toISOString().split('T')[0],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [workersData, ordersData, propsData, unitsData] = await Promise.all([
        api.getWorkers(undefined, undefined, search),
        api.getWorkOrders(
          undefined,
          statusFilter === 'all' ? undefined : statusFilter,
          priorityFilter === 'all' ? undefined : priorityFilter,
          undefined,
          search
        ),
        api.getProperties(),
        api.getUnits(),
      ]);
      setWorkers(workersData);
      setWorkOrders(ordersData);
      setProperties(propsData);
      setUnits(unitsData);
    } catch (err) {
      console.error('Failed to load workers/work orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, priorityFilter, activeTab]);

  // Worker Handlers
  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await api.updateWorker(editingWorker.id, workerForm);
      } else {
        await api.createWorker(workerForm);
      }
      setIsWorkerModalOpen(false);
      setEditingWorker(null);
      loadData();
    } catch (err) {
      alert(`Error saving worker: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEditWorker = (w: Worker) => {
    setEditingWorker(w);
    setWorkerForm({
      name: w.name,
      specialty: w.specialty,
      phone: w.phone,
      email: w.email || '',
      hourly_rate: w.hourly_rate,
      company_name: w.company_name || '',
      status: w.status,
      notes: w.notes || '',
    });
    setIsWorkerModalOpen(true);
  };

  const handleDeleteWorker = async (id: number) => {
    if (!confirm('Are you sure you want to remove this contractor?')) return;
    try {
      await api.deleteWorker(id);
      loadData();
    } catch (err) {
      alert(`Error deleting worker: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Work Order Handlers
  const handleWorkOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...orderForm,
        unit_id: orderForm.unit_id ? Number(orderForm.unit_id) : null,
        worker_id: orderForm.worker_id ? Number(orderForm.worker_id) : null,
      };

      if (editingWorkOrder) {
        await api.updateWorkOrder(editingWorkOrder.id, payload);
      } else {
        await api.createWorkOrder(payload);
      }
      setIsWorkOrderModalOpen(false);
      setEditingWorkOrder(null);
      loadData();
    } catch (err) {
      alert(`Error saving work order: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEditWorkOrder = (wo: WorkOrder) => {
    setEditingWorkOrder(wo);
    setOrderForm({
      title: wo.title,
      description: wo.description,
      property_id: wo.property_id,
      unit_id: wo.unit_id || '',
      worker_id: wo.worker_id || '',
      priority: wo.priority,
      status: wo.status,
      estimated_cost: wo.estimated_cost,
      actual_cost: wo.actual_cost,
      hours_spent: wo.hours_spent,
      reported_date: wo.reported_date,
    });
    setIsWorkOrderModalOpen(true);
  };

  const handleQuickStatusChange = async (wo: WorkOrder, newStatus: WorkOrder['status']) => {
    try {
      await api.updateWorkOrder(wo.id, {
        status: newStatus,
        completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null,
      });
      loadData();
    } catch (err) {
      alert(`Error updating status: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleConvertToExpense = async (woId: number) => {
    try {
      const res = await api.convertToExpense(woId);
      alert(`${res.message}! Created Expense record #${res.expense_id}.`);
    } catch (err) {
      alert(`Error creating expense: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteWorkOrder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work order?')) return;
    try {
      await api.deleteWorkOrder(id);
      loadData();
    } catch (err) {
      alert(`Error deleting work order: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

  const openTicketsCount = workOrders.filter((w) => ['reported', 'assigned', 'in_progress'].includes(w.status)).length;
  const emergencyCount = workOrders.filter((w) => w.priority === 'emergency' && w.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Work Orders vs Contractor Directory */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('work_orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'work_orders'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Work Orders & Tasks</span>
            {openTicketsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                {openTicketsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>Workers & Contractors ({workers.length})</span>
          </button>
        </div>

        <div>
          {activeTab === 'work_orders' ? (
            <button
              onClick={() => {
                setEditingWorkOrder(null);
                setOrderForm({
                  title: '',
                  description: '',
                  property_id: properties[0]?.id || 1,
                  unit_id: '',
                  worker_id: '',
                  priority: 'medium',
                  status: 'reported',
                  estimated_cost: 150,
                  actual_cost: 0,
                  hours_spent: 0,
                  reported_date: new Date().toISOString().split('T')[0],
                });
                setIsWorkOrderModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Work Order</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingWorker(null);
                setWorkerForm({
                  name: '',
                  specialty: 'Plumbing',
                  phone: '',
                  email: '',
                  hourly_rate: 65,
                  company_name: '',
                  status: 'available',
                  notes: '',
                });
                setIsWorkerModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Worker</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: WORK ORDERS LIST */}
      {activeTab === 'work_orders' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Tasks</p>
                <h4 className="text-xl font-bold text-slate-900 mt-0.5">{openTicketsCount} Active</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emergency Priority</p>
                <h4 className={`text-xl font-bold mt-0.5 ${emergencyCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {emergencyCount} Urgent
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Repairs</p>
                <h4 className="text-xl font-bold text-emerald-600 mt-0.5">
                  {workOrders.filter((w) => w.status === 'completed').length} Finished
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket title, property, worker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="all">All Priorities</option>
                <option value="emergency">Emergency</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Work Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full p-12 text-center text-xs text-slate-400">Loading work orders...</div>
            ) : workOrders.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No work orders found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Create a work order whenever a tenant reports a maintenance issue.
                </p>
              </div>
            ) : (
              workOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all space-y-4"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={wo.priority} type="priority" />
                        <span className="text-[11px] font-mono text-slate-400">#{wo.id}</span>
                      </div>
                      <StatusBadge status={wo.status} type="work_order" />
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{wo.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {wo.description}
                    </p>
                  </div>

                  {/* Property & Worker Meta */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">Location:</span>
                      <span className="font-semibold text-slate-800">
                        {wo.property_name} • Unit {wo.unit_number || 'Common Area'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">Assigned Worker:</span>
                      <span className="font-semibold text-blue-600">
                        {wo.worker_name || 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">Reported Date:</span>
                      <span className="text-slate-600 font-medium">{wo.reported_date}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60 font-semibold">
                      <span className="text-slate-500">Cost (Est / Actual):</span>
                      <span className="text-slate-900">
                        {formatCurrency(wo.estimated_cost)} /{' '}
                        <span className={wo.actual_cost > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {wo.actual_cost > 0 ? formatCurrency(wo.actual_cost) : 'Pending'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    {/* Status Toggle Quick Buttons */}
                    <div className="flex items-center gap-1">
                      {wo.status !== 'completed' ? (
                        <button
                          onClick={() => handleQuickStatusChange(wo, 'completed')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConvertToExpense(wo.id)}
                          title="Post repair cost directly into property expenses ledger"
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>To Expense</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditWorkOrder(wo)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkOrder(wo.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CONTRACTORS & WORKERS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {w.name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{w.name}</h4>
                        <p className="text-xs text-blue-600 font-semibold">{w.specialty}</p>
                      </div>
                    </div>
                    <StatusBadge status={w.status} type="worker" />
                  </div>

                  {w.company_name && (
                    <p className="text-xs font-medium text-slate-600 mb-2">
                      {w.company_name}
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{w.phone}</span>
                    </div>
                    {w.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{w.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Rate:</span>{' '}
                    <span className="font-bold text-slate-900">${w.hourly_rate}/hr</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditWorker(w)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWorker(w.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Order Modal */}
      <Modal
        isOpen={isWorkOrderModalOpen}
        onClose={() => setIsWorkOrderModalOpen(false)}
        title={editingWorkOrder ? 'Edit Work Order' : 'Create Work Order'}
        subtitle="Maintenance task assignment and repair estimates"
      >
        <form onSubmit={handleWorkOrderSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Water heater leaking, Door latch broken"
              value={orderForm.title}
              onChange={(e) => setOrderForm({ ...orderForm, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              required
              placeholder="Describe symptoms, location in unit, parts needed..."
              value={orderForm.description}
              onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property</label>
              <select
                value={orderForm.property_id}
                onChange={(e) => setOrderForm({ ...orderForm, property_id: Number(e.target.value) })}
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
                value={orderForm.unit_id}
                onChange={(e) => setOrderForm({ ...orderForm, unit_id: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Building Exterior / Common Area</option>
                {units
                  .filter((u) => u.property_id === Number(orderForm.property_id))
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign Worker
              </label>
              <select
                value={orderForm.worker_id}
                onChange={(e) => setOrderForm({ ...orderForm, worker_id: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Leave Unassigned --</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.specialty}) - ${w.hourly_rate}/hr
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={orderForm.priority}
                onChange={(e) =>
                  setOrderForm({
                    ...orderForm,
                    priority: e.target.value as 'low' | 'medium' | 'high' | 'emergency',
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="emergency">EMERGENCY (Immediate)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={orderForm.status}
                onChange={(e) =>
                  setOrderForm({
                    ...orderForm,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="reported">Reported</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Cost ($)
              </label>
              <input
                type="number"
                min="0"
                value={orderForm.estimated_cost}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, estimated_cost: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Actual Cost ($)
              </label>
              <input
                type="number"
                min="0"
                value={orderForm.actual_cost}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, actual_cost: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsWorkOrderModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
            >
              {editingWorkOrder ? 'Save Changes' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Worker Modal */}
      <Modal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        title={editingWorker ? 'Edit Contractor Profile' : 'Add Worker / Contractor'}
        subtitle="Manage professional trades, hourly rates, and contact details"
      >
        <form onSubmit={handleWorkerSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={workerForm.name}
                onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty / Trade</label>
              <select
                value={workerForm.specialty}
                onChange={(e) => setWorkerForm({ ...workerForm, specialty: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="HVAC">HVAC & Heating</option>
                <option value="General Maintenance">General Handyman</option>
                <option value="Roofing">Roofing & Gutters</option>
                <option value="Painting">Painting & Drywall</option>
                <option value="Cleaning & Turnover">Cleaning & Turnover</option>
                <option value="Landscaping">Landscaping & Snow Removal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={workerForm.phone}
                onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={workerForm.email}
                onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                min="0"
                required
                value={workerForm.hourly_rate}
                onChange={(e) =>
                  setWorkerForm({ ...workerForm, hourly_rate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Availability</label>
              <select
                value={workerForm.status}
                onChange={(e) =>
                  setWorkerForm({
                    ...workerForm,
                    status: e.target.value as 'available' | 'busy' | 'inactive',
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="available">Available</option>
                <option value="busy">Busy / On Job</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / DBA Name</label>
            <input
              type="text"
              placeholder="e.g. Apex Plumbing LLC"
              value={workerForm.company_name}
              onChange={(e) => setWorkerForm({ ...workerForm, company_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsWorkerModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
            >
              {editingWorker ? 'Save Changes' : 'Add Contractor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
