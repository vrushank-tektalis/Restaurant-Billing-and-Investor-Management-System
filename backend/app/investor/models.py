from __future__ import annotations
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Investor(Base):
    __tablename__ = "investors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE

    # Relationships
    user = relationship("User", back_populates="investor_profile")
    investments = relationship("Investment", back_populates="investor", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Investor(id={self.id}, user_id={self.user_id}, status='{self.status}')>"


class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    investor_id = Column(Integer, ForeignKey("investors.id", ondelete="CASCADE"), nullable=False, index=True)
    # Retained for existing database compatibility; restaurant names are no longer user-facing.
    restaurant_name = Column(String(255), nullable=True, default="")
    investment_amount = Column(Float, nullable=False)
    investment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, COMPLETED, CANCELLED
    notes = Column(String(500), nullable=True)

    # Relationships
    investor = relationship("Investor", back_populates="investments")
    transactions = relationship("InvestmentTransaction", back_populates="investment", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Investment(id={self.id}, amount={self.investment_amount}, status='{self.status}')>"


class InvestmentTransaction(Base):
    __tablename__ = "investment_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    investment_id = Column(Integer, ForeignKey("investments.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = Column(String(50), nullable=False)  # RETURN, DISTRIBUTION
    amount = Column(Float, nullable=False)
    transaction_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    reference = Column(String(100), nullable=True)
    notes = Column(String(500), nullable=True)

    # Relationships
    investment = relationship("Investment", back_populates="transactions")

    def __repr__(self) -> str:
        return f"<InvestmentTransaction(id={self.id}, type='{self.transaction_type}', amount={self.amount})>"
