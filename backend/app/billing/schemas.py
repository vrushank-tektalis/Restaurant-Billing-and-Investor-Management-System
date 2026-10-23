from __future__ import annotations
from datetime import datetime
from typing import List, Literal
from pydantic import BaseModel, Field, ConfigDict


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MenuItemResponse(ORMBase):
    id: int
    name: str
    category: str
    price: float
    quantity: int
    is_available: bool


class OrderItemRequest(BaseModel):
    item_id: int = Field(..., gt=0, description="Unique ID of the menu item")
    quantity: int = Field(..., gt=0, description="Quantity of items ordered")


class CreateOrderRequest(BaseModel):
    items: List[OrderItemRequest] = Field(..., min_items=1, description="List of items in the order")
    discount: float = Field(default=0.0, ge=0.0, description="Flat discount amount")
    tax_percent: float = Field(default=0.0, ge=0.0, description="Tax percentage to apply (e.g., 5.0 for 5%)")
    payment_method: Literal["Cash", "UPI"] = Field(..., description="Method of payment: 'Cash' or 'UPI'")


class OrderItemResponse(ORMBase):
    id: int
    item_name: str
    unit_price: float
    quantity: int
    line_total: float


class OrderResponse(ORMBase):
    id: int
    bill_number: str
    order_date: datetime
    subtotal: float
    discount: float
    tax_amount: float
    total_amount: float
    payment_method: str
    items: List[OrderItemResponse]


class OrderSummary(ORMBase):
    id: int
    bill_number: str
    order_date: datetime
    total_amount: float
    payment_method: str
