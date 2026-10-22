from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, timedelta
from typing import List
from ..database import get_db
from ..models import Property, Unit, Tenant, RentPayment, Expense, Worker, WorkOrder
from ..schemas import DashboardStats, CategoryExpenseSummary, MonthlyFinancialTrend
from .rents import format_rent_response
from .work_orders import format_work_order_response

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    current_year = today.year
    current_month = today.month

    # 1. Counts
    total_properties = db.query(Property).count()
    total_units = db.query(Unit).count()
    occupied_units = db.query(Unit).filter(Unit.status == "occupied").count()
    vacant_units = db.query(Unit).filter(Unit.status == "vacant").count()
    total_tenants = db.query(Tenant).filter(Tenant.status == "active").count()
    active_workers = db.query(Worker).filter(Worker.status.in_(["available", "busy"])).count()
    open_work_orders = db.query(WorkOrder).filter(WorkOrder.status.in_(["reported", "assigned", "in_progress"])).count()
    pending_rents = db.query(RentPayment).filter(RentPayment.status.in_(["pending", "overdue"])).count()

    occupancy_rate = round((occupied_units / total_units * 100), 1) if total_units > 0 else 0.0

    # 2. Monthly Financials (Current Month)
    # Expected rent from active tenants
    monthly_expected_rent = db.query(func.sum(Tenant.rent_amount)).filter(Tenant.status == "active").scalar() or 0.0

    # Rent actually collected this month
    collected_query = db.query(func.sum(RentPayment.amount_paid)).filter(
        RentPayment.payment_date != None,
        extract("year", RentPayment.payment_date) == current_year,
        extract("month", RentPayment.payment_date) == current_month
    ).scalar()
    monthly_collected_rent = collected_query or 0.0

    # Expenses this month
    expenses_query = db.query(func.sum(Expense.amount)).filter(
        extract("year", Expense.expense_date) == current_year,
        extract("month", Expense.expense_date) == current_month
    ).scalar()
    monthly_expenses = expenses_query or 0.0

    monthly_noi = monthly_collected_rent - monthly_expenses

    # 3. Expense by Category
    category_rows = (
        db.query(Expense.category, func.sum(Expense.amount).label("total"))
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )
    expenses_by_cat = [CategoryExpenseSummary(category=row[0], total=round(float(row[1] or 0), 2)) for row in category_rows]

    # 4. 6-Month Trend
    monthly_trends: List[MonthlyFinancialTrend] = []
    for i in range(5, -1, -1):
        # Month calculation
        # Go back i months
        m = current_month - i
        y = current_year
        while m <= 0:
            m += 12
            y -= 1
            
        month_label = date(y, m, 1).strftime("%b %Y")
        
        # Income for that month
        inc = db.query(func.sum(RentPayment.amount_paid)).filter(
            RentPayment.payment_date != None,
            extract("year", RentPayment.payment_date) == y,
            extract("month", RentPayment.payment_date) == m
        ).scalar() or 0.0

        # Expense for that month
        exp = db.query(func.sum(Expense.amount)).filter(
            extract("year", Expense.expense_date) == y,
            extract("month", Expense.expense_date) == m
        ).scalar() or 0.0

        monthly_trends.append(MonthlyFinancialTrend(
            month=month_label,
            income=round(inc, 2),
            expense=round(exp, 2),
            net=round(inc - exp, 2)
        ))

    # 5. Recent Payments
    recent_payments_db = (
        db.query(RentPayment)
        .order_by(RentPayment.created_at.desc())
        .limit(6)
        .all()
    )
    recent_payments = [format_rent_response(r, db) for r in recent_payments_db]

    # 6. Recent Work Orders
    recent_wo_db = (
        db.query(WorkOrder)
        .order_by(WorkOrder.reported_date.desc(), WorkOrder.created_at.desc())
        .limit(6)
        .all()
    )
    recent_work_orders = [format_work_order_response(wo, db) for wo in recent_wo_db]

    return DashboardStats(
        total_properties=total_properties,
        total_units=total_units,
        occupied_units=occupied_units,
        vacant_units=vacant_units,
        occupancy_rate=occupancy_rate,
        total_tenants=total_tenants,
        monthly_expected_rent=round(monthly_expected_rent, 2),
        monthly_collected_rent=round(monthly_collected_rent, 2),
        monthly_expenses=round(monthly_expenses, 2),
        monthly_net_operating_income=round(monthly_noi, 2),
        pending_rents_count=pending_rents,
        open_work_orders_count=open_work_orders,
        active_workers_count=active_workers,
        expenses_by_category=expenses_by_cat,
        monthly_trends=monthly_trends,
        recent_payments=recent_payments,
        recent_work_orders=recent_work_orders
    )

