from __future__ import annotations
from datetime import datetime
from sqlalchemy import Column, Date, DateTime, Float, Integer, String, UniqueConstraint

from app.database.connection import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    description = Column(String(500), nullable=False)
    amount = Column(Float, nullable=False)
    expense_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Expense(id={self.id}, amount={self.amount}, expense_date='{self.expense_date}')>"


class ProfitDistribution(Base):
    __tablename__ = "profit_distributions"
    __table_args__ = (
        UniqueConstraint("start_date", "end_date", name="uq_profit_distribution_period"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    net_revenue = Column(Float, nullable=False)
    total_expenses = Column(Float, nullable=False)
    distributable_profit = Column(Float, nullable=False)
    distributed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<ProfitDistribution(id={self.id}, profit={self.distributable_profit})>"
