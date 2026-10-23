from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TransactionResponse(ORMBase):
    id: int
    investment_id: int
    transaction_type: str  # RETURN, DISTRIBUTION
    amount: float
    transaction_date: datetime
    reference: Optional[str] = None
    notes: Optional[str] = None


class InvestmentResponse(ORMBase):
    id: int
    investor_id: int
    investment_amount: float
    investment_date: datetime
    status: str
    notes: Optional[str] = None
    transactions: List[TransactionResponse] = []


class InvestorProfileResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[datetime] = None


class InvestorSummaryResponse(BaseModel):
    investor_id: int
    investor_name: str
    total_invested: float
    total_returns: float
    net_position: float
    total_investments_count: int
    active_investments_count: int
