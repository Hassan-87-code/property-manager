import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Home,
  DoorOpen,
  DollarSign,
  Maximize2,
  Edit2,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Property, Unit } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const PropertiesView: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  // Modals
  const [isPropModalOpen, setIsPropModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propForm, setPropForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    property_type: 'Residential Multi-Family',
    total_units: 1,
    description: '',
  });

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState({
    property_id: 0,
    unit_number: '',
    bedrooms: 1,
    bathrooms: 1.0,
    square_feet: 750,
    rent_amount: 1500,
    deposit_amount: 1500,
    status: 'vacant' as 'occupied' | 'vacant' | 'maintenance',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [propsData, unitsData] = await Promise.all([
        api.getProperties(search),
        api.getUnits(),
      ]);
      setProperties(propsData);
      setUnits(unitsData);
      if (propsData.length > 0 && selectedPropertyId === null) {
        setSelectedPropertyId(propsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load properties/units', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Handle Property Submit
  const handlePropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProperty) {
        await api.updateProperty(editingProperty.id, propForm);
      } else {
        await api.createProperty(propForm);
      }
      setIsPropModalOpen(false);
      setEditingProperty(null);
      loadData();
    } catch (err) {
      alert(`Error saving property: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleOpenPropEdit = (p: Property) => {
    setEditingProperty(p);
    setPropForm({
      name: p.name,
      address: p.address,
      city: p.city,
      state: p.state,
      zip_code: p.zip_code,
      property_type: p.property_type,
      total_units: p.total_units,
      description: p.description || '',
    });
    setIsPropModalOpen(true);
  };

  const handleDeleteProperty = async (id: number) => {
    if (!confirm('Are you sure you want to delete this property and all its units?')) return;
    try {
      await api.deleteProperty(id);
      loadData();
    } catch (err) {
      alert(`Error deleting property: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Handle Unit Submit
  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        await api.updateUnit(editingUnit.id, unitForm);
      } else {
        await api.createUnit(unitForm);
      }
      setIsUnitModalOpen(false);
      setEditingUnit(null);
      loadData();
    } catch (err) {
      alert(`Error saving unit: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleOpenUnitEdit = (u: Unit) => {
    setEditingUnit(u);
    setUnitForm({
      property_id: u.property_id,
      unit_number: u.unit_number,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      square_feet: u.square_feet,
      rent_amount: u.rent_amount,
      deposit_amount: u.deposit_amount,
      status: u.status,
    });
    setIsUnitModalOpen(true);
  };

  const handleDeleteUnit = async (id: number) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    try {
      await api.deleteUnit(id);
      loadData();
    } catch (err) {
      alert(`Error deleting unit: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const selectedUnits = units.filter((u) => u.property_id === selectedPropertyId);
  const activeProperty = properties.find((p) => p.id === selectedPropertyId);

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by property name, address, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingProperty(null);
              setPropForm({
                name: '',
                address: '',
                city: '',
                state: '',
                zip_code: '',
                property_type: 'Residential Multi-Family',
                total_units: 1,
                description: '',
              });
              setIsPropModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Properties List & Unit Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Property Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            <span>Properties ({properties.length})</span>
          </div>

          {loading && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400">Loading properties...</p>
            </div>
          )}

          {!loading && properties.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No properties found</p>
              <p className="text-xs text-slate-400 mt-1">Get started by creating your first property.</p>
            </div>
          )}

          {properties.map((p) => {
            const isSelected = p.id === selectedPropertyId;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPropertyId(p.id)}
                className={`p-4.5 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-blue-50/50 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{p.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.address}, {p.city}, {p.state} {p.zip_code}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {p.property_type}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {p.occupied_units_count} / {p.units_count} Occupied
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPropEdit(p);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProperty(p.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Units for Selected Property (7 cols) */}
        <div className="lg:col-span-7">
          {activeProperty ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
              {/* Selected Property Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{activeProperty.name}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {selectedUnits.length} Units
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeProperty.address}, {activeProperty.city}, {activeProperty.state}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingUnit(null);
                    setUnitForm({
                      property_id: activeProperty.id,
                      unit_number: '',
                      bedrooms: 1,
                      bathrooms: 1.0,
                      square_feet: 800,
                      rent_amount: 1600,
                      deposit_amount: 1600,
                      status: 'vacant',
                    });
                    setIsUnitModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Unit</span>
                </button>
              </div>

              {/* Units Grid */}
              <div className="space-y-3">
                {selectedUnits.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
                    <DoorOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No units added yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "Add Unit" to set up apartments or rooms for this property.
                    </p>
                  </div>
                ) : (
                  selectedUnits.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center font-bold text-slate-800 text-sm shadow-2xs">
                          {u.unit_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              Unit {u.unit_number}
                            </span>
                            <StatusBadge status={u.status} type="unit" />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {u.bedrooms} Bed • {u.bathrooms} Bath • {u.square_feet} sq ft
                          </p>
                          {u.current_tenant_name && (
                            <p className="text-[11px] font-medium text-blue-600 mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Tenant: {u.current_tenant_name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-bold text-slate-900">
                            ${u.rent_amount.toLocaleString()}/mo
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Dep: ${u.deposit_amount.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenUnitEdit(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUnit(u.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Select a property</p>
              <p className="text-xs text-slate-400 mt-1">
                Choose a property from the left to view and configure its units.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Property Modal */}
      <Modal
        isOpen={isPropModalOpen}
        onClose={() => setIsPropModalOpen(false)}
        title={editingProperty ? 'Edit Property' : 'Add New Property'}
        subtitle="Configure building details, address, and structure"
      >
        <form onSubmit={handlePropSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Property Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Skyline Heights Apartments"
              value={propForm.name}
              onChange={(e) => setPropForm({ ...propForm, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              required
              placeholder="e.g. 1042 Skyline Blvd"
              value={propForm.address}
              onChange={(e) => setPropForm({ ...propForm, address: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={propForm.city}
                onChange={(e) => setPropForm({ ...propForm, city: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                required
                placeholder="CO"
                value={propForm.state}
                onChange={(e) => setPropForm({ ...propForm, state: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zip Code</label>
              <input
                type="text"
                required
                placeholder="80202"
                value={propForm.zip_code}
                onChange={(e) => setPropForm({ ...propForm, zip_code: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property Type</label>
              <select
                value={propForm.property_type}
                onChange={(e) => setPropForm({ ...propForm, property_type: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Residential Multi-Family">Residential Multi-Family</option>
                <option value="Single Family Home">Single Family Home</option>
                <option value="Townhome">Townhome</option>
                <option value="Duplex">Duplex</option>
                <option value="Commercial">Commercial</option>
                <option value="Condo">Condo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Unit Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={propForm.total_units}
                onChange={(e) => setPropForm({ ...propForm, total_units: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Description</label>
            <textarea
              rows={2}
              value={propForm.description}
              onChange={(e) => setPropForm({ ...propForm, description: e.target.value })}
              placeholder="Building amenities, parking details, lockbox codes..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPropModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
            >
              {editingProperty ? 'Save Changes' : 'Create Property'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Unit Modal */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title={editingUnit ? 'Edit Unit' : 'Add New Unit'}
        subtitle={activeProperty ? `For ${activeProperty.name}` : ''}
      >
        <form onSubmit={handleUnitSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Number / ID</label>
              <input
                type="text"
                required
                placeholder="e.g. 101, 2B, Penthouse"
                value={unitForm.unit_number}
                onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={unitForm.status}
                onChange={(e) =>
                  setUnitForm({
                    ...unitForm,
                    status: e.target.value as 'occupied' | 'vacant' | 'maintenance',
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms</label>
              <input
                type="number"
                min="0"
                required
                value={unitForm.bedrooms}
                onChange={(e) => setUnitForm({ ...unitForm, bedrooms: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={unitForm.bathrooms}
                onChange={(e) => setUnitForm({ ...unitForm, bathrooms: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sq Feet</label>
              <input
                type="number"
                min="100"
                required
                value={unitForm.square_feet}
                onChange={(e) => setUnitForm({ ...unitForm, square_feet: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent ($)</label>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={unitForm.rent_amount}
                onChange={(e) => setUnitForm({ ...unitForm, rent_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Security Deposit ($)</label>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={unitForm.deposit_amount}
                onChange={(e) => setUnitForm({ ...unitForm, deposit_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUnitModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
            >
              {editingUnit ? 'Save Changes' : 'Create Unit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

