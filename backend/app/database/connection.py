import os
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from backend/.env if present, otherwise system env
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "restaurant_db")

# URL encode password to handle special characters securely
encoded_password = quote_plus(DB_PASSWORD) if DB_PASSWORD else ""

if encoded_password:
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SERVER_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}"
else:
    DATABASE_URL = f"mysql+pymysql://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SERVER_URL = f"mysql+pymysql://{DB_USER}@{DB_HOST}:{DB_PORT}"


def create_resilient_engine():
    """
    Attempts to connect to MySQL and ensure the database exists.
    If MySQL server is unavailable, falls back to local SQLite to ensure the application runs.
    """
    # 1. Attempt to ensure DB exists in MySQL
    try:
        temp_eng = create_engine(SERVER_URL, pool_pre_ping=True)
        with temp_eng.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`"))
            conn.commit()
    except Exception:
        pass

    # 2. Attempt to connect to the target database
    try:
        eng = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
        )
        with eng.connect() as conn:
            pass
        return eng
    except Exception as exc:
        # Fallback to local SQLite file
        sqlite_file = Path(__file__).resolve().parent.parent.parent / "restaurant_local.db"
        sqlite_url = f"sqlite:///{sqlite_file}"
        print(f"[Database Warning] Could not connect to MySQL: {exc}. Using SQLite database: {sqlite_url}")
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})


engine = create_resilient_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides an active SQLAlchemy database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
