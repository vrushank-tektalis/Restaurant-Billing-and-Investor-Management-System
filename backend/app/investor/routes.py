from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.models import User
from app.auth.security import require_role
from app.investor.schemas import (
    InvestorProfileResponse,
    InvestmentResponse,
    InvestorSummaryResponse,
)
from app.investor import investor_controller as controller

router = APIRouter(prefix="/api/investor", tags=["investor"])


@router.get(
    "/profile",
    response_model=InvestorProfileResponse,
    summary="View authenticated investor's profile",
)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("INVESTOR", "ADMIN")),
):
    return controller.get_profile(db=db, current_user=current_user)


@router.get(
    "/investments",
    response_model=List[InvestmentResponse],
    summary="View authenticated investor's investments and transaction history",
)
def get_investments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("INVESTOR", "ADMIN")),
):
    return controller.get_investments(db=db, current_user=current_user)


@router.get(
    "/summary",
    response_model=InvestorSummaryResponse,
    summary="View authenticated investor's financial investment summary",
)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("INVESTOR", "ADMIN")),
):
    return controller.get_summary(db=db, current_user=current_user)
