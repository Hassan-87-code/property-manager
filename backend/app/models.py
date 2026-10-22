from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(20), nullable=False)
    property_type = Column(String(50), default="Residential Multi-Family")
    total_units = Column(Integer, default=1)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    units = relationship("Unit", back_populates="property", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="property", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="property", cascade="all, delete-orphan")


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    unit_number = Column(String(20), nullable=False)
    bedrooms = Column(Integer, default=1)
    bathrooms = Column(Float, default=1.0)
    square_feet = Column(Integer, default=750)
    rent_amount = Column(Float, default=0.0)
    deposit_amount = Column(Float, default=0.0)
    status = Column(String(30), default="vacant")  # occupied, vacant, maintenance
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="units")
    tenants = relationship("Tenant", back_populates="unit")
    rent_payments = relationship("RentPayment", back_populates="unit")
    expenses = relationship("Expense", back_populates="unit")
    work_orders = relationship("WorkOrder", back_populates="unit")


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="SET NULL"), nullable=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(40), nullable=False)
    emergency_contact = Column(String(120), nullable=True)
    lease_start = Column(Date, nullable=False)
    lease_end = Column(Date, nullable=False)
    rent_amount = Column(Float, default=0.0)
    deposit_paid = Column(Float, default=0.0)
    status = Column(String(30), default="active")  # active, past, pending
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    unit = relationship("Unit", back_populates="tenants")
    rent_payments = relationship("RentPayment", back_populates="tenant", cascade="all, delete-orphan")


class RentPayment(Base):
    __tablename__ = "rent_payments"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="SET NULL"), nullable=True)
    amount_due = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    due_date = Column(Date, nullable=False)
    payment_date = Column(Date, nullable=True)
    payment_method = Column(String(50), default="Bank Transfer")  # Bank Transfer, Credit Card, Cash, Check, Zelle
    status = Column(String(30), default="pending")  # paid, partial, pending, overdue
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="rent_payments")
    unit = relationship("Unit", back_populates="rent_payments")


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    specialty = Column(String(80), nullable=False)  # Plumbing, Electrical, HVAC, Carpentry, Painting, Cleaning, General
    phone = Column(String(40), nullable=False)
    email = Column(String(120), nullable=True)
    hourly_rate = Column(Float, default=45.0)
    company_name = Column(String(120), nullable=True)
    status = Column(String(30), default="available")  # available, busy, inactive
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    work_orders = relationship("WorkOrder", back_populates="worker")
    expenses = relationship("Expense", back_populates="worker")


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="SET NULL"), nullable=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="SET NULL"), nullable=True)
    priority = Column(String(30), default="medium")  # low, medium, high, emergency
    status = Column(String(30), default="reported")  # reported, assigned, in_progress, completed, cancelled
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    hours_spent = Column(Float, default=0.0)
    reported_date = Column(Date, default=date.today)
    completed_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="work_orders")
    unit = relationship("Unit", back_populates="work_orders")
    worker = relationship("Worker", back_populates="work_orders")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="SET NULL"), nullable=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(60), nullable=False)  # Maintenance, Utilities, Insurance, Property Taxes, Management, Supplies, Worker Wages, Other
    amount = Column(Float, nullable=False)
    expense_date = Column(Date, nullable=False)
    payee_vendor = Column(String(120), nullable=False)
    payment_method = Column(String(50), default="Credit Card")  # Credit Card, Bank Transfer, Check, Cash
    status = Column(String(30), default="paid")  # paid, pending, scheduled
    receipt_ref = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="expenses")
    unit = relationship("Unit", back_populates="expenses")
    worker = relationship("Worker", back_populates="expenses")

