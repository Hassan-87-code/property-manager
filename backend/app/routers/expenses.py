from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db
from ..models import Expense, Property, Unit, Worker
from ..schemas import ExpenseCreate, ExpenseUpdate, ExpenseResponse, CategoryExpenseSummary

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

def format_expense_response(e: Expense, db: Session) -> ExpenseResponse:
    prop = db.query(Property).filter(Property.id == e.property_id).first()
    unit = db.query(Unit).filter(Unit.id == e.unit_id).first() if e.unit_id else None
    worker = db.query(Worker).filter(Worker.id == e.worker_id).first() if e.worker_id else None
    
    return ExpenseResponse(
        id=e.id,
        property_id=e.property_id,
        unit_id=e.unit_id,
        worker_id=e.worker_id,
        category=e.category,
        amount=e.amount,
        expense_date=e.expense_date,
        payee_vendor=e.payee_vendor,
        payment_method=e.payment_method,
        status=e.status,
        receipt_ref=e.receipt_ref,
        notes=e.notes,
        created_at=e.created_at,
        property_name=prop.name if prop else None,
        unit_number=unit.unit_number if unit else None,
        worker_name=worker.name if worker else None
    )

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    property_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Expense)
    if property_id:
        query = query.filter(Expense.property_id == property_id)
    if category:
        query = query.filter(Expense.category == category)
    if status:
        query = query.filter(Expense.status == status)
        
    expenses = query.order_by(Expense.expense_date.desc()).all()
    results = [format_expense_response(e, db) for e in expenses]
    
    if search:
        s = search.lower()
        results = [
            e for e in results
            if s in e.payee_vendor.lower() or 
               s in e.category.lower() or 
               (e.property_name and s in e.property_name.lower()) or
               (e.notes and s in e.notes.lower())
        ]
    return results

@router.get("/summary", response_model=List[CategoryExpenseSummary])
def get_expense_summary(db: Session = Depends(get_db)):
    results = (
        db.query(Expense.category, func.sum(Expense.amount).label("total"))
        .group_by(Expense.category)
        .all()
    )
    return [CategoryExpenseSummary(category=cat, total=float(tot or 0)) for cat, tot in results]

@router.post("", response_model=ExpenseResponse)
def create_expense(e_in: ExpenseCreate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == e_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=400, detail="Invalid Property ID")
        
    expense = Expense(**e_in.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return format_expense_response(expense, db)

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    return format_expense_response(e, db)

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, e_in: ExpenseUpdate, db: Session = Depends(get_db)):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    update_data = e_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(e, field, val)
        
    db.commit()
    db.refresh(e)
    return format_expense_response(e, db)

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(e)
    db.commit()
    return {"message": "Expense deleted successfully"}

