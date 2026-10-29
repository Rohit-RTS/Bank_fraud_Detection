# Banking Fraud Detection System

A complete, production-quality full-stack Banking Fraud Detection System built as a DBMS mini-project.

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, Recharts, React Router v7 |
| Backend | Node.js, Express.js |
| Database | MySQL (existing `banking_fraud_db`) |
| HTTP Client | Axios |
| Icons | Lucide React |

---

## 📁 Project Structure

```
banking-fraud-detection/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── hooks/             # useApi, useToast
│       ├── layouts/           # MainLayout, Sidebar, Navbar
│       ├── pages/             # 8 application pages
│       ├── services/          # api.js (Axios client)
│       └── utils/             # formatters.js
│
└── server/                    # Express backend
    ├── config/db.js           # MySQL connection pool
    ├── controllers/           # Business logic per resource
    ├── middleware/            # Error handler, validation
    ├── routes/                # Express routers
    ├── services/              # Fraud detection engine
    └── utils/                 # queryHelpers.js
```

---

## 🗄️ Database

Uses the existing `banking_fraud_db` MySQL database — **no schema changes, no data loss**.

### Tables Used
- `customers`, `accounts`, `transactions`
- `fraud_alerts`, `fraud_rules`, `investigations`, `audit_logs`

### Views Used
- `vw_transaction_details` — Joins transactions with customer/account
- `vw_fraud_alert_details` — Joins alerts with rules/customer
- `vw_suspicious_audit_logs` — Suspicious audit entries

### Stored Procedure
- `sp_account_transaction_history`

### Triggers (auto-generate audit logs)
- `trg_transaction_audit_insert` / `trg_transaction_audit_update`
- `trg_fraud_alert_audit_insert` / `trg_fraud_alert_audit_update`

---

## ⚙️ Prerequisites

- Node.js v18+
- MySQL 8+ running locally
- Existing `banking_fraud_db` database

---

## 🚀 Setup & Running

### 1. Backend

```bash
cd server
npm install
# Edit .env with your MySQL password
npm run dev
```

Backend runs on: **http://localhost:5000**

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**

---

## 🔧 Environment Variables

### `server/.env`
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=banking_fraud_db
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### `client/.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | DB connection health check |
| GET | `/api/dashboard/stats` | Dashboard metrics |
| GET | `/api/dashboard/charts` | Chart data |
| GET/POST | `/api/customers` | List / Create customers |
| GET/PUT | `/api/customers/:id` | Get / Update customer |
| GET/POST | `/api/accounts` | List / Create accounts |
| GET | `/api/accounts/:id/transactions` | Account tx history |
| GET/POST | `/api/transactions` | List / Simulate transaction |
| GET | `/api/transactions/:id` | Transaction details |
| GET | `/api/fraud-alerts` | List fraud alerts |
| GET | `/api/fraud-alerts/:id` | Alert details + audit log |
| PATCH | `/api/fraud-alerts/:id/status` | Update alert status |
| GET/PUT | `/api/fraud-rules/:id` | Get / Update fraud rule |
| GET/POST | `/api/investigations` | List / Create investigations |
| PATCH | `/api/investigations/:id` | Update investigation |
| GET | `/api/audit-logs` | Read-only audit trail |

---

## 🔍 Fraud Detection Engine

Rule-based detection in `server/services/fraudDetectionService.js`:

### Rule 1 – High Value Transaction
Triggers when `amount > threshold_amount` configured in `fraud_rules`.

### Rule 2 – Transaction Velocity
Triggers when account makes too many transactions within a time window.

### Rule 3 – Repeated Failed Transactions
Triggers when account has repeated FAILED transactions within a window.

All rules are read from the `fraud_rules` table (`is_active = 1`).
Duplicate alerts (same tx + rule) are prevented.

---

## 📊 Application Pages

| Route | Page |
|-------|------|
| `/dashboard` | Live metrics, charts, recent activity |
| `/customers` | Customer management with CRUD |
| `/accounts` | Account listing and creation |
| `/transactions` | Transaction history + simulation |
| `/fraud-alerts` | Alert management + status updates |
| `/fraud-rules` | Rule configuration |
| `/investigations` | Case management |
| `/audit-logs` | Read-only system audit trail |

---

## 🔒 Security

- Credentials stored in `.env` (never committed)
- All SQL uses parameterized queries
- Request body validation via `express-validator`
- Enum values validated against actual DB schema
- Audit logs are read-only from the frontend

---

## 🧪 Testing the System

1. Start backend: `cd server && npm run dev`
2. Visit `http://localhost:5000/api/health` — should show `banking_fraud_db`
3. Start frontend: `cd client && npm run dev`
4. Create a simulated transaction > ₹50,000 → should trigger fraud alert
5. Update alert status from OPEN → CONFIRMED
6. Check Audit Logs page — triggers auto-populate entries

---

## 🔧 Troubleshooting

**MySQL connection failed:**
- Ensure MySQL service is running
- Check `DB_PASSWORD` in `server/.env`
- Verify database name is `banking_fraud_db`

**CORS errors:**
- Ensure backend is running on port 5000
- Check `FRONTEND_URL` in `server/.env`

**Tailwind styles not loading:**
- Ensure `@tailwindcss/vite` is installed
- Check `vite.config.js` includes the plugin
