import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Calendar,
  Building2,
  DollarSign,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Tenant, Unit, Property } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../utils/currency';

interface TenantsViewProps {
  onQuickPay?: (tenantId: number) => void;
}

export const TenantsView: React.FC<TenantsViewProps> = ({ onQuickPay }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'past'>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    unit_id: '' as string | number,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    lease_start: '',
    lease_end: '',
    rent_amount: 65000,
    deposit_paid: 65000,
    status: 'active' as 'active' | 'past' | 'pending',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, unitsData, propsData] = await Promise.all([
        api.getTenants(search, statusFilter === 'all' ? undefined : statusFilter),
        api.getUnits(),
        api.getProperties(),
      ]);
      setTenants(tenantsData);
      setUnits(unitsData);
      setProperties(propsData);
    } catch (err) {
      console.error('Failed to load tenants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        unit_id: formData.unit_id ? Number(formData.unit_id) : null,
      };

      if (editingTenant) {
        await api.updateTenant(editingTenant.id, payload);
      } else {
        await api.createTenant(payload);
      }
      setIsModalOpen(false);
      setEditingTenant(null);
      loadData();
    } catch (err) {
      alert(`Error saving tenant: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEdit = (t: Tenant) => {
    setEditingTenant(t);
    setFormData({
      unit_id: t.unit_id || '',
      first_name: t.first_name,
      last_name: t.last_name,
      email: t.email,
      phone: t.phone,
      emergency_contact: t.emergency_contact || '',
      lease_start: t.lease_start,
      lease_end: t.lease_end,
      rent_amount: t.rent_amount,
      deposit_paid: t.deposit_paid,
      status: t.status,
      notes: t.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this tenant? The unit will be marked vacant.')) return;
    try {
      await api.deleteTenant(id);
      loadData();
    } catch (err) {
      alert(`Error deleting tenant: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Helper to get unit label
  const getUnitOptionLabel = (u: Unit) => {
    const prop = properties.find((p) => p.id === u.property_id);
    return `${prop ? prop.name : 'Prop'} - Unit ${u.unit_number} (${u.status})`;
  };

  return (
    <div className="app-page space-y-6">
      {/* Top Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['all', 'active', 'pending', 'past'] as const).map((status) => (
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

        <button
          onClick={() => {
            setEditingTenant(null);
            setFormData({
              unit_id: units.find((u) => u.status === 'vacant')?.id || '',
              first_name: '',
              last_name: '',
              email: '',
              phone: '',
              emergency_contact: '',
              lease_start: new Date().toISOString().split('T')[0],
              lease_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString()
                .split('T')[0],
              rent_amount: 65000,
              deposit_paid: 65000,
              status: 'active',
              notes: '',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tenant</span>
        </button>
      </div>

      {/* Tenants Table & Cards */}
      <div className="app-panel bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-xs text-slate-400">Loading tenants...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No tenants found</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first tenant or clear search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Tenant Name</th>
                  <th className="py-3.5 px-4">Property & Unit</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Lease Term</th>
                  <th className="py-3.5 px-4">Rent / Deposit</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Initials */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {t.first_name[0]}
                          {t.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {t.first_name} {t.last_name}
                          </p>
                          {t.emergency_contact && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              Emerg: {t.emergency_contact}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Property & Unit */}
                    <td className="py-4 px-4">
                      {t.property_name ? (
                        <div>
                          <p className="font-semibold text-slate-800">{t.property_name}</p>
                          <p className="text-[11px] text-blue-600 font-medium">
                            Unit {t.unit_number}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Contact Info */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs">{t.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs">{t.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Lease Term */}
                    <td className="py-4 px-4">
                      <div className="text-slate-600">
                        <p className="font-medium text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {t.lease_start}
                        </p>
                        <p className="text-[11px] text-slate-500">to {t.lease_end}</p>
                      </div>
                    </td>

                    {/* Rent & Deposit */}
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {formatCurrency(t.rent_amount)}
                          <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Dep: {formatCurrency(t.deposit_paid)}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <StatusBadge status={t.status} type="tenant" />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onQuickPay && t.status === 'active' && (
                          <button
                            onClick={() => onQuickPay(t.id)}
                            title="Record Payment"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
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

      {/* Add / Edit Tenant Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTenant ? 'Edit Tenant Profile' : 'New Tenant Lease'}
        subtitle="Record leasing contract details and assigned apartment"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(303) 555-0100"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Unit</label>
              <select
                value={formData.unit_id}
                onChange={(e) => {
                  const uId = e.target.value;
                  const selectedU = units.find((u) => u.id === Number(uId));
                  setFormData({
                    ...formData,
                    unit_id: uId,
                    rent_amount: selectedU ? selectedU.rent_amount : formData.rent_amount,
                    deposit_paid: selectedU ? selectedU.deposit_amount : formData.deposit_paid,
                  });
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Select a Unit --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getUnitOptionLabel(u)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'active' | 'past' | 'pending',
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="active">Active (Currently Residing)</option>
                <option value="pending">Pending Move-In</option>
                <option value="past">Past Tenant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lease Start Date</label>
              <input
                type="date"
                required
                value={formData.lease_start}
                onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lease End Date</label>
              <input
                type="date"
                required
                value={formData.lease_end}
                onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Agreed Monthly Rent (KSh)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.rent_amount}
                onChange={(e) => setFormData({ ...formData, rent_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deposit Paid (KSh)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.deposit_paid}
                onChange={(e) => setFormData({ ...formData, deposit_paid: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
            <input
              type="text"
              placeholder="e.g. John Doe (Father) - (555) 123-4567"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant Notes / Pets / Parking</label>
            <textarea
              rows={2}
              placeholder="e.g. Assigned parking spot #12, 1 pet cat registered..."
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
              {editingTenant ? 'Save Changes' : 'Create Tenant Lease'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
