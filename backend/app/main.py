import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database.connection import engine, Base
import app.database.base  # Ensures all models (User, Investor, Investment, etc.) are registered with Base.metadata
from app.auth.routes import router as auth_router
from app.billing.routes import router as billing_router
from app.investor.routes import router as investor_router
from app.admin.routes import router as admin_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("restaurant_system")


def init_database() -> None:
    """Create all tables in MySQL if not present."""
    try:
        logger.info("Initializing database tables for all modules...")
        Base.metadata.create_all(bind=engine)
        menu_columns = {column["name"] for column in inspect(engine).get_columns("menu_items")}
        if "quantity" not in menu_columns:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE menu_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 100")
                )
        logger.info("Database tables verified/created successfully.")
    except Exception as exc:
        logger.warning(
            f"Database connection or initialization encountered an error: {exc}. "
            "Please ensure MySQL is running and DB credentials in .env are correct."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    init_database()
    yield

app = FastAPI(
    title="Restaurant Investor & Billing Management System",
    description="FastAPI + MySQL Backend with Cashier, Investor, and Admin Modules",
    version="2.0.0",
    lifespan=lifespan,
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

# CORS middleware allowing all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers for all modules
app.include_router(auth_router)
app.include_router(billing_router)
app.include_router(investor_router)
app.include_router(admin_router)


@app.get("/", tags=["health"])
def root():
    return {
        "status": "ok",
        "app": "Restaurant Investor & Billing Management System",
        "docs_url": "/docs",
        "modules": ["auth", "billing", "investor", "admin"],
    }


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}
