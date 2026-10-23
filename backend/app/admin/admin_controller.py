from __future__ import annotations
from datetime import datetime, date, time, timedelta
from math import floor
from typing import List, Optional
from collections import defaultdict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.auth.models import User
from app.auth.security import hash_password
from app.auth.schemas import UserCreateRequest
from app.billing.models import MenuItem, Order, OrderItem
from app.billing.schemas import OrderSummary
from app.investor.models import (
    Investor,
    Investment,
    InvestmentTransaction,
)
from app.admin.models import Expense, ProfitDistribution
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
    ExpenseCreateRequest,
    ExpenseResponse,
    ProfitDistributionRequest,
    ProfitDistributionPreview,
    ProfitDistributionResponse,
    InvestorProfitAllocation,
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
    if user:
        if request.name is not None and request.name.strip():
            user.name = request.name.strip()
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
        restaurant_name="",
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


def list_expenses(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[ExpenseResponse]:
    query = db.query(Expense)
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)
    expenses = query.order_by(Expense.expense_date.desc(), Expense.id.desc()).all()
    return [ExpenseResponse.model_validate(expense) for expense in expenses]


def create_expense(db: Session, request: ExpenseCreateRequest) -> ExpenseResponse:
    distributed_period = (
        db.query(ProfitDistribution)
        .filter(
            ProfitDistribution.start_date <= request.expense_date,
            ProfitDistribution.end_date >= request.expense_date,
        )
        .first()
    )
    if distributed_period:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Expenses cannot be added to a period whose profit has already been distributed.",
        )
    expense = Expense(
        description=request.description.strip(),
        amount=round(request.amount, 2),
        expense_date=request.expense_date,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


def delete_expense(db: Session, expense_id: int) -> None:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")
    distributed_period = (
        db.query(ProfitDistribution)
        .filter(
            ProfitDistribution.start_date <= expense.expense_date,
            ProfitDistribution.end_date >= expense.expense_date,
        )
        .first()
    )
    if distributed_period:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Expenses included in a completed profit distribution cannot be deleted.",
        )
    db.delete(expense)
    db.commit()


def _allocate_amount(total_amount: float, weights: List[float]) -> List[float]:
    total_cents = int(round(total_amount * 100))
    weight_total = sum(weights)
    if total_cents <= 0 or weight_total <= 0:
        return [0.0 for _ in weights]

    exact_cents = [total_cents * weight / weight_total for weight in weights]
    allocated_cents = [floor(value) for value in exact_cents]
    cents_remaining = total_cents - sum(allocated_cents)
    remainder_order = sorted(
        range(len(weights)),
        key=lambda index: exact_cents[index] - allocated_cents[index],
        reverse=True,
    )
    for index in remainder_order[:cents_remaining]:
        allocated_cents[index] += 1
    return [cents / 100 for cents in allocated_cents]


def _get_profit_distribution_preview(
    db: Session,
    request: ProfitDistributionRequest,
) -> ProfitDistributionPreview:
    start_at = datetime.combine(request.start_date, time.min)
    end_before = datetime.combine(request.end_date + timedelta(days=1), time.min)
    net_revenue = float(
        db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
        .filter(Order.order_date >= start_at, Order.order_date < end_before)
        .scalar()
    )
    total_expenses = float(
        db.query(func.coalesce(func.sum(Expense.amount), 0.0))
        .filter(
            Expense.expense_date >= request.start_date,
            Expense.expense_date <= request.end_date,
        )
        .scalar()
    )
    estimated_profit = round(net_revenue - total_expenses, 2)
    distributable_profit = max(0.0, estimated_profit)

    investment_totals = dict(
        db.query(Investment.investor_id, func.sum(Investment.investment_amount))
        .group_by(Investment.investor_id)
        .all()
    )
    investor_totals = [
        (investor, investor.user, round(float(investment_totals.get(investor.id, 0)), 2))
        for investor in db.query(Investor).order_by(Investor.id.asc()).all()
        if investor.user and float(investment_totals.get(investor.id, 0)) > 0
    ]
    total_investment = round(sum(invested for _, _, invested in investor_totals), 2)

    investor_profits = _allocate_amount(
        distributable_profit,
        [invested for _, _, invested in investor_totals],
    )
    allocations = []
    for (investor, user, invested), profit_amount in zip(investor_totals, investor_profits):
        ownership_percent = (invested / total_investment * 100) if total_investment else 0.0
        allocations.append(
            InvestorProfitAllocation(
                investor_id=investor.id,
                investor_name=user.name,
                investor_investment=invested,
                ownership_percent=round(ownership_percent, 4),
                investor_profit=profit_amount,
            )
        )

    return ProfitDistributionPreview(
        start_date=request.start_date,
        end_date=request.end_date,
        net_revenue=round(net_revenue, 2),
        total_expenses=round(total_expenses, 2),
        estimated_profit=estimated_profit,
        distributable_profit=round(distributable_profit, 2),
        total_investment=total_investment,
        can_distribute=distributable_profit > 0 and total_investment > 0 and bool(allocations),
        investors=allocations,
    )


def preview_profit_distribution(
    db: Session,
    request: ProfitDistributionRequest,
) -> ProfitDistributionPreview:
    existing = (
        db.query(ProfitDistribution)
        .filter(
            ProfitDistribution.start_date <= request.end_date,
            ProfitDistribution.end_date >= request.start_date,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"This period overlaps with an already distributed profit period "
                f"({existing.start_date} to {existing.end_date})."
            ),
        )
    return _get_profit_distribution_preview(db, request)


def distribute_profit(
    db: Session,
    request: ProfitDistributionRequest,
) -> ProfitDistributionResponse:
    existing = (
        db.query(ProfitDistribution)
        .filter(
            ProfitDistribution.start_date <= request.end_date,
            ProfitDistribution.end_date >= request.start_date,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"This period overlaps with an already distributed profit period "
                f"({existing.start_date} to {existing.end_date})."
            ),
        )

    preview = _get_profit_distribution_preview(db, request)
    if not preview.investors or preview.total_investment <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profit cannot be distributed because no investments are recorded.",
        )
    if preview.distributable_profit <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="There is no positive profit to distribute for this period.",
        )

    distribution = ProfitDistribution(
        start_date=request.start_date,
        end_date=request.end_date,
        net_revenue=preview.net_revenue,
        total_expenses=preview.total_expenses,
        distributable_profit=preview.distributable_profit,
    )
    db.add(distribution)
    try:
        db.flush()
        transactions = []
        allocations_by_investor = {item.investor_id: item.investor_profit for item in preview.investors}
        for investor_id, profit_amount in allocations_by_investor.items():
            investments = (
                db.query(Investment)
                .filter(Investment.investor_id == investor_id)
                .order_by(Investment.id.asc())
                .all()
            )
            investor_total = sum(investment.investment_amount for investment in investments)
            investment_amounts = _allocate_amount(
                profit_amount,
                [investment.investment_amount for investment in investments],
            )
            for investment, amount in zip(investments, investment_amounts):
                if amount <= 0:
                    continue
                transactions.append(
                    InvestmentTransaction(
                        investment_id=investment.id,
                        transaction_type="RETURN",
                        amount=amount,
                        transaction_date=distribution.distributed_at,
                        reference=f"Profit distribution #{distribution.id}",
                        notes=f"Profit share for {request.start_date} to {request.end_date}.",
                    )
                )
        db.add_all(transactions)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profit for this date range has already been distributed.",
        ) from exc
    db.refresh(distribution)
    return ProfitDistributionResponse(
        **preview.model_dump(),
        distribution_id=distribution.id,
        distributed_at=distribution.distributed_at,
    )


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
