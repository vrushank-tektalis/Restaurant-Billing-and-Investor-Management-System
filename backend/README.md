# Restaurant Cashier Billing System - Backend

Clean, production-ready FastAPI + MySQL backend for a Restaurant Cashier Billing & Investor Management System.

## Architecture & Features

- **FastAPI**: Modern, fast web framework with interactive OpenAPI documentation.
- **SQLAlchemy & PyMySQL**: ORM models, relational mapping, and connection pool management.
- **Pydantic**: Request validation, response serialization, and type safety (v1 & v2 compatible).
- **Auto-Initialization**: Automatic table creation and sample menu seeding on startup.
- **Stock Inventory**: Menu quantities are tracked, validated against each order, and decremented on successful checkout.
- **Modular Directory Structure**: Separated into `billing`, `investor`, `admin`, and `database` packages.

---

## Directory Structure

```
backend/
├── .env.example
├── .env
├── requirements.txt
├── init_db.sql
├── README.md
└── app/
    ├── __init__.py
    ├── main.py
    ├── database/
    │   ├── __init__.py
    │   └── connection.py
    ├── auth/
    │   ├── auth_controller.py
    │   ├── models.py
    │   ├── schemas.py
    │   └── routes.py
    ├── billing/
    │   ├── __init__.py
    │   ├── models.py
    │   ├── schemas.py
    │   ├── billing_controller.py
    │   └── routes.py
    ├── investor/
    │   ├── investor_controller.py
    │   ├── models.py
    │   ├── schemas.py
    │   └── routes.py
    └── admin/
      ├── admin_controller.py
      ├── schemas.py
      └── routes.py
```

---

## Getting Started

### 1. Prerequisites
- Python 3.9+
- MySQL Server (v8.0+ or MariaDB)

### 2. Configure Environment
Copy `.env.example` to `.env` (or update existing `.env`):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=restaurant_db
```

Make sure the MySQL database exists:
```sql
CREATE DATABASE IF NOT EXISTS restaurant_db;
```
*(Alternatively, execute `init_db.sql` directly).*

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Seed Development Data
Run this once on an empty database to create the demo accounts and sample records:
```bash
python -m app.seed
```

To replace all application data with the large sample dataset (1 admin, 2 cashiers,
20 investors, 100 menu items, 60 investments, 300 investment transactions, and
500 orders), explicitly reset first:
```bash
python -m app.seed --reset
```

Demo admin login: `admin@restaurant.com` / `Admin@123`.

### 5. Run the Development Server
From the `backend` directory:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## API Endpoints

### Health Check
- `GET /` - Root status
- `GET /health` - Health check

### Billing (`/api/billing`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/billing/menu` | List available menu items. Optional `?search=query` parameter. |
| `POST` | `/api/billing/orders` | Create an order, calculate taxes/discount, assign bill number, and record snapshot items. |
| `GET` | `/api/billing/orders` | List summary of all orders sorted by date descending. |
| `GET` | `/api/billing/orders/{order_id}` | Retrieve complete order details with all line items. |

### Sample Order Request (`POST /api/billing/orders`)
```json
{
  "items": [
    {
      "item_id": 1,
      "quantity": 2
    },
    {
      "item_id": 9,
      "quantity": 2
    }
  ],
  "discount": 20.0,
  "tax_percent": 5.0,
  "payment_method": "UPI"
}
```
