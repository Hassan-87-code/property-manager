import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "property_manager.db")
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if SQLALCHEMY_DATABASE_URL:
    # Use psycopg 3 for hosted PostgreSQL URLs (including Neon/Vercel integrations).
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
            "postgres://", "postgresql+psycopg://", 1
        )
    elif SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
            "postgresql://", "postgresql+psycopg://", 1
        )
elif os.getenv("VERCEL"):
    raise RuntimeError("DATABASE_URL must be configured for Vercel deployments.")
else:
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine_options = {"pool_pre_ping": True}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    engine_options["pool_size"] = 1
    engine_options["max_overflow"] = 0

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_options)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

