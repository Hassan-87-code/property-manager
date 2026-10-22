export interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  total_units: number;
  description?: string;
  created_at: string;
  units_count: number;
  occupied_units_count: number;
}

export interface Unit {
  id: number;
  property_id: number;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  rent_amount: number;
  deposit_amount: number;
  status: 'occupied' | 'vacant' | 'maintenance';
  created_at: string;
  property_name?: string;
  current_tenant_name?: string;
}

export interface Tenant {
  id: number;
  unit_id?: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  emergency_contact?: string;
  lease_start: string;
  lease_end: string;
  rent_amount: number;
  deposit_paid: number;
  status: 'active' | 'past' | 'pending';
  notes?: string;
  created_at: string;
  property_name?: string;
  unit_number?: string;
}

export interface RentPayment {
  id: number;
  tenant_id: number;
  unit_id?: number | null;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  payment_date?: string | null;
  payment_method: string;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  reference_number?: string;
  notes?: string;
  created_at: string;
  tenant_name?: string;
  unit_number?: string;
  property_name?: string;
}

export interface Worker {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  email?: string;
  hourly_rate: number;
  company_name?: string;
  status: 'available' | 'busy' | 'inactive';
  notes?: string;
  created_at: string;
  active_jobs_count: number;
  completed_jobs_count: number;
}

export interface WorkOrder {
  id: number;
  title: string;
  description: string;
  property_id: number;
  unit_id?: number | null;
  worker_id?: number | null;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'reported' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  estimated_cost: number;
  actual_cost: number;
  hours_spent: number;
  reported_date: string;
  completed_date?: string | null;
  created_at: string;
  property_name?: string;
  unit_number?: string;
  worker_name?: string;
}

export interface Expense {
  id: number;
  property_id: number;
  unit_id?: number | null;
  worker_id?: number | null;
  category: string;
  amount: number;
  expense_date: string;
  payee_vendor: string;
  payment_method: string;
  status: 'paid' | 'pending' | 'scheduled';
  receipt_ref?: string;
  notes?: string;
  created_at: string;
  property_name?: string;
  unit_number?: string;
  worker_name?: string;
}

export interface CategoryExpenseSummary {
  category: string;
  total: number;
}

export interface MonthlyFinancialTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface DashboardStats {
  total_properties: number;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  occupancy_rate: number;
  total_tenants: number;
  monthly_expected_rent: number;
  monthly_collected_rent: number;
  monthly_expenses: number;
  monthly_net_operating_income: number;
  pending_rents_count: number;
  open_work_orders_count: number;
  active_workers_count: number;
  expenses_by_category: CategoryExpenseSummary[];
  monthly_trends: MonthlyFinancialTrend[];
  recent_payments: RentPayment[];
  recent_work_orders: WorkOrder[];
}

