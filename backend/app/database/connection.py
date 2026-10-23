import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from backend/.env if present, otherwise system env
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DB_NAME = os.getenv("MYSQLDATABASE") or os.getenv("DB_NAME", "restaurant_db")
RAILWAY_ENVIRONMENT = os.getenv("RAILWAY_ENVIRONMENT_NAME")
MYSQL_URL = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")

if MYSQL_URL:
    parsed_database_url = make_url(MYSQL_URL)
    if parsed_database_url.drivername in ("mysql", "mysql+pymysql"):
        DATABASE_URL = parsed_database_url.set(drivername="mysql+pymysql")
    else:
        raise RuntimeError("The configured database URL must use MySQL.")
else:
    DATABASE_URL = URL.create(
        "mysql+pymysql",
        username=os.getenv("MYSQLUSER") or os.getenv("DB_USER", "root"),
        password=os.getenv("MYSQLPASSWORD") or os.getenv("DB_PASSWORD") or None,
        host=os.getenv("MYSQLHOST") or os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("MYSQLPORT") or os.getenv("DB_PORT", "3306")),
        database=DB_NAME,
    )


def create_resilient_engine():
    """
    Connect to MySQL, using local SQLite only for non-Railway development.
    """
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
        if RAILWAY_ENVIRONMENT:
            raise RuntimeError("Could not connect to the configured Railway MySQL database.") from exc

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
