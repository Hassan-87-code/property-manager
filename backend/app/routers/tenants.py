from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Tenant, Unit, Property
from ..schemas import TenantCreate, TenantUpdate, TenantResponse

router = APIRouter(prefix="/api/tenants", tags=["Tenants"])

def format_tenant_response(t: Tenant, db: Session) -> TenantResponse:
    prop_name = None
    unit_num = None
    if t.unit_id:
        unit = db.query(Unit).filter(Unit.id == t.unit_id).first()
        if unit:
            unit_num = unit.unit_number
            prop = db.query(Property).filter(Property.id == unit.property_id).first()
            if prop:
                prop_name = prop.name

    return TenantResponse(
        id=t.id,
        unit_id=t.unit_id,
        first_name=t.first_name,
        last_name=t.last_name,
        email=t.email,
        phone=t.phone,
        emergency_contact=t.emergency_contact,
        lease_start=t.lease_start,
        lease_end=t.lease_end,
        rent_amount=t.rent_amount,
        deposit_paid=t.deposit_paid,
        status=t.status,
        notes=t.notes,
        created_at=t.created_at,
        property_name=prop_name,
        unit_number=unit_num
    )

@router.get("", response_model=List[TenantResponse])
def get_tenants(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    unit_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Tenant)
    if search:
        query = query.filter(
            Tenant.first_name.ilike(f"%{search}%") |
            Tenant.last_name.ilike(f"%{search}%") |
            Tenant.email.ilike(f"%{search}%") |
            Tenant.phone.ilike(f"%{search}%")
        )
    if status:
        query = query.filter(Tenant.status == status)
    if unit_id:
        query = query.filter(Tenant.unit_id == unit_id)
        
    tenants = query.order_by(Tenant.status.asc(), Tenant.first_name.asc()).all()
    return [format_tenant_response(t, db) for t in tenants]

@router.post("", response_model=TenantResponse)
def create_tenant(t_in: TenantCreate, db: Session = Depends(get_db)):
    if t_in.unit_id:
        unit = db.query(Unit).filter(Unit.id == t_in.unit_id).first()
        if not unit:
            raise HTTPException(status_code=400, detail="Unit not found")
        if t_in.status == "active":
            unit.status = "occupied"
            
    tenant = Tenant(**t_in.model_dump())
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return format_tenant_response(tenant, db)

@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(tenant_id: int, db: Session = Depends(get_db)):
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return format_tenant_response(t, db)

@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(tenant_id: int, t_in: TenantUpdate, db: Session = Depends(get_db)):
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    old_unit_id = t.unit_id
    update_data = t_in.model_dump(exclude_unset=True)
    
    for field, val in update_data.items():
        setattr(t, field, val)
        
    # If tenant moved units or changed status
    if "unit_id" in update_data or "status" in update_data:
        if t.status == "active" and t.unit_id:
            new_unit = db.query(Unit).filter(Unit.id == t.unit_id).first()
            if new_unit:
                new_unit.status = "occupied"
        if old_unit_id and (old_unit_id != t.unit_id or t.status != "active"):
            # Check if old unit has other active tenants
            other_active = db.query(Tenant).filter(Tenant.unit_id == old_unit_id, Tenant.id != t.id, Tenant.status == "active").first()
            if not other_active:
                old_u = db.query(Unit).filter(Unit.id == old_unit_id).first()
                if old_u:
                    old_u.status = "vacant"
                    
    db.commit()
    db.refresh(t)
    return format_tenant_response(t, db)

@router.delete("/{tenant_id}")
def delete_tenant(tenant_id: int, db: Session = Depends(get_db)):
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    unit_id = t.unit_id
    db.delete(t)
    
    if unit_id:
        other_active = db.query(Tenant).filter(Tenant.unit_id == unit_id, Tenant.status == "active").first()
        if not other_active:
            u = db.query(Unit).filter(Unit.id == unit_id).first()
            if u:
                u.status = "vacant"
                
    db.commit()
    return {"message": "Tenant deleted successfully"}

