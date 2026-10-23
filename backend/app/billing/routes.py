from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.models import User
from app.auth.security import require_role, get_optional_current_user
from app.billing.schemas import (
    MenuItemResponse,
    CreateOrderRequest,
    OrderResponse,
    OrderSummary,
)
from app.billing import billing_controller as controller

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get(
    "/menu",
    response_model=List[MenuItemResponse],
    summary="Get available menu items",
    description="Retrieve all available menu items, optionally filtered by item name.",
)
def get_menu(
    search: Optional[str] = Query(default=None, description="Optional name search query"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return controller.get_menu_items(db=db, search=search)


@router.post(
    "/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new billing order",
    description="Validate items, calculate subtotal, taxes, discount, assign a bill number, and save the order.",
)
def create_order(
    request: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CASHIER", "ADMIN")),
):
    cashier_id = current_user.id if current_user else None
    return controller.create_order(db=db, request=request, cashier_user_id=cashier_id)


@router.get(
    "/orders",
    response_model=List[OrderSummary],
    summary="List all orders",
    description="Retrieve all orders sorted by date descending.",
)
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CASHIER", "ADMIN")),
):
    return controller.get_orders(db=db)


@router.get(
    "/orders/{order_id}",
    response_model=OrderResponse,
    summary="Get order details by ID",
    description="Retrieve complete details for a specific order by ID including line items.",
)
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CASHIER", "ADMIN")),
):
    return controller.get_order_by_id(db=db, order_id=order_id)
