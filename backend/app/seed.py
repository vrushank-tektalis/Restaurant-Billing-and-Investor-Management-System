"""Seed a deterministic development dataset.

Run ``python -m app.seed`` on an empty database, or pass ``--reset`` to
drop and recreate all application tables before seeding.
"""
from __future__ import annotations

import argparse
import random
from datetime import datetime, timedelta

from app.database.connection import Base, SessionLocal, engine
import app.database.base  # Register all models with Base.metadata
from app.auth.models import User
from app.auth.security import hash_password
from app.billing.models import MenuItem, Order, OrderItem
from app.investor.models import Investor, Investment, InvestmentTransaction


INVESTOR_NAMES = [
    "Vikram Malhotra", "Ananya Singhal", "Aarav Mehta", "Diya Kapoor",
    "Ishaan Rao", "Meera Nair", "Kabir Shah", "Aditi Iyer", "Arjun Das",
    "Sara Khan", "Rohan Joshi", "Nisha Reddy", "Dev Patel", "Tara Bose",
    "Karan Gill", "Maya Menon", "Neel Verma", "Ira Chawla", "Rehan Ali",
    "Pia Fernandes",
]

MENU_GROUPS = {
    "Breakfast": [
        "Masala Dosa", "Idli (2 pcs)", "Medu Vada", "Rava Dosa", "Onion Uttapam",
        "Pongal", "Poori Bhaji", "Aloo Paratha", "Chole Bhature", "Upma",
        "Pesarattu", "Mysore Dosa", "Set Dosa", "Paneer Paratha", "Misal Pav",
        "Poha", "Sabudana Khichdi", "Egg Bhurji Toast", "Vegetable Sandwich", "Pav Bhaji",
    ],
    "Main Course": [
        "Paneer Butter Masala", "Dal Tadka", "Jeera Rice", "Vegetable Biryani", "Chicken Biryani",
        "Palak Paneer", "Chana Masala", "Kadai Paneer", "Rajma Masala", "Mushroom Masala",
        "Veg Pulao", "Chicken Curry", "Fish Curry", "Malai Kofta", "Matar Paneer",
        "Dal Makhani", "Sambar Rice", "Lemon Rice", "Egg Curry", "Mutton Rogan Josh",
    ],
    "Breads": [
        "Butter Naan", "Garlic Naan", "Tandoori Roti", "Lachha Paratha", "Plain Kulcha",
        "Butter Roti", "Missi Roti", "Roomali Roti", "Cheese Naan", "Aloo Kulcha",
        "Onion Kulcha", "Pudina Paratha", "Whole Wheat Chapati", "Stuffed Naan", "Amritsari Kulcha",
        "Jowar Roti", "Bajra Roti", "Keema Naan", "Peshawari Naan", "Methi Paratha",
    ],
    "Beverages": [
        "Mango Lassi", "Fresh Lime Soda", "Masala Chai", "Cold Coffee", "Sweet Lassi",
        "Filter Coffee", "Rose Milk", "Watermelon Juice", "Orange Juice", "Mint Lemonade",
        "Buttermilk", "Iced Tea", "Strawberry Shake", "Chocolate Shake", "Tender Coconut Water",
        "Ginger Tea", "Espresso", "Americano", "Pineapple Juice", "Badam Milk",
    ],
    "Desserts": [
        "Gulab Jamun", "Vanilla Ice Cream", "Rasmalai", "Gajar Halwa", "Chocolate Brownie",
        "Kheer", "Jalebi", "Kulfi", "Rasgulla", "Mango Cheesecake",
        "Carrot Cake", "Tiramisu", "Fruit Custard", "Moong Dal Halwa", "Pistachio Kulfi",
        "Chocolate Mousse", "Shahi Tukda", "Apple Pie", "Coconut Ladoo", "Phirni",
    ],
}

RESTAURANT_NAMES = [
    "Royal Spice Kitchen", "Spice and Curry Express", "Saffron Table",
    "Cedar House Dining", "Monsoon Bistro", "Garden Tandoor",
    "Copper Kettle Cafe", "Coastal Harvest", "Olive and Ember", "The Curry Room",
]


def seed_database(reset: bool = False) -> None:
    if reset:
        print("Dropping and recreating all application tables...")
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        has_existing_data = any(
            db.query(model).first() is not None
            for model in (User, MenuItem, Order, Investor, Investment, InvestmentTransaction)
        )
        if has_existing_data:
            print("Database already contains records. Use --reset to replace the development dataset.")
            return

        rng = random.Random(20261022)
        now = datetime.utcnow()

        users = [
            User(
                name="System Administrator",
                email="admin@restaurant.com",
                password_hash=hash_password("Admin@123"),
                role="ADMIN",
                is_active=True,
            ),
            User(
                name="Rohan Sharma (Cashier)",
                email="cashier1@restaurant.com",
                password_hash=hash_password("Cashier@123"),
                role="CASHIER",
                is_active=True,
            ),
            User(
                name="Pooja Verma (Cashier)",
                email="cashier2@restaurant.com",
                password_hash=hash_password("Cashier@123"),
                role="CASHIER",
                is_active=True,
            ),
        ]
        for index, name in enumerate(INVESTOR_NAMES, start=1):
            users.append(User(
                name=name,
                email=f"investor{index}@restaurant.com",
                password_hash=hash_password("Investor@123"),
                role="INVESTOR",
                is_active=True,
            ))
        db.add_all(users)
        db.flush()

        investor_users = [user for user in users if user.role == "INVESTOR"]
        cities = ["Bengaluru", "Mumbai", "New Delhi", "Hyderabad", "Pune", "Chennai", "Jaipur"]
        investors = [
            Investor(
                user_id=user.id,
                phone=f"+91 {9000000000 + index}",
                address=f"{20 + index}, Market Road, {cities[index % len(cities)]}",
                status="INACTIVE" if index % 9 == 0 else "ACTIVE",
            )
            for index, user in enumerate(investor_users)
        ]
        db.add_all(investors)
        db.flush()

        menu_items = []
        for category, names in MENU_GROUPS.items():
            for index, name in enumerate(names):
                item_index = len(menu_items)
                menu_items.append(MenuItem(
                    name=name,
                    category=category,
                    price=float(40 + ((item_index * 37) % 460)),
                    quantity=rng.randint(180, 320),
                    is_available=item_index % 23 != 0,
                ))
        db.add_all(menu_items)
        db.flush()
        saleable_items = [item for item in menu_items if item.is_available]

        investments = []
        for investor_index, investor in enumerate(investors):
            for venture_index in range(3):
                restaurant = RESTAURANT_NAMES[(investor_index + venture_index) % len(RESTAURANT_NAMES)]
                investments.append(Investment(
                    investor_id=investor.id,
                    restaurant_name=f"{restaurant} - Branch {venture_index + 1}",
                    investment_amount=float(125000 + ((investor_index * 27100 + venture_index * 53000) % 875000)),
                    investment_date=now - timedelta(days=rng.randint(200, 540)),
                    status="COMPLETED" if venture_index == 2 else "ACTIVE",
                    notes=f"Development portfolio entry {investor_index + 1}-{venture_index + 1}.",
                ))
        db.add_all(investments)
        db.flush()

        transactions = []
        for investment in investments:
            for transaction_index in range(5):
                transaction_type = "RETURN" if transaction_index % 2 == 0 else "DISTRIBUTION"
                transactions.append(InvestmentTransaction(
                    investment_id=investment.id,
                    transaction_type=transaction_type,
                    amount=round(investment.investment_amount * rng.uniform(0.004, 0.018), 2),
                    transaction_date=investment.investment_date + timedelta(days=20 + transaction_index * 30),
                    reference=f"TX-{investment.id:04d}-{transaction_index + 1:02d}",
                    notes=f"Scheduled {transaction_type.lower()} record.",
                ))
        db.add_all(transactions)

        cashier_users = [user for user in users if user.role == "CASHIER"]
        orders = []
        for order_index in range(500):
            order_date = now - timedelta(
                days=rng.randint(0, 364),
                hours=rng.randint(0, 23),
                minutes=rng.randint(0, 59),
            )
            chosen_items = rng.sample(saleable_items, rng.randint(1, 4))
            order_lines = []
            subtotal = 0.0
            for menu_item in chosen_items:
                quantity = rng.randint(1, 3)
                line_total = round(float(menu_item.price) * quantity, 2)
                subtotal += line_total
                menu_item.quantity -= quantity
                order_lines.append(OrderItem(
                    item_id=menu_item.id,
                    item_name=menu_item.name,
                    unit_price=float(menu_item.price),
                    quantity=quantity,
                    line_total=line_total,
                ))

            subtotal = round(subtotal, 2)
            discount = round(subtotal * 0.05, 2) if order_index % 7 == 0 else 0.0
            tax_amount = round(subtotal * 0.05, 2)
            orders.append(Order(
                bill_number=f"BILL-{order_date:%Y%m%d}-{order_index + 1:04d}",
                order_date=order_date,
                subtotal=subtotal,
                discount=discount,
                tax_amount=tax_amount,
                total_amount=round(max(0.0, subtotal - discount + tax_amount), 2),
                payment_method="UPI" if order_index % 2 else "Cash",
                status="COMPLETED",
                cashier_user_id=cashier_users[order_index % len(cashier_users)].id,
                items=order_lines,
            ))
        db.add_all(orders)
        db.commit()

        print("Seed completed successfully.")
        print(f"Users: {len(users)} (1 admin, 2 cashiers, {len(investors)} investors)")
        print(f"Menu items: {len(menu_items)}")
        print(f"Investments: {len(investments)}")
        print(f"Investment transactions: {len(transactions)}")
        print(f"Orders: {len(orders)} (with generated order lines)")
        print("Admin login: admin@restaurant.com / Admin@123")
        print("Cashier login: cashier1@restaurant.com / Cashier@123")
        print("Investor login: investor1@restaurant.com / Investor@123")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Create sample restaurant system data.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop all application tables and replace their contents with the sample dataset.",
    )
    args = parser.parse_args()
    seed_database(reset=args.reset)


if __name__ == "__main__":
    main()