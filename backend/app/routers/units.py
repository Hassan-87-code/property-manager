from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Unit, Property, Tenant
from ..schemas import UnitCreate, UnitUpdate, UnitResponse

router = APIRouter(prefix="/api/units", tags=["Units"])

@router.get("", response_model=List[UnitResponse])
def get_units(
    property_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Unit)
    if property_id:
        query = query.filter(Unit.property_id == property_id)
    if status:
        query = query.filter(Unit.status == status)
    units = query.order_by(Unit.unit_number.asc()).all()
    
    result = []
    for u in units:
        prop = db.query(Property).filter(Property.id == u.property_id).first()
        active_tenant = db.query(Tenant).filter(Tenant.unit_id == u.id, Tenant.status == "active").first()
        res = UnitResponse(
            id=u.id,
            property_id=u.property_id,
            unit_number=u.unit_number,
            bedrooms=u.bedrooms,
            bathrooms=u.bathrooms,
            square_feet=u.square_feet,
            rent_amount=u.rent_amount,
            deposit_amount=u.deposit_amount,
            status=u.status,
            created_at=u.created_at,
            property_name=prop.name if prop else None,
            current_tenant_name=f"{active_tenant.first_name} {active_tenant.last_name}" if active_tenant else None
        )
        result.append(res)
    return result

@router.post("", response_model=UnitResponse)
def create_unit(unit_in: UnitCreate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == unit_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=400, detail="Invalid property ID")
    unit = Unit(**unit_in.model_dump())
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return UnitResponse(
        id=unit.id,
        property_id=unit.property_id,
        unit_number=unit.unit_number,
        bedrooms=unit.bedrooms,
        bathrooms=unit.bathrooms,
        square_feet=unit.square_feet,
        rent_amount=unit.rent_amount,
        deposit_amount=unit.deposit_amount,
        status=unit.status,
        created_at=unit.created_at,
        property_name=prop.name,
        current_tenant_name=None
    )

@router.get("/{unit_id}", response_model=UnitResponse)
def get_unit(unit_id: int, db: Session = Depends(get_db)):
    u = db.query(Unit).filter(Unit.id == unit_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Unit not found")
    prop = db.query(Property).filter(Property.id == u.property_id).first()
    active_tenant = db.query(Tenant).filter(Tenant.unit_id == u.id, Tenant.status == "active").first()
    return UnitResponse(
        id=u.id,
        property_id=u.property_id,
        unit_number=u.unit_number,
        bedrooms=u.bedrooms,
        bathrooms=u.bathrooms,
        square_feet=u.square_feet,
        rent_amount=u.rent_amount,
        deposit_amount=u.deposit_amount,
        status=u.status,
        created_at=u.created_at,
        property_name=prop.name if prop else None,
        current_tenant_name=f"{active_tenant.first_name} {active_tenant.last_name}" if active_tenant else None
    )

@router.put("/{unit_id}", response_model=UnitResponse)
def update_unit(unit_id: int, unit_in: UnitUpdate, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    update_data = unit_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(unit, field, val)
    db.commit()
    db.refresh(unit)
    prop = db.query(Property).filter(Property.id == unit.property_id).first()
    active_tenant = db.query(Tenant).filter(Tenant.unit_id == unit.id, Tenant.status == "active").first()
    return UnitResponse(
        id=unit.id,
        property_id=unit.property_id,
        unit_number=unit.unit_number,
        bedrooms=unit.bedrooms,
        bathrooms=unit.bathrooms,
        square_feet=unit.square_feet,
        rent_amount=unit.rent_amount,
        deposit_amount=unit.deposit_amount,
        status=unit.status,
        created_at=unit.created_at,
        property_name=prop.name if prop else None,
        current_tenant_name=f"{active_tenant.first_name} {active_tenant.last_name}" if active_tenant else None
    )

@router.delete("/{unit_id}")
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    db.delete(unit)
    db.commit()
    return {"message": "Unit deleted successfully"}

