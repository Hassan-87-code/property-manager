from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base
from .seed import seed_database
from .routers import (
    dashboard,
    properties,
    units,
    tenants,
    rents,
    expenses,
    workers,
    work_orders,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    # Seed sample data if empty
    seed_database()
    yield

app = FastAPI(
    title="Property Management System API",
    description="Full-stack Property Management backend to track properties, tenants, rents, expenses, workers, and maintenance.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite dev server and production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard.router)
app.include_router(properties.router)
app.include_router(units.router)
app.include_router(tenants.router)
app.include_router(rents.router)
app.include_router(expenses.router)
app.include_router(workers.router)
app.include_router(work_orders.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Property Manager API"}

@app.post("/api/seed/reset")
def reset_and_reseed():
    """Drops tables and reseeds database with fresh sample data"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_database()
    return {"message": "Database reset and re-seeded successfully"}

