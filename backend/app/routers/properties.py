from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Property, Unit
from ..schemas import PropertyCreate, PropertyUpdate, PropertyResponse

router = APIRouter(prefix="/api/properties", tags=["Properties"])

@router.get("", response_model=List[PropertyResponse])
def get_properties(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Property)
    if search:
        query = query.filter(
            Property.name.ilike(f"%{search}%") |
            Property.address.ilike(f"%{search}%") |
            Property.city.ilike(f"%{search}%")
        )
    properties = query.order_by(Property.created_at.desc()).all()
    
    result = []
    for prop in properties:
        units = db.query(Unit).filter(Unit.property_id == prop.id).all()
        occupied = sum(1 for u in units if u.status == "occupied")
        res = PropertyResponse(
            id=prop.id,
            name=prop.name,
            address=prop.address,
            city=prop.city,
            state=prop.state,
            zip_code=prop.zip_code,
            property_type=prop.property_type,
            total_units=prop.total_units,
            description=prop.description,
            created_at=prop.created_at,
            units_count=len(units),
            occupied_units_count=occupied
        )
        result.append(res)
    return result

@router.post("", response_model=PropertyResponse)
def create_property(prop_in: PropertyCreate, db: Session = Depends(get_db)):
    prop = Property(**prop_in.model_dump())
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return PropertyResponse(
        id=prop.id,
        name=prop.name,
        address=prop.address,
        city=prop.city,
        state=prop.state,
        zip_code=prop.zip_code,
        property_type=prop.property_type,
        total_units=prop.total_units,
        description=prop.description,
        created_at=prop.created_at,
        units_count=0,
        occupied_units_count=0
    )

@router.get("/{prop_id}", response_model=PropertyResponse)
def get_property(prop_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == prop_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    units = db.query(Unit).filter(Unit.property_id == prop.id).all()
    occupied = sum(1 for u in units if u.status == "occupied")
    return PropertyResponse(
        id=prop.id,
        name=prop.name,
        address=prop.address,
        city=prop.city,
        state=prop.state,
        zip_code=prop.zip_code,
        property_type=prop.property_type,
        total_units=prop.total_units,
        description=prop.description,
        created_at=prop.created_at,
        units_count=len(units),
        occupied_units_count=occupied
    )

@router.put("/{prop_id}", response_model=PropertyResponse)
def update_property(prop_id: int, prop_in: PropertyUpdate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == prop_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    update_data = prop_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(prop, field, val)
    db.commit()
    db.refresh(prop)
    units = db.query(Unit).filter(Unit.property_id == prop.id).all()
    occupied = sum(1 for u in units if u.status == "occupied")
    return PropertyResponse(
        id=prop.id,
        name=prop.name,
        address=prop.address,
        city=prop.city,
        state=prop.state,
        zip_code=prop.zip_code,
        property_type=prop.property_type,
        total_units=prop.total_units,
        description=prop.description,
        created_at=prop.created_at,
        units_count=len(units),
        occupied_units_count=occupied
    )

@router.delete("/{prop_id}")
def delete_property(prop_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == prop_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return {"message": "Property deleted successfully"}

