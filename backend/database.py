import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

MARIADB_HOST = os.getenv("MARIADB_HOST", "mariadb")
MARIADB_PORT = os.getenv("MARIADB_PORT", "3306")
MARIADB_USER = os.getenv("MARIADB_USER", "ygouser")
MARIADB_PASSWORD = os.getenv("MARIADB_PASSWORD", "ygopass")
MARIADB_DATABASE = os.getenv("MARIADB_DATABASE", "ygomgr")

DEFAULT_DB_URL = f"mysql+pymysql://{MARIADB_USER}:{MARIADB_PASSWORD}@{MARIADB_HOST}:{MARIADB_PORT}/{MARIADB_DATABASE}?charset=utf8mb4"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# Fallback pool options for MariaDB/MySQL
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
