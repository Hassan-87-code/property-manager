import {
  DashboardStats,
  Property,
  Unit,
  Tenant,
  RentPayment,
  Worker,
  WorkOrder,
  Expense,
  CategoryExpenseSummary
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMsg = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),
  resetDatabase: () => request<{ message: string }>('/seed/reset', { method: 'POST' }),

  // Properties
  getProperties: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Property[]>(`/properties${q}`);
  },
  createProperty: (data: Partial<Property>) =>
    request<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProperty: (id: number, data: Partial<Property>) =>
    request<Property>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProperty: (id: number) =>
    request<{ message: string }>(`/properties/${id}`, { method: 'DELETE' }),

  // Units
  getUnits: (propertyId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (propertyId) params.append('property_id', propertyId.toString());
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Unit[]>(`/units${query}`);
  },
  createUnit: (data: Partial<Unit>) =>
    request<Unit>('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUnit: (id: number, data: Partial<Unit>) =>
    request<Unit>(`/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUnit: (id: number) =>
    request<{ message: string }>(`/units/${id}`, { method: 'DELETE' }),

  // Tenants
  getTenants: (search?: string, status?: string, unitId?: number) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (unitId) params.append('unit_id', unitId.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Tenant[]>(`/tenants${query}`);
  },
  createTenant: (data: Partial<Tenant>) =>
    request<Tenant>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTenant: (id: number, data: Partial<Tenant>) =>
    request<Tenant>(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTenant: (id: number) =>
    request<{ message: string }>(`/tenants/${id}`, { method: 'DELETE' }),

  // Rent Payments
  getRents: (status?: string, tenantId?: number, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (tenantId) params.append('tenant_id', tenantId.toString());
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<RentPayment[]>(`/rents${query}`);
  },
  createRent: (data: Partial<RentPayment>) =>
    request<RentPayment>('/rents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordPayment: (rentId: number, data: { amount_paid: number; payment_date: string; payment_method: string; reference_number?: string; notes?: string }) =>
    request<RentPayment>(`/rents/${rentId}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateMonthlyRents: () =>
    request<RentPayment[]>('/rents/generate-monthly', {
      method: 'POST',
    }),
  updateRent: (id: number, data: Partial<RentPayment>) =>
    request<RentPayment>(`/rents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRent: (id: number) =>
    request<{ message: string }>(`/rents/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: (propertyId?: number, category?: string, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (propertyId) params.append('property_id', propertyId.toString());
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Expense[]>(`/expenses${query}`);
  },
  getExpenseSummary: () => request<CategoryExpenseSummary[]>('/expenses/summary'),
  createExpense: (data: Partial<Expense>) =>
    request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExpense: (id: number, data: Partial<Expense>) =>
    request<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteExpense: (id: number) =>
    request<{ message: string }>(`/expenses/${id}`, { method: 'DELETE' }),

  // Workers
  getWorkers: (specialty?: string, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (specialty) params.append('specialty', specialty);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Worker[]>(`/workers${query}`);
  },
  createWorker: (data: Partial<Worker>) =>
    request<Worker>('/workers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateWorker: (id: number, data: Partial<Worker>) =>
    request<Worker>(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteWorker: (id: number) =>
    request<{ message: string }>(`/workers/${id}`, { method: 'DELETE' }),

  // Work Orders
  getWorkOrders: (propertyId?: number, status?: string, priority?: string, workerId?: number, search?: string) => {
    const params = new URLSearchParams();
    if (propertyId) params.append('property_id', propertyId.toString());
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (workerId) params.append('worker_id', workerId.toString());
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<WorkOrder[]>(`/work-orders${query}`);
  },
  createWorkOrder: (data: Partial<WorkOrder>) =>
    request<WorkOrder>('/work-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateWorkOrder: (id: number, data: Partial<WorkOrder>) =>
    request<WorkOrder>(`/work-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteWorkOrder: (id: number) =>
    request<{ message: string }>(`/work-orders/${id}`, { method: 'DELETE' }),
  convertToExpense: (workOrderId: number) =>
    request<{ message: string; expense_id: number }>(`/work-orders/${workOrderId}/convert-to-expense`, {
      method: 'POST',
    }),
};

