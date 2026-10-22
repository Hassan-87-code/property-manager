from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# --- Property Schemas ---
class PropertyBase(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    property_type: str = "Residential Multi-Family"
    total_units: int = 1
    description: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    property_type: Optional[str] = None
    total_units: Optional[int] = None
    description: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: int
    created_at: datetime
    units_count: Optional[int] = 0
    occupied_units_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Unit Schemas ---
class UnitBase(BaseModel):
    property_id: int
    unit_number: str
    bedrooms: int = 1
    bathrooms: float = 1.0
    square_feet: int = 750
    rent_amount: float = 0.0
    deposit_amount: float = 0.0
    status: str = "vacant"

class UnitCreate(UnitBase):
    pass

class UnitUpdate(BaseModel):
    unit_number: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    rent_amount: Optional[float] = None
    deposit_amount: Optional[float] = None
    status: Optional[str] = None

class UnitResponse(UnitBase):
    id: int
    created_at: datetime
    property_name: Optional[str] = None
    current_tenant_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Tenant Schemas ---
class TenantBase(BaseModel):
    unit_id: Optional[int] = None
    first_name: str
    last_name: str
    email: str
    phone: str
    emergency_contact: Optional[str] = None
    lease_start: date
    lease_end: date
    rent_amount: float = 0.0
    deposit_paid: float = 0.0
    status: str = "active"
    notes: Optional[str] = None

class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    unit_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None
    rent_amount: Optional[float] = None
    deposit_paid: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class TenantResponse(TenantBase):
    id: int
    created_at: datetime
    property_name: Optional[str] = None
    unit_number: Optional[str] = None

    class Config:
        from_attributes = True

# --- Rent Payment Schemas ---
class RentPaymentBase(BaseModel):
    tenant_id: int
    unit_id: Optional[int] = None
    amount_due: float
    amount_paid: float = 0.0
    due_date: date
    payment_date: Optional[date] = None
    payment_method: str = "Bank Transfer"
    status: str = "pending"
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class RentPaymentCreate(RentPaymentBase):
    pass

class RentPaymentRecord(BaseModel):
    amount_paid: float
    payment_date: date
    payment_method: str = "Bank Transfer"
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class RentPaymentUpdate(BaseModel):
    amount_due: Optional[float] = None
    amount_paid: Optional[float] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class RentPaymentResponse(RentPaymentBase):
    id: int
    created_at: datetime
    tenant_name: Optional[str] = None
    unit_number: Optional[str] = None
    property_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Worker Schemas ---
class WorkerBase(BaseModel):
    name: str
    specialty: str
    phone: str
    email: Optional[str] = None
    hourly_rate: float = 45.0
    company_name: Optional[str] = None
    status: str = "available"
    notes: Optional[str] = None

class WorkerCreate(WorkerBase):
    pass

class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    hourly_rate: Optional[float] = None
    company_name: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class WorkerResponse(WorkerBase):
    id: int
    created_at: datetime
    active_jobs_count: Optional[int] = 0
    completed_jobs_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Work Order Schemas ---
class WorkOrderBase(BaseModel):
    title: str
    description: str
    property_id: int
    unit_id: Optional[int] = None
    worker_id: Optional[int] = None
    priority: str = "medium"
    status: str = "reported"
    estimated_cost: float = 0.0
    actual_cost: float = 0.0
    hours_spent: float = 0.0
    reported_date: date = Field(default_factory=date.today)
    completed_date: Optional[date] = None

class WorkOrderCreate(WorkOrderBase):
    pass

class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_id: Optional[int] = None
    unit_id: Optional[int] = None
    worker_id: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    hours_spent: Optional[float] = None
    completed_date: Optional[date] = None

class WorkOrderResponse(WorkOrderBase):
    id: int
    created_at: datetime
    property_name: Optional[str] = None
    unit_number: Optional[str] = None
    worker_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Expense Schemas ---
class ExpenseBase(BaseModel):
    property_id: int
    unit_id: Optional[int] = None
    worker_id: Optional[int] = None
    category: str
    amount: float
    expense_date: date
    payee_vendor: str
    payment_method: str = "Credit Card"
    status: str = "paid"
    receipt_ref: Optional[str] = None
    notes: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    property_id: Optional[int] = None
    unit_id: Optional[int] = None
    worker_id: Optional[int] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    expense_date: Optional[date] = None
    payee_vendor: Optional[str] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    receipt_ref: Optional[str] = None
    notes: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    id: int
    created_at: datetime
    property_name: Optional[str] = None
    unit_number: Optional[str] = None
    worker_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Dashboard & Analytics Schemas ---
class CategoryExpenseSummary(BaseModel):
    category: str
    total: float

class MonthlyFinancialTrend(BaseModel):
    month: str
    income: float
    expense: float
    net: float

class DashboardStats(BaseModel):
    total_properties: int
    total_units: int
    occupied_units: int
    vacant_units: int
    occupancy_rate: float
    total_tenants: int
    monthly_expected_rent: float
    monthly_collected_rent: float
    monthly_expenses: float
    monthly_net_operating_income: float
    pending_rents_count: int
    open_work_orders_count: int
    active_workers_count: int
    expenses_by_category: List[CategoryExpenseSummary]
    monthly_trends: List[MonthlyFinancialTrend]
    recent_payments: List[RentPaymentResponse]
    recent_work_orders: List[WorkOrderResponse]

