from __future__ import annotations
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.models import User
from app.auth.security import require_role
from app.auth.schemas import UserResponse, UserCreateRequest
from app.auth import auth_controller
from app.admin.schemas import (
    AdminDashboardResponse,
    InvestorAdminResponse,
    InvestorCreateRequest,
    InvestorUpdateRequest,
    InvestmentAdminResponse,
    InvestmentCreateRequest,
    InvestmentUpdateRequest,
    TransactionCreateRequest,
    MenuItemAdminResponse,
    MenuItemCreateRequest,
    MenuItemUpdateRequest,
    SalesReportResponse,
    InvestmentReportResponse,
    ExpenseCreateRequest,
    ExpenseResponse,
    ProfitDistributionRequest,
    ProfitDistributionPreview,
    ProfitDistributionResponse,
)
from app.investor.schemas import TransactionResponse
from app.admin import admin_controller as controller

router = APIRouter(prefix="/api/admin", tags=["admin"])


# --- Dashboard ---
@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse,
    summary="Get high-level dashboard metrics and recent activity",
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.get_dashboard(db=db)


# --- Investor Management ---
@router.get(
    "/investors",
    response_model=List[InvestorAdminResponse],
    summary="List all investors with aggregated investment stats",
)
def list_investors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.list_investors(db=db)


@router.post(
    "/investors",
    response_model=InvestorAdminResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new investor account and profile",
)
def create_investor(
    request: InvestorCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.create_investor(db=db, request=request)


@router.put(
    "/investors/{investor_id}",
    response_model=InvestorAdminResponse,
    summary="Update investor profile details, status, or reset password",
)
def update_investor(
    investor_id: int,
    request: InvestorUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.update_investor(db=db, investor_id=investor_id, request=request)


# --- Investment Management ---
@router.get(
    "/investments",
    response_model=List[InvestmentAdminResponse],
    summary="List all investments across all investors",
)
def list_investments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.list_investments(db=db)


@router.post(
    "/investments",
    response_model=InvestmentAdminResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a new investment",
)
def create_investment(
    request: InvestmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.create_investment(db=db, request=request)


@router.put(
    "/investments/{investment_id}",
    response_model=InvestmentAdminResponse,
    summary="Update investment status, amount, or notes",
)
def update_investment(
    investment_id: int,
    request: InvestmentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.update_investment(db=db, investment_id=investment_id, request=request)


@router.post(
    "/investments/{investment_id}/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record an actual return or distribution transaction for an investment",
)
def record_transaction(
    investment_id: int,
    request: TransactionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.record_transaction(db=db, investment_id=investment_id, request=request)


# --- Expenses and profit distributions ---
@router.get(
    "/expenses",
    response_model=List[ExpenseResponse],
    summary="List expenses, optionally filtered by date range",
)
def list_expenses(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    if start_date and end_date and end_date < start_date:
        raise HTTPException(status_code=400, detail="End date must be on or after start date.")
    return controller.list_expenses(db=db, start_date=start_date, end_date=end_date)


@router.post(
    "/expenses",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a restaurant expense",
)
def create_expense(
    request: ExpenseCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.create_expense(db=db, request=request)


@router.delete(
    "/expenses/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an expense entry",
)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    controller.delete_expense(db=db, expense_id=expense_id)


@router.post(
    "/profit-distributions/preview",
    response_model=ProfitDistributionPreview,
    summary="Preview estimated profit and investor ownership allocations",
)
def preview_profit_distribution(
    request: ProfitDistributionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.preview_profit_distribution(db=db, request=request)


@router.post(
    "/profit-distributions",
    response_model=ProfitDistributionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Distribute period profit to investors based on ownership",
)
def distribute_profit(
    request: ProfitDistributionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.distribute_profit(db=db, request=request)


# --- Menu Management ---
@router.get(
    "/menu",
    response_model=List[MenuItemAdminResponse],
    summary="List all menu items including inactive ones",
)
def list_menu(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.list_menu(db=db)


@router.post(
    "/menu",
    response_model=MenuItemAdminResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new menu item",
)
def create_menu_item(
    request: MenuItemCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.create_menu_item(db=db, request=request)


@router.put(
    "/menu/{item_id}",
    response_model=MenuItemAdminResponse,
    summary="Update menu item pricing, availability, name or category",
)
def update_menu_item(
    item_id: int,
    request: MenuItemUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.update_menu_item(db=db, item_id=item_id, request=request)


# --- Reports ---
@router.get(
    "/reports/sales",
    response_model=SalesReportResponse,
    summary="Generate sales summary report with optional date filtering",
)
def get_sales_report(
    start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.get_sales_report(db=db, start_date=start_date, end_date=end_date)


@router.get(
    "/reports/investments",
    response_model=InvestmentReportResponse,
    summary="Generate investment summary report grouped by investor",
)
def get_investment_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return controller.get_investment_report(db=db)


# --- User Creation ---
@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create cashier or investor account",
)
def create_user_account(
    request: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return auth_controller.create_user(db=db, request=request)
