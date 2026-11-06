import base64
import binascii
import hmac
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.staticfiles import StaticFiles

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
    # Sample data is for local development. Production data is imported explicitly.
    if not os.getenv("VERCEL"):
        seed_database()
    yield

app = FastAPI(
    title="Property Management System API",
    description="Full-stack Property Management backend to track properties, tenants, rents, expenses, workers, and maintenance.",
    version="1.0.0",
    lifespan=lifespan
)

class DeploymentAuthMiddleware(BaseHTTPMiddleware):
    """Require one owner login in deployed environments; local development stays frictionless."""

    async def dispatch(self, request: Request, call_next):
        if not os.getenv("VERCEL"):
            return await call_next(request)

        username = os.getenv("APP_USERNAME")
        password = os.getenv("APP_PASSWORD")
        if not username or not password:
            return JSONResponse(
                {"detail": "Deployment authentication is not configured."},
                status_code=503,
            )

        scheme, _, encoded = request.headers.get("authorization", "").partition(" ")
        if scheme.lower() != "basic" or not encoded:
            return JSONResponse(
                {"detail": "Authentication required."},
                status_code=401,
                headers={"WWW-Authenticate": 'Basic realm="Bobby Manager"'},
            )
        try:
            supplied = base64.b64decode(encoded, validate=True).decode("utf-8")
            supplied_username, supplied_password = supplied.split(":", 1)
        except (binascii.Error, UnicodeDecodeError, ValueError):
            supplied_username, supplied_password = "", ""

        valid = hmac.compare_digest(supplied_username, username) & hmac.compare_digest(
            supplied_password, password
        )
        if not valid:
            return JSONResponse(
                {"detail": "Invalid username or password."},
                status_code=401,
                headers={"WWW-Authenticate": 'Basic realm="Bobby Manager"'},
            )
        return await call_next(request)


app.add_middleware(DeploymentAuthMiddleware)

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
    if os.getenv("VERCEL"):
        return JSONResponse({"detail": "Demo reset is disabled in production."}, status_code=404)
    Base.metadata.drop_all(bind=engine, tables=[table for table in Base.metadata.sorted_tables if table.name != "user_accounts"])
    Base.metadata.create_all(bind=engine)
    seed_database()
    return {"message": "Database reset and re-seeded successfully"}


# The Vercel build command places the Vite production bundle in the repository's dist folder.
# In local development Vite serves the frontend separately, so the mount is optional.
frontend_dist = Path(__file__).resolve().parents[2] / "dist"
if frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

