from __future__ import annotations
from datetime import datetime, date
from typing import List, Optional
from collections import defaultdict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth.models import User
from app.auth.security import hash_password
from app.auth.schemas import UserCreateRequest
from app.billing.models import MenuItem, Order, OrderItem
from app.billing.schemas import OrderSummary
from app.investor.models import Investor, Investment, InvestmentTransaction
from app.investor.schemas import TransactionResponse
from app.admin.schemas import (
    AdminDashboardResponse,
    AdminRecentInvestment,
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
    DailySalesItem,
    InvestmentReportResponse,
    InvestorReportItem,
)


def get_dashboard(db: Session) -> AdminDashboardResponse:
    total_menu_items = db.query(MenuItem).count()
    total_investors = db.query(Investor).count()

    inv_sum = db.query(func.coalesce(func.sum(Investment.investment_amount), 0.0)).scalar()
    total_investments = float(inv_sum)

    sales_sum = db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar()
    total_sales = float(sales_sum)

    orders = db.query(Order).order_by(Order.order_date.desc()).limit(5).all()
    recent_orders = [OrderSummary.model_validate(o) for o in orders]

    inv_list = db.query(Investment).order_by(Investment.investment_date.desc()).limit(5).all()
    recent_investments = []
    for inv in inv_list:
        investor_name = inv.investor.user.name if inv.investor and inv.investor.user else "Unknown"
        recent_investments.append(
            AdminRecentInvestment(
                id=inv.id,
                investor_name=investor_name,
                restaurant_name=inv.restaurant_name,
                investment_amount=inv.investment_amount,
                investment_date=inv.investment_date,
                status=inv.status,
            )
        )

    return AdminDashboardResponse(
        total_menu_items=total_menu_items,
        total_investors=total_investors,
        total_investment_amount=round(total_investments, 2),
        total_completed_sales=round(total_sales, 2),
        recent_orders=recent_orders,
        recent_investments=recent_investments,
    )


# --- Investor Management ---
def list_investors(db: Session) -> List[InvestorAdminResponse]:
    investors = db.query(Investor).all()
    result = []
    for inv in investors:
        total_invested = sum(i.investment_amount for i in inv.investments)
        result.append(
            InvestorAdminResponse(
                id=inv.id,
                user_id=inv.user_id,
                name=inv.user.name if inv.user else "",
                email=inv.user.email if inv.user else "",
                phone=inv.phone,
                address=inv.address,
                status=inv.status,
                is_active=inv.user.is_active if inv.user else True,
                created_at=inv.user.created_at if inv.user else datetime.utcnow(),
                total_invested=round(total_invested, 2),
            )
        )
    return result


def create_investor(db: Session, request: InvestorCreateRequest) -> InvestorAdminResponse:
    existing = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{request.email}' already exists.",
        )

    user = User(
        name=request.name.strip(),
        email=request.email.lower().strip(),
        password_hash=hash_password(request.password),
        role="INVESTOR",
        is_active=True,
    )
    db.add(user)
    db.flush()

    investor = Investor(
        user_id=user.id,
        phone=request.phone.strip() if request.phone else None,
        address=request.address.strip() if request.address else None,
        status="ACTIVE",
    )
    db.add(investor)
    db.commit()
    db.refresh(investor)
    db.refresh(user)

    return InvestorAdminResponse(
        id=investor.id,
        user_id=user.id,
        name=user.name,
        email=user.email,
        phone=investor.phone,
        address=investor.address,
        status=investor.status,
        is_active=user.is_active,
        created_at=user.created_at,
        total_invested=0.0,
    )


def update_investor(db: Session, investor_id: int, request: InvestorUpdateRequest) -> InvestorAdminResponse:
    investor = db.query(Investor).filter(Investor.id == investor_id).first()
    if not investor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor not found.")

    user = investor.user
    if request.phone is not None:
        investor.phone = request.phone.strip() or None
    if request.address is not None:
        investor.address = request.address.strip() or None
    if request.status is not None:
        investor.status = request.status.upper()

    if user:
        if request.name is not None and request.name.strip():
            user.name = request.name.strip()
        if request.is_active is not None:
            user.is_active = request.is_active
        if request.new_password and request.new_password.strip():
            user.password_hash = hash_password(request.new_password.strip())

    db.commit()
    db.refresh(investor)
    if user:
        db.refresh(user)

    total_invested = sum(i.investment_amount for i in investor.investments)
    return InvestorAdminResponse(
        id=investor.id,
        user_id=investor.user_id,
        name=user.name if user else "",
        email=user.email if user else "",
        phone=investor.phone,
        address=investor.address,
        status=investor.status,
        is_active=user.is_active if user else True,
        created_at=user.created_at if user else datetime.utcnow(),
        total_invested=round(total_invested, 2),
    )


# --- Investment Management ---
def list_investments(db: Session) -> List[InvestmentAdminResponse]:
    investments = db.query(Investment).order_by(Investment.investment_date.desc()).all()
    result = []
    for inv in investments:
        investor_name = inv.investor.user.name if inv.investor and inv.investor.user else "Unknown"
        returns = sum(tx.amount for tx in inv.transactions)
        tx_list = [TransactionResponse.model_validate(tx) for tx in inv.transactions]
        result.append(
            InvestmentAdminResponse(
                id=inv.id,
                investor_id=inv.investor_id,
                investor_name=investor_name,
                restaurant_name=inv.restaurant_name,
                investment_amount=inv.investment_amount,
                investment_date=inv.investment_date,
                status=inv.status,
                notes=inv.notes,
                total_returns=round(returns, 2),
                transactions=tx_list,
            )
        )
    return result


def create_investment(db: Session, request: InvestmentCreateRequest) -> InvestmentAdminResponse:
    investor = db.query(Investor).filter(Investor.id == request.investor_id).first()
    if not investor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor not found.")

    inv = Investment(
        investor_id=request.investor_id,
        restaurant_name=request.restaurant_name.strip(),
        investment_amount=request.investment_amount,
        investment_date=request.investment_date or datetime.utcnow(),
        status=request.status,
        notes=request.notes.strip() if request.notes else None,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    investor_name = investor.user.name if investor.user else "Unknown"
    return InvestmentAdminResponse(
        id=inv.id,
        investor_id=inv.investor_id,
        investor_name=investor_name,
        restaurant_name=inv.restaurant_name,
        investment_amount=inv.investment_amount,
        investment_date=inv.investment_date,
        status=inv.status,
        notes=inv.notes,
        total_returns=0.0,
        transactions=[],
    )


def update_investment(db: Session, investment_id: int, request: InvestmentUpdateRequest) -> InvestmentAdminResponse:
    inv = db.query(Investment).filter(Investment.id == investment_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found.")

    if request.restaurant_name is not None and request.restaurant_name.strip():
        inv.restaurant_name = request.restaurant_name.strip()
    if request.investment_amount is not None:
        inv.investment_amount = request.investment_amount
    if request.status is not None:
        inv.status = request.status
    if request.notes is not None:
        inv.notes = request.notes.strip() or None

    db.commit()
    db.refresh(inv)

    investor_name = inv.investor.user.name if inv.investor and inv.investor.user else "Unknown"
    returns = sum(tx.amount for tx in inv.transactions)
    tx_list = [TransactionResponse.model_validate(tx) for tx in inv.transactions]
    return InvestmentAdminResponse(
        id=inv.id,
        investor_id=inv.investor_id,
        investor_name=investor_name,
        restaurant_name=inv.restaurant_name,
        investment_amount=inv.investment_amount,
        investment_date=inv.investment_date,
        status=inv.status,
        notes=inv.notes,
        total_returns=round(returns, 2),
        transactions=tx_list,
    )


def record_transaction(db: Session, investment_id: int, request: TransactionCreateRequest) -> TransactionResponse:
    inv = db.query(Investment).filter(Investment.id == investment_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found.")

    tx = InvestmentTransaction(
        investment_id=investment_id,
        transaction_type=request.transaction_type,
        amount=request.amount,
        transaction_date=request.transaction_date or datetime.utcnow(),
        reference=request.reference.strip() if request.reference else None,
        notes=request.notes.strip() if request.notes else None,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return TransactionResponse.model_validate(tx)


# --- Menu Management ---
def list_menu(db: Session) -> List[MenuItemAdminResponse]:
    items = db.query(MenuItem).order_by(MenuItem.category.asc(), MenuItem.name.asc()).all()
    return [MenuItemAdminResponse.model_validate(it) for it in items]


def create_menu_item(db: Session, request: MenuItemCreateRequest) -> MenuItemAdminResponse:
    item = MenuItem(
        name=request.name.strip(),
        category=request.category.strip(),
        price=request.price,
        quantity=request.quantity,
        is_available=request.is_available,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return MenuItemAdminResponse.model_validate(item)


def update_menu_item(db: Session, item_id: int, request: MenuItemUpdateRequest) -> MenuItemAdminResponse:
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found.")

    if request.name is not None and request.name.strip():
        item.name = request.name.strip()
    if request.category is not None and request.category.strip():
        item.category = request.category.strip()
    if request.price is not None:
        item.price = request.price
    if request.quantity is not None:
        item.quantity = request.quantity
    if request.is_available is not None:
        item.is_available = request.is_available

    db.commit()
    db.refresh(item)
    return MenuItemAdminResponse.model_validate(item)


# --- Reports ---
def get_sales_report(db: Session, start_date: Optional[str] = None, end_date: Optional[str] = None) -> SalesReportResponse:
    query = db.query(Order)
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Order.order_date >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(Order.order_date <= end_dt)
        except ValueError:
            pass

    orders = query.order_by(Order.order_date.asc()).all()
    total_sales = sum(o.total_amount for o in orders)

    daily_map = defaultdict(lambda: {"count": 0, "sales": 0.0})
    for o in orders:
        d_str = o.order_date.strftime("%Y-%m-%d")
        daily_map[d_str]["count"] += 1
        daily_map[d_str]["sales"] += o.total_amount

    daily_breakdown = [
        DailySalesItem(date=d, orders_count=data["count"], total_sales=round(data["sales"], 2))
        for d, data in sorted(daily_map.items())
    ]

    return SalesReportResponse(
        start_date=start_date,
        end_date=end_date,
        total_sales=round(total_sales, 2),
        total_orders_count=len(orders),
        daily_breakdown=daily_breakdown,
    )


def get_investment_report(db: Session) -> InvestmentReportResponse:
    investors = db.query(Investor).all()
    items = []
    total_invested_all = 0.0
    total_returns_all = 0.0

    for inv in investors:
        total_inv = sum(i.investment_amount for i in inv.investments)
        total_ret = 0.0
        for i in inv.investments:
            total_ret += sum(tx.amount for tx in i.transactions)

        total_invested_all += total_inv
        total_returns_all += total_ret

        items.append(
            InvestorReportItem(
                investor_id=inv.id,
                name=inv.user.name if inv.user else "Unknown",
                email=inv.user.email if inv.user else "Unknown",
                total_invested=round(total_inv, 2),
                total_returns=round(total_ret, 2),
                net_position=round(total_ret - total_inv, 2),
                investments_count=len(inv.investments),
            )
        )

    return InvestmentReportResponse(
        total_invested_all=round(total_invested_all, 2),
        total_returns_all=round(total_returns_all, 2),
        investors=items,
    )
