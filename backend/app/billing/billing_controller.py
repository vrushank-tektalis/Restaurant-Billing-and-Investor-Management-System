from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.billing.models import MenuItem, Order, OrderItem
from app.billing.schemas import CreateOrderRequest


def get_menu_items(db: Session, search: Optional[str] = None) -> List[MenuItem]:
    """
    Fetch all available menu items, optionally filtered by name search.
    """
    query = db.query(MenuItem).filter(
        MenuItem.is_available.is_(True),
        MenuItem.quantity > 0,
    )
    if search and search.strip():
        query = query.filter(MenuItem.name.ilike(f"%{search.strip()}%"))
    return query.order_by(MenuItem.category.asc(), MenuItem.name.asc()).all()


def create_order(db: Session, request: CreateOrderRequest, cashier_user_id: Optional[int] = None) -> Order:
    """
    Create a new order with items:
    1. Validates all menu items exist and are available
    2. Calculates subtotal, tax amount, and total amount
    3. Generates a unique sequential bill number (e.g., BILL-20241022-0001)
    4. Persists the Order and OrderItem records
    """
    if not request.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item.",
        )

    # Aggregate quantities for duplicate item entries in the same request
    item_quantities: dict[int, int] = {}
    for item in request.items:
        if item.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quantity for item ID {item.item_id} must be greater than zero.",
            )
        item_quantities[item.item_id] = item_quantities.get(item.item_id, 0) + item.quantity

    item_ids = list(item_quantities.keys())

    # Fetch menu items from database
    menu_items = (
        db.query(MenuItem)
        .filter(MenuItem.id.in_(item_ids))
        .with_for_update()
        .all()
    )
    menu_items_by_id = {item.id: item for item in menu_items}

    # Validate that all requested items exist
    missing_ids = [iid for iid in item_ids if iid not in menu_items_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu items not found for IDs: {missing_ids}",
        )

    # Validate availability of items
    unavailable_items = [
        f"'{item.name}' (ID {item.id})"
        for item in menu_items_by_id.values()
        if not item.is_available
    ]
    if unavailable_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The following items are unavailable: {', '.join(unavailable_items)}",
        )

    stock_shortages = [
        f"'{menu_items_by_id[item_id].name}' (available {menu_items_by_id[item_id].quantity}, requested {quantity})"
        for item_id, quantity in item_quantities.items()
        if menu_items_by_id[item_id].quantity < quantity
    ]
    if stock_shortages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock: {', '.join(stock_shortages)}.",
        )

    # Calculate line totals and subtotal
    subtotal = 0.0
    item_rows = []
    for item_id, quantity in item_quantities.items():
        menu_item = menu_items_by_id[item_id]
        unit_price = round(float(menu_item.price), 2)
        line_total = round(unit_price * quantity, 2)
        subtotal += line_total
        item_rows.append({
            "item_id": menu_item.id,
            "item_name": menu_item.name,
            "unit_price": unit_price,
            "quantity": quantity,
            "line_total": line_total,
        })

    subtotal = round(subtotal, 2)
    tax_percent = max(0.0, float(request.tax_percent))
    tax_amount = round(subtotal * (tax_percent / 100.0), 2)
    discount = max(0.0, float(request.discount))
    total_amount = round(max(0.0, subtotal - discount + tax_amount), 2)

    # Generate sequential bill_number: BILL-YYYYMMDD-XXXX
    now = datetime.now()
    today_str = now.strftime("%Y%m%d")
    prefix = f"BILL-{today_str}-"

    today_orders_count = db.query(Order).filter(Order.bill_number.like(f"{prefix}%")).count()
    seq = today_orders_count + 1
    bill_number = f"{prefix}{seq:04d}"

    # Handle collision safety
    while db.query(Order).filter(Order.bill_number == bill_number).first():
        seq += 1
        bill_number = f"{prefix}{seq:04d}"

    # Create Order record
    new_order = Order(
        bill_number=bill_number,
        order_date=now,
        subtotal=subtotal,
        discount=round(discount, 2),
        tax_amount=tax_amount,
        total_amount=total_amount,
        payment_method=request.payment_method,
        status="COMPLETED",
        cashier_user_id=cashier_user_id,
    )
    db.add(new_order)
    db.flush()  # Populates new_order.id

    # Create OrderItem records
    for row in item_rows:
        order_item = OrderItem(
            order_id=new_order.id,
            item_id=row["item_id"],
            item_name=row["item_name"],
            unit_price=row["unit_price"],
            quantity=row["quantity"],
            line_total=row["line_total"],
        )
        db.add(order_item)

    for item_id, quantity in item_quantities.items():
        menu_items_by_id[item_id].quantity -= quantity

    db.commit()
    db.refresh(new_order)
    return new_order


def get_orders(db: Session) -> List[Order]:
    """
    Fetch all orders sorted by order date descending.
    """
    return db.query(Order).order_by(Order.order_date.desc()).all()


def get_order_by_id(db: Session, order_id: int) -> Order:
    """
    Fetch a specific order by ID including its items.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found.",
        )
    return order
