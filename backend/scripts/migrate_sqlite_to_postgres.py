"""Copy the local property manager database into an empty PostgreSQL database.

Set DATABASE_URL in the environment first. The script refuses to write into a
database that already contains app data and reports only row counts.
"""

import os
import sqlite3
from pathlib import Path

from sqlalchemy import create_engine, select, text

from backend.app.database import Base, SQLALCHEMY_DATABASE_URL
from backend.app import models  # noqa: F401 - registers all model tables


def main() -> None:
    if not os.getenv("DATABASE_URL") or SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        raise SystemExit("Set DATABASE_URL to the hosted PostgreSQL connection string first.")

    source_path = Path(__file__).resolve().parents[2] / "backend" / "property_manager.db"
    if not source_path.is_file():
        raise SystemExit(f"Local SQLite database not found: {source_path}")

    source_engine = create_engine(f"sqlite:///{source_path.as_posix()}")
    target_engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=1,
        max_overflow=0,
    )

    Base.metadata.create_all(bind=target_engine)
    table_counts: dict[str, int] = {}

    try:
        with source_engine.connect() as source, target_engine.begin() as target:
            for table in Base.metadata.sorted_tables:
                current_count = target.execute(
                    select(text("count(*)")).select_from(table)
                ).scalar_one()
                if current_count:
                    raise SystemExit(
                        "Migration stopped: destination database is not empty "
                        f"(table {table.name} already has rows)."
                    )

            for table in Base.metadata.sorted_tables:
                records = [dict(row) for row in source.execute(select(table)).mappings()]
                if records:
                    target.execute(table.insert(), records)
                table_counts[table.name] = len(records)

            for table in Base.metadata.sorted_tables:
                if "id" not in table.c:
                    continue
                max_id = target.execute(
                    select(text("max(id)")).select_from(table)
                ).scalar_one()
                if max_id is not None:
                    target.execute(
                        text(
                            "SELECT setval(pg_get_serial_sequence(:table_name, 'id'), "
                            ":max_id, true)"
                        ),
                        {"table_name": table.name, "max_id": max_id},
                    )
    finally:
        source_engine.dispose()
        target_engine.dispose()

    for table_name, count in table_counts.items():
        print(f"{table_name}: {count} rows copied")
    print("Migration complete.")


if __name__ == "__main__":
    main()
