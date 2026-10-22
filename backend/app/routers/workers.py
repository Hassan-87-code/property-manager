from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Worker, WorkOrder
from ..schemas import WorkerCreate, WorkerUpdate, WorkerResponse

router = APIRouter(prefix="/api/workers", tags=["Workers & Contractors"])

def format_worker_response(w: Worker, db: Session) -> WorkerResponse:
    active_jobs = db.query(WorkOrder).filter(
        WorkOrder.worker_id == w.id,
        WorkOrder.status.in_(["assigned", "in_progress"])
    ).count()
    completed_jobs = db.query(WorkOrder).filter(
        WorkOrder.worker_id == w.id,
        WorkOrder.status == "completed"
    ).count()
    
    return WorkerResponse(
        id=w.id,
        name=w.name,
        specialty=w.specialty,
        phone=w.phone,
        email=w.email,
        hourly_rate=w.hourly_rate,
        company_name=w.company_name,
        status=w.status,
        notes=w.notes,
        created_at=w.created_at,
        active_jobs_count=active_jobs,
        completed_jobs_count=completed_jobs
    )

@router.get("", response_model=List[WorkerResponse])
def get_workers(
    specialty: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Worker)
    if specialty:
        query = query.filter(Worker.specialty == specialty)
    if status:
        query = query.filter(Worker.status == status)
        
    workers = query.order_by(Worker.name.asc()).all()
    results = [format_worker_response(w, db) for w in workers]
    
    if search:
        s = search.lower()
        results = [
            w for w in results
            if s in w.name.lower() or 
               s in w.specialty.lower() or
               (w.company_name and s in w.company_name.lower()) or
               (w.phone and s in w.phone.lower())
        ]
    return results

@router.post("", response_model=WorkerResponse)
def create_worker(w_in: WorkerCreate, db: Session = Depends(get_db)):
    worker = Worker(**w_in.model_dump())
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return format_worker_response(worker, db)

@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: int, db: Session = Depends(get_db)):
    w = db.query(Worker).filter(Worker.id == worker_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    return format_worker_response(w, db)

@router.put("/{worker_id}", response_model=WorkerResponse)
def update_worker(worker_id: int, w_in: WorkerUpdate, db: Session = Depends(get_db)):
    w = db.query(Worker).filter(Worker.id == worker_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    update_data = w_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(w, field, val)
        
    db.commit()
    db.refresh(w)
    return format_worker_response(w, db)

@router.delete("/{worker_id}")
def delete_worker(worker_id: int, db: Session = Depends(get_db)):
    w = db.query(Worker).filter(Worker.id == worker_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    db.delete(w)
    db.commit()
    return {"message": "Worker deleted successfully"}

