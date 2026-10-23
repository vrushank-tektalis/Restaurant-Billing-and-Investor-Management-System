from __future__ import annotations
from datetime import date, datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator

from app.billing.schemas import OrderSummary
from app.investor.schemas import TransactionResponse


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Dashboard ---
class AdminRecentInvestment(BaseModel):
    id: int
    investor_name: str
    investment_amount: float
    investment_date: datetime
    status: str


class AdminDashboardResponse(BaseModel):
    total_menu_items: int
    total_investors: int
    total_investment_amount: float
    total_completed_sales: float
    recent_orders: List[OrderSummary]
    recent_investments: List[AdminRecentInvestment]


# --- Investor Management ---
class InvestorAdminResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime
    total_invested: float = 0.0


class InvestorCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    phone: Optional[str] = None
    address: Optional[str] = None


class InvestorUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    new_password: Optional[str] = None


# --- Investment Management ---
class InvestmentAdminResponse(ORMBase):
    id: int
    investor_id: int
    investor_name: str
    investment_amount: float
    investment_date: datetime
    status: str
    notes: Optional[str] = None
    total_returns: float = 0.0
    transactions: List[TransactionResponse] = []


class InvestmentCreateRequest(BaseModel):
    investor_id: int = Field(..., gt=0)
    investment_amount: float = Field(..., gt=0.0)
    investment_date: Optional[datetime] = None
    status: Literal["ACTIVE", "COMPLETED", "CANCELLED"] = "ACTIVE"
    notes: Optional[str] = None


class InvestmentUpdateRequest(BaseModel):
    investment_amount: Optional[float] = Field(default=None, gt=0.0)
    status: Optional[Literal["ACTIVE", "COMPLETED", "CANCELLED"]] = None
    notes: Optional[str] = None


class TransactionCreateRequest(BaseModel):
    transaction_type: Literal["RETURN", "DISTRIBUTION"] = "RETURN"
    amount: float = Field(..., gt=0.0)
    transaction_date: Optional[datetime] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class ExpenseCreateRequest(BaseModel):
    description: str = Field(..., min_length=2, max_length=500)
    amount: float = Field(..., ge=0.01)
    expense_date: date


class ExpenseResponse(ORMBase):
    id: int
    description: str
    amount: float
    expense_date: date
    created_at: datetime


class ProfitDistributionRequest(BaseModel):
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_period(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after start date.")
        return self


class InvestorProfitAllocation(BaseModel):
    investor_id: int
    investor_name: str
    investor_investment: float
    ownership_percent: float
    investor_profit: float


class ProfitDistributionPreview(BaseModel):
    start_date: date
    end_date: date
    net_revenue: float
    total_expenses: float
    estimated_profit: float
    distributable_profit: float
    total_investment: float
    can_distribute: bool
    investors: List[InvestorProfitAllocation]


class ProfitDistributionResponse(ProfitDistributionPreview):
    distribution_id: int
    distributed_at: datetime


# --- Menu Management ---
class MenuItemAdminResponse(ORMBase):
    id: int
    name: str
    category: str
    price: float
    quantity: int
    is_available: bool


class MenuItemCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: str = Field(..., min_length=2, max_length=100)
    price: float = Field(..., gt=0.0)
    quantity: int = Field(default=0, ge=0)
    is_available: bool = True


class MenuItemUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0.0)
    quantity: Optional[int] = Field(default=None, ge=0)
    is_available: Optional[bool] = None


# --- Reports ---
class DailySalesItem(BaseModel):
    date: str
    orders_count: int
    total_sales: float


class SalesReportResponse(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_sales: float
    total_orders_count: int
    daily_breakdown: List[DailySalesItem]


class InvestorReportItem(BaseModel):
    investor_id: int
    name: str
    email: str
    total_invested: float
    total_returns: float
    net_position: float
    investments_count: int


class InvestmentReportResponse(BaseModel):
    total_invested_all: float
    total_returns_all: float
    investors: List[InvestorReportItem]
