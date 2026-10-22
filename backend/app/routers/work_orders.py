from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models import WorkOrder, Property, Unit, Worker, Expense
from ..schemas import WorkOrderCreate, WorkOrderUpdate, WorkOrderResponse, ExpenseResponse

router = APIRouter(prefix="/api/work-orders", tags=["Work Orders & Maintenance"])

def format_work_order_response(wo: WorkOrder, db: Session) -> WorkOrderResponse:
    prop = db.query(Property).filter(Property.id == wo.property_id).first()
    unit = db.query(Unit).filter(Unit.id == wo.unit_id).first() if wo.unit_id else None
    worker = db.query(Worker).filter(Worker.id == wo.worker_id).first() if wo.worker_id else None
    
    return WorkOrderResponse(
        id=wo.id,
        title=wo.title,
        description=wo.description,
        property_id=wo.property_id,
        unit_id=wo.unit_id,
        worker_id=wo.worker_id,
        priority=wo.priority,
        status=wo.status,
        estimated_cost=wo.estimated_cost,
        actual_cost=wo.actual_cost,
        hours_spent=wo.hours_spent,
        reported_date=wo.reported_date,
        completed_date=wo.completed_date,
        created_at=wo.created_at,
        property_name=prop.name if prop else None,
        unit_number=unit.unit_number if unit else None,
        worker_name=worker.name if worker else None
    )

@router.get("", response_model=List[WorkOrderResponse])
def get_work_orders(
    property_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    worker_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(WorkOrder)
    if property_id:
        query = query.filter(WorkOrder.property_id == property_id)
    if status:
        query = query.filter(WorkOrder.status == status)
    if priority:
        query = query.filter(WorkOrder.priority == priority)
    if worker_id:
        query = query.filter(WorkOrder.worker_id == worker_id)
        
    orders = query.order_by(WorkOrder.reported_date.desc()).all()
    results = [format_work_order_response(wo, db) for wo in orders]
    
    if search:
        s = search.lower()
        results = [
            wo for wo in results
            if s in wo.title.lower() or 
               s in wo.description.lower() or
               (wo.property_name and s in wo.property_name.lower()) or
               (wo.worker_name and s in wo.worker_name.lower())
        ]
    return results

@router.post("", response_model=WorkOrderResponse)
def create_work_order(wo_in: WorkOrderCreate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == wo_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=400, detail="Invalid Property ID")
        
    wo = WorkOrder(**wo_in.model_dump())
    db.add(wo)
    db.commit()
    db.refresh(wo)
    return format_work_order_response(wo, db)

@router.post("/{wo_id}/convert-to-expense")
def convert_to_expense(wo_id: int, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
        
    amount = wo.actual_cost if wo.actual_cost > 0 else wo.estimated_cost
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Work order has no cost specified to create an expense")
        
    worker_name = "Maintenance Contractor"
    if wo.worker_id:
        w = db.query(Worker).filter(Worker.id == wo.worker_id).first()
        if w:
            worker_name = w.name
            
    expense = Expense(
        property_id=wo.property_id,
        unit_id=wo.unit_id,
        worker_id=wo.worker_id,
        category="Repairs & Maintenance",
        amount=amount,
        expense_date=wo.completed_date or date.today(),
        payee_vendor=worker_name,
        payment_method="Bank Transfer",
        status="paid" if wo.status == "completed" else "pending",
        notes=f"Created from Work Order #{wo.id}: {wo.title}"
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {"message": "Expense created successfully", "expense_id": expense.id}

@router.get("/{wo_id}", response_model=WorkOrderResponse)
def get_work_order(wo_id: int, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return format_work_order_response(wo, db)

@router.put("/{wo_id}", response_model=WorkOrderResponse)
def update_work_order(wo_id: int, wo_in: WorkOrderUpdate, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
        
    update_data = wo_in.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] == "completed" and not wo.completed_date:
        wo.completed_date = date.today()
        
    for field, val in update_data.items():
        setattr(wo, field, val)
        
    db.commit()
    db.refresh(wo)
    return format_work_order_response(wo, db)

@router.delete("/{wo_id}")
def delete_work_order(wo_id: int, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    db.delete(wo)
    db.commit()
    return {"message": "Work order deleted successfully"}

