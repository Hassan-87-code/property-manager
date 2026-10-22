from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models import RentPayment, Tenant, Unit, Property
from ..schemas import RentPaymentCreate, RentPaymentUpdate, RentPaymentResponse, RentPaymentRecord

router = APIRouter(prefix="/api/rents", tags=["Rent Payments"])

def format_rent_response(r: RentPayment, db: Session) -> RentPaymentResponse:
    tenant = db.query(Tenant).filter(Tenant.id == r.tenant_id).first()
    tenant_name = f"{tenant.first_name} {tenant.last_name}" if tenant else "Unknown"
    
    unit_num = None
    prop_name = None
    u_id = r.unit_id or (tenant.unit_id if tenant else None)
    if u_id:
        unit = db.query(Unit).filter(Unit.id == u_id).first()
        if unit:
            unit_num = unit.unit_number
            prop = db.query(Property).filter(Property.id == unit.property_id).first()
            if prop:
                prop_name = prop.name

    return RentPaymentResponse(
        id=r.id,
        tenant_id=r.tenant_id,
        unit_id=r.unit_id,
        amount_due=r.amount_due,
        amount_paid=r.amount_paid,
        due_date=r.due_date,
        payment_date=r.payment_date,
        payment_method=r.payment_method,
        status=r.status,
        reference_number=r.reference_number,
        notes=r.notes,
        created_at=r.created_at,
        tenant_name=tenant_name,
        unit_number=unit_num,
        property_name=prop_name
    )

@router.get("", response_model=List[RentPaymentResponse])
def get_rents(
    status: Optional[str] = Query(None),
    tenant_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RentPayment)
    if status:
        query = query.filter(RentPayment.status == status)
    if tenant_id:
        query = query.filter(RentPayment.tenant_id == tenant_id)
        
    payments = query.order_by(RentPayment.due_date.desc()).all()
    
    # Check for overdue items automatically
    today = date.today()
    updated_needed = False
    for p in payments:
        if p.status == "pending" and p.due_date < today:
            p.status = "overdue"
            updated_needed = True
    if updated_needed:
        db.commit()
        
    results = [format_rent_response(r, db) for r in payments]
    if search:
        search_lower = search.lower()
        results = [
            r for r in results 
            if (r.tenant_name and search_lower in r.tenant_name.lower()) or 
               (r.property_name and search_lower in r.property_name.lower()) or
               (r.unit_number and search_lower in r.unit_number.lower()) or
               (r.reference_number and search_lower in r.reference_number.lower())
        ]
    return results

@router.post("", response_model=RentPaymentResponse)
def create_rent_payment(r_in: RentPaymentCreate, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == r_in.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=400, detail="Tenant not found")
        
    unit_id = r_in.unit_id or tenant.unit_id
    
    status = r_in.status
    if r_in.amount_paid >= r_in.amount_due and r_in.amount_due > 0:
        status = "paid"
    elif r_in.amount_paid > 0 and r_in.amount_paid < r_in.amount_due:
        status = "partial"
    elif r_in.due_date < date.today() and r_in.amount_paid == 0:
        status = "overdue"
    else:
        status = "pending"

    record_data = r_in.model_dump()
    record_data["unit_id"] = unit_id
    record_data["status"] = status
    
    payment = RentPayment(**record_data)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return format_rent_response(payment, db)

@router.post("/{rent_id}/pay", response_model=RentPaymentResponse)
def record_payment(rent_id: int, pay_data: RentPaymentRecord, db: Session = Depends(get_db)):
    rent = db.query(RentPayment).filter(RentPayment.id == rent_id).first()
    if not rent:
        raise HTTPException(status_code=404, detail="Rent payment record not found")
        
    rent.amount_paid = (rent.amount_paid or 0.0) + pay_data.amount_paid
    rent.payment_date = pay_data.payment_date
    rent.payment_method = pay_data.payment_method
    if pay_data.reference_number:
        rent.reference_number = pay_data.reference_number
    if pay_data.notes:
        rent.notes = (rent.notes or "") + f" | Payment: {pay_data.notes}"

    if rent.amount_paid >= rent.amount_due:
        rent.status = "paid"
    elif rent.amount_paid > 0:
        rent.status = "partial"
        
    db.commit()
    db.refresh(rent)
    return format_rent_response(rent, db)

@router.post("/generate-monthly", response_model=List[RentPaymentResponse])
def generate_monthly_rents(target_date: Optional[date] = None, db: Session = Depends(get_db)):
    """Generate rent charges for all active tenants who don't have one for this month"""
    use_date = target_date or date.today().replace(day=1)
    active_tenants = db.query(Tenant).filter(Tenant.status == "active").all()
    
    created = []
    for t in active_tenants:
        # Check if already generated for this month
        existing = db.query(RentPayment).filter(
            RentPayment.tenant_id == t.id,
            RentPayment.due_date == use_date
        ).first()
        
        if not existing and t.rent_amount > 0:
            payment = RentPayment(
                tenant_id=t.id,
                unit_id=t.unit_id,
                amount_due=t.rent_amount,
                amount_paid=0.0,
                due_date=use_date,
                payment_method="Bank Transfer",
                status="pending" if use_date >= date.today() else "overdue",
                notes=f"Auto-generated monthly rent for {use_date.strftime('%B %Y')}"
            )
            db.add(payment)
            created.append(payment)
            
    db.commit()
    for p in created:
        db.refresh(p)
    return [format_rent_response(p, db) for p in created]

@router.put("/{rent_id}", response_model=RentPaymentResponse)
def update_rent(rent_id: int, r_in: RentPaymentUpdate, db: Session = Depends(get_db)):
    rent = db.query(RentPayment).filter(RentPayment.id == rent_id).first()
    if not rent:
        raise HTTPException(status_code=404, detail="Rent payment record not found")
        
    update_data = r_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(rent, field, val)
        
    if rent.amount_paid >= rent.amount_due and rent.amount_due > 0:
        rent.status = "paid"
    elif rent.amount_paid > 0 and rent.amount_paid < rent.amount_due:
        rent.status = "partial"
        
    db.commit()
    db.refresh(rent)
    return format_rent_response(rent, db)

@router.delete("/{rent_id}")
def delete_rent(rent_id: int, db: Session = Depends(get_db)):
    rent = db.query(RentPayment).filter(RentPayment.id == rent_id).first()
    if not rent:
        raise HTTPException(status_code=404, detail="Rent payment record not found")
    db.delete(rent)
    db.commit()
    return {"message": "Rent payment deleted successfully"}

