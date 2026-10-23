from __future__ import annotations
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.investor.models import Investor, Investment, InvestmentTransaction
from app.investor.schemas import (
    InvestorProfileResponse,
    InvestmentResponse,
    InvestorSummaryResponse,
    TransactionResponse,
)


def _get_investor_for_user(db: Session, user: User) -> Investor:
    """Helper to fetch and validate the investor record linked to the authenticated user."""
    investor = db.query(Investor).filter(Investor.user_id == user.id).first()
    if not investor:
        # If Admin is accessing investor endpoints in Swagger for testing, provide fallback
        if (user.role or "").upper() == "ADMIN":
            first_inv = db.query(Investor).first()
            if first_inv:
                return first_inv
            investor = Investor(
                user_id=user.id,
                phone="+91 99999 99999",
                address="Restaurant HQ",
                status="ACTIVE",
            )
            db.add(investor)
            db.commit()
            db.refresh(investor)
            return investor
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investor record not found for this account. Please log in with an investor account.",
        )
    return investor


def get_profile(db: Session, current_user: User) -> InvestorProfileResponse:
    """Retrieve the authenticated investor's profile."""
    investor = _get_investor_for_user(db, current_user)
    name = (investor.user.name if investor.user else None) or current_user.name
    email = (investor.user.email if investor.user else None) or current_user.email
    return InvestorProfileResponse(
        id=investor.id,
        user_id=current_user.id,
        name=name,
        email=email,
        phone=investor.phone,
        address=investor.address,
        status=investor.status or "ACTIVE",
        created_at=current_user.created_at,
    )


def get_investments(db: Session, current_user: User) -> List[InvestmentResponse]:
    """Retrieve all investments belonging to the authenticated investor."""
    investor = _get_investor_for_user(db, current_user)
    investments = (
        db.query(Investment)
        .filter(Investment.investor_id == investor.id)
        .order_by(Investment.investment_date.desc())
        .all()
    )

    result = []
    for inv in investments:
        tx_list = [
            TransactionResponse.model_validate(tx)
            for tx in inv.transactions
        ]
        resp = InvestmentResponse(
            id=inv.id,
            investor_id=inv.investor_id,
            restaurant_name=inv.restaurant_name,
            investment_amount=inv.investment_amount,
            investment_date=inv.investment_date,
            status=inv.status,
            notes=inv.notes,
            transactions=tx_list,
        )
        result.append(resp)
    return result


def get_summary(db: Session, current_user: User) -> InvestorSummaryResponse:
    """Compute and return an aggregate investment summary for the authenticated investor."""
    investor = _get_investor_for_user(db, current_user)
    investments = (
        db.query(Investment)
        .filter(Investment.investor_id == investor.id)
        .all()
    )

    total_invested = sum(inv.investment_amount for inv in investments)
    total_returns = 0.0
    active_count = 0

    for inv in investments:
        if inv.status.upper() == "ACTIVE":
            active_count += 1
        for tx in inv.transactions:
            total_returns += tx.amount

    return InvestorSummaryResponse(
        investor_id=investor.id,
        investor_name=current_user.name,
        total_invested=round(total_invested, 2),
        total_returns=round(total_returns, 2),
        net_position=round(total_returns - total_invested, 2),
        total_investments_count=len(investments),
        active_investments_count=active_count,
    )
