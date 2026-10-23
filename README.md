# 🍽️ Restaurant Investor Management System

A full-stack Restaurant Management System with **Cashier Billing**, **Investor Portal**, and **Admin Dashboard** modules — built with React + Vite (frontend) and FastAPI + MySQL (backend).

For the full project guide—including scope, architecture, database schema, API reference, security notes, and Mermaid diagrams—see [DOCUMENTATION.md](./DOCUMENTATION.md).

---

## 👥 User Roles & Login Credentials (after seeding)

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@restaurant.com` | `Admin@123` | Full access to all modules |
| **Cashier** | `cashier1@restaurant.com` | `Cashier@123` | Billing POS + History |
| **Cashier** | `cashier2@restaurant.com` | `Cashier@123` | Billing POS + History |
| **Investor** | `investor1@restaurant.com` | `Investor@123` | Investment dashboard |
| **Investor** | `investor2@restaurant.com` | `Investor@123` | Investment dashboard |

---

## 📁 Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── auth/             ← Login, JWT, user management
│   │   ├── billing/          ← Cashier POS — menu, orders, receipts
│   │   ├── investor/         ← Investor profile & investment views
│   │   ├── admin/            ← Admin dashboard, menu mgmt, reports
│   │   ├── database/         ← SQLAlchemy engine, session, models base
│   │   ├── seed.py           ← Seeds users, investors, menu, sample orders
│   │   └── main.py           ← FastAPI app entry point
│   ├── .env                  ← DB credentials (create from .env.example)
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── auth/             ← Login page, AuthContext, JWT helpers
    │   ├── billing/          ← Cashier POS page, history, receipt modal
    │   ├── investor/         ← Investor dashboard, investment detail/history
    │   ├── admin/            ← Admin dashboard, menu/investor/investment mgmt
    │   ├── shared/           ← Shared utilities (apiHelper, token storage)
    │   ├── App.jsx           ← Role-based routing & navigation
    │   └── main.jsx          ← React 18 entry with AuthProvider
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **MySQL 8.0+** (running locally)

---

## 🗄️ Step 1 — Set Up MySQL Database

Open MySQL Workbench or CLI and run:

```sql
CREATE DATABASE IF NOT EXISTS restaurant_db;
```

---

## 🐍 Step 2 — Set Up the Backend

### 2a. Configure Environment

```bash
cd backend
copy .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=restaurant_db
```

### 2b. Create Virtual Environment & Install Dependencies

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2c. Seed the Database (creates users, menu items, sample data)

```powershell
python -m app.seed
```

On an empty database, this creates development data:
- 23 users (1 admin, 2 cashiers, 20 investors)
- 100 menu items across 5 categories
- 20 investor profiles, 60 investments, and 300 investment transactions
- 500 sample billing orders with order lines

Use `python -m app.seed --reset` only when you intend to drop and replace all application tables and their data.

### 2d. Start the Backend Server

```powershell
uvicorn app.main:app --reload --port 8000
```

**API Docs (Swagger UI):** http://localhost:8000/docs

---

## ⚛️ Step 3 — Set Up the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at: **http://localhost:5173**

---

## 🚀 Quick Start Reference

| Terminal | Command |
|---|---|
| **Backend** | `cd backend && .\venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload --port 8000` |
| **Frontend** | `cd frontend && npm run dev` |

Open **http://localhost:5173** → Login page appears → use credentials above.

---

## 🗃️ Database Tables

| Table | Purpose |
|---|---|
| `users` | All users — admin, cashier, investor — with hashed passwords and roles |
| `menu_items` | Restaurant menu with name, category, price, availability flag |
| `orders` | Bill header — bill number, date, totals, payment method, cashier ref |
| `order_items` | Line items — price/name snapshot at time of order |
| `investors` | Investor profile linked to a user account |
| `investments` | Individual investment records per investor |
| `investment_transactions` | Returns and distributions per investment |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login and receive JWT token |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/logout` | Logout (client clears token) |

### Billing (CASHIER / ADMIN)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/billing/menu` | List available menu items |
| POST | `/api/billing/orders` | Create order and generate bill |
| GET | `/api/billing/orders` | List all orders (history) |
| GET | `/api/billing/orders/{id}` | Get full order with items |

### Investor (INVESTOR / ADMIN)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/investor/profile` | View investor profile |
| GET | `/api/investor/investments` | View investments and transactions |
| GET | `/api/investor/summary` | View financial summary |

### Admin (ADMIN only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard metrics |
| GET/POST/PUT | `/api/admin/investors` | Manage investor accounts |
| GET/POST/PUT | `/api/admin/investments` | Manage investments |
| POST | `/api/admin/investments/{id}/transactions` | Record returns/distributions |
| GET/POST/PUT | `/api/admin/menu` | Manage menu items |
| GET | `/api/admin/reports/sales` | Sales report |
| GET | `/api/admin/reports/investments` | Investment report |
| POST | `/api/admin/users` | Create cashier/investor accounts |

---

## 🛠️ Troubleshooting

**`error while attempting to bind on address ... port 8000`**
- Port 8000 is already in use. Run: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F`

**Login fails with "Invalid email or password"**
- Make sure you ran `python -m app.seed` to create the test users
- Check `.env` has correct MySQL credentials

**`pymysql` not found**
- Activate the venv first: `.\venv\Scripts\Activate.ps1`
- Then: `pip install -r requirements.txt`

**Frontend shows network error**
- Ensure backend is running on port 8000
- Check `frontend/vite.config.js` — `/api` proxy points to `http://localhost:8000`

---

## 📌 Module Roadmap

| Module | Status | Notes |
|---|---|---|
| **Auth** (Login/JWT) | ✅ Complete | All 3 roles — ADMIN, CASHIER, INVESTOR |
| **Cashier Billing** | ✅ Complete | POS, cart, receipt, history, print |
| **Investor Portal** | ✅ Complete | Dashboard, investment details, history |
| **Admin Panel** | ✅ Complete | Users, menu, investors, investments, reports |
