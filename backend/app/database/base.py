"""
Imports all SQLAlchemy models to ensure they are registered with Base.metadata.
"""
from app.database.connection import Base
from app.auth.models import User  # noqa: F401
from app.billing.models import MenuItem, Order, OrderItem  # noqa: F401
from app.investor.models import (  # noqa: F401
    Investor,
    Investment,
    InvestmentTransaction,
)
from app.admin.models import Expense, ProfitDistribution  # noqa: F401

__all__ = [
    "Base",
    "User",
    "MenuItem",
    "Order",
    "OrderItem",
    "Investor",
    "Investment",
    "InvestmentTransaction",
    "Expense",
    "ProfitDistribution",
]
