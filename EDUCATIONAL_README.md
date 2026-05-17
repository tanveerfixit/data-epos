# 🎓 Comprehensive EPOS System Developer Manual & Architecture Guide

Welcome to the **definitive developer guide** for the Enterprise Point of Sale (EPOS) System. This manual is written for educational purposes, providing an exhaustive, line-by-line blueprint of the application's full-stack work. It documents every database schema, REST API contract, backend transaction script, and frontend architecture decision. 

Nothing is skipped. Use this manual to master advanced multi-tenancy, transactional data integrity, and high-performance Web application engineering.

---

## 📂 Master Table of Contents
1. [Full-Stack Architecture & Environment Mapping](#1-full-stack-architecture--environment-mapping)
2. [Database Schema Blueprint (MySQL)](#2-database-schema-blueprint-mysql)
3. [Multi-Tenant Scoping & User Roles (RBAC)](#3-multi-tenant-scoping--user-roles-rbac)
4. [Stateless Authentication, Sessions & Credentials Pipeline](#4-stateless-authentication-sessions--credentials-pipeline)
5. [Master API Endpoint Catalog (REST API Contracts)](#5-master-api-endpoint-catalog-rest-api-contracts)
6. [Transactional Engineering (Business Workflows In-Depth)](#6-transactional-engineering-business-workflows-in-depth)
7. [Frontend SPA Central Architecture (Vite + React 19)](#7-frontend-spa-central-architecture-vite--react-19)
8. [System Deployment, local execution & SQLite Compatibility](#8-system-deployment-local-execution--sqlite-compatibility)

---

## 1. Full-Stack Architecture & Environment Mapping

The EPOS platform operates under a **Software-as-a-Service (SaaS) Multi-Tenant** model. A single deployed server and a single relational database instance simultaneously serve multiple isolated businesses (tenants). 

```
                                 [ HIGH-LEVEL SYSTEM LANDSCAPE ]
                                 
           ┌────────────────────────────────────────────────────────────────────────┐
           │                      Vite + React 19 Frontend Client                   │
           │  - central App.tsx view switch   - AuthContext.tsx token persistence   │
           └───────────────────────────────────┬────────────────────────────────────┘
                                               │
                                               │ HTTP Requests + Bearer Token
                                               ▼
           ┌────────────────────────────────────────────────────────────────────────┐
           │                      Node.js Express Application Server                │
           │  - requireAuthAsync / requireAdminAsync route-level isolation filters │
           └───────────────────────────────────┬────────────────────────────────────┘
                                               │
                                               │ Parametrized secure SQL executions
                                               ▼
           ┌────────────────────────────────────────────────────────────────────────┐
           │                            MySQL Database Engine                       │
           │  - businesses  - branches  - users  - product_skus  - devices  - etc.  │
           └────────────────────────────────────────────────────────────────────────┘
```

### Server Execution Context:
* **Frontend Compilation**: Built on **Vite v6** using the high-performance **React 19** rendering engine. Tailwind CSS v4 is integrated as a compile-time compiler via the `@tailwindcss/vite` plugin to generate atomic styles.
* **Backend Runtime**: Built on **Node.js v18+** using **Express v4**. In development, the engine is executed directly from TypeScript using `tsx` (TypeScript Execute). In production, `esbuild` bundles the server-side code (`server.ts` and its route imports) into a single optimized JavaScript bundle (`server.js`).
* **Stateless Session Middleware**: The server does not maintain state in a file system or database table. User sessions are verified using cryptographically random UUID tokens mapped to user records in the Express application's RAM (`sessions` map).

---

## 2. Database Schema Blueprint (MySQL)

Below is the complete database structure defined in `src/mysql.ts`, complete with column data types, indices, and foreign key relations.

### A. Core Multi-Tenant & User Tables

#### 1. `businesses`
Stores the highest-level corporate tenant profiles.
```sql
CREATE TABLE IF NOT EXISTS businesses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,                -- User-friendly subdomain/routing identifier
  email VARCHAR(255),
  phone VARCHAR(100),
  subdomain VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(50),
  country VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',     -- 'active' or 'inactive' (awaits Developer approval)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);
```

#### 2. `branches`
Represents physical store nodes belonging to a Business tenant.
```sql
CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
```

#### 3. `users`
Accounts belonging to employees and administrators.
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  branch_id INT NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL DEFAULT '',       -- Legacy plaintext column (fallback only)
  password_hash VARCHAR(255),                      -- Secure Bcrypt cryptographic hash
  role VARCHAR(50) DEFAULT 'staff',                -- 'staff', 'admin', 'superadmin', 'developer'
  status VARCHAR(50) DEFAULT 'pending',            -- 'pending', 'approved', 'rejected', 'inactive'
  last_login TIMESTAMP NULL,
  last_generated_password VARCHAR(255),            -- Temp holder for administrative email resets
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP NULL,
  otp_code VARCHAR(6),
  otp_expires TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);
```

---

### B. Catalog & Local Stock Inventory Tables

```
                    ┌────────────────────────┐
                    │       products         │
                    └───────────┬────────────┘
                                │ 1
                                │
                                │ N
                    ┌───────────▼────────────┐
                    │     product_skus       │
                    └─────┬──────────────┬───┘
                          │ 1            │ 1
                          │              │
                        N │            N │
            ┌─────────────▼──┐        ┌──▼─────────────┐
            │  branch_stock  │        │    devices     │
            │ (Generic Count)│        │ (IMEI Serial)  │
            └────────────────┘        └────────────────┘
```

#### 4. `categories`
```sql
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  branch_id INT,
  parent_id INT NULL,
  name VARCHAR(255),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
```

#### 5. `products`
The core catalog item definitions shared across all locations of a business.
```sql
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku_barcode VARCHAR(50) UNIQUE,
  business_id INT NOT NULL,
  category_id INT NULL,
  manufacturer_id INT NULL,
  tax_class_id INT NULL,
  name VARCHAR(255) NOT NULL,
  base_unit_price DECIMAL(10, 2) DEFAULT 0.00,
  cost_price DECIMAL(10, 2) DEFAULT 0.00,
  category VARCHAR(100),
  product_type VARCHAR(50) DEFAULT 'stock',       -- 'stock' (generic inventory) vs 'serialized' (unique devices)
  description TEXT,
  allow_overselling TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

#### 6. `product_skus`
Contains distinct price and stock configurations.
```sql
CREATE TABLE IF NOT EXISTS product_skus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  sku_code VARCHAR(255) UNIQUE,
  barcode VARCHAR(255),
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

#### 7. `branch_stock`
Tracks physical inventory levels of generic products (e.g. Chargers, Cases) in each branch.
```sql
CREATE TABLE IF NOT EXISTS branch_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku_id INT NOT NULL,
  branch_id INT NOT NULL,
  quantity INT DEFAULT 0,
  UNIQUE KEY unique_sku_branch (sku_id, branch_id),
  FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);
```

#### 8. `devices`
Specifically tracks high-value serialized stock (e.g. Mobile Phones, Tablets) identified by a unique IMEI.
```sql
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  imei_serial VARCHAR(50) UNIQUE,
  business_id INT NOT NULL,
  branch_id INT NOT NULL,
  sku_id INT NOT NULL,
  imei VARCHAR(255) UNIQUE,
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  color VARCHAR(100),
  gb VARCHAR(50),
  ram VARCHAR(50),
  `condition` VARCHAR(100),
  po_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'in_stock',           -- 'in_stock', 'sold', 'transfer' (in-transit), 'void'
  unlocked VARCHAR(100) DEFAULT 'Unknown',
  imei_status VARCHAR(100) DEFAULT 'Clean',
  carrier VARCHAR(100) DEFAULT 'Unlocked',
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

---

### C. POS Sales, Ledger & Closing Audit Tables

#### 9. `customers`
```sql
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  branch_id INT,
  name VARCHAR(255),
  phone VARCHAR(100),
  email VARCHAR(255),
  address TEXT,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  secondary_phone VARCHAR(100),
  fax VARCHAR(100),
  offers_email TINYINT(1) DEFAULT 0,
  company VARCHAR(255),
  customer_type VARCHAR(50),
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(50),
  country VARCHAR(100),
  website VARCHAR(255),
  alert_message TEXT,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,       -- Tracks pre-paid store deposits and credits
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
```

#### 10. `invoices`
Stores final POS purchase records.
```sql
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  branch_id INT NOT NULL,
  user_id INT NULL,
  customer_id INT NULL,
  invoice_number VARCHAR(100),                     -- Formatted INV-XXXX (sales) or DE-XXXX (deposits)
  type VARCHAR(50) DEFAULT 'sale',                 -- 'sale', 'wallet' (deposits), 'repair' (repair jobs)
  subtotal DECIMAL(10,2),
  tax_total DECIMAL(10,2),
  discount_total DECIMAL(10,2),
  grand_total DECIMAL(10,2),
  paid_amount DECIMAL(10,2) DEFAULT 0,
  due_amount DECIMAL(10,2) DEFAULT 0,
  cost_total DECIMAL(10,2),
  profit_total DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'paid',               -- 'paid', 'partial', 'credit', 'void' (refunded)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);
```

#### 11. `invoice_items`
```sql
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  sku_id INT NOT NULL,
  device_id INT NULL,                              -- Nullable unless the item is a unique serialized device
  quantity INT NOT NULL,
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  discount DECIMAL(10,2),
  total DECIMAL(10,2),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id),
  FOREIGN KEY (device_id) REFERENCES devices(id)
);
```

#### 12. `payments`
```sql
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  invoice_id INT,
  type VARCHAR(50),                                -- 'sale_payment', 'wallet_deposit', 'wallet_use', 'repair_payment'
  method VARCHAR(100),                             -- 'Cash', 'Card', 'Store Credit', 'Wallet', 'Split'
  amount DECIMAL(10,2),
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);
```

#### 13. `closing_reports`
Performs Shift End physical cash balance comparisons.
```sql
CREATE TABLE IF NOT EXISTS closing_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL DEFAULT 0,
  branch_id INT NOT NULL,
  user_id INT NOT NULL,
  report_date DATE NOT NULL,
  starting_balance DECIMAL(10,2) DEFAULT 0,
  cash_counted DECIMAL(10,2) DEFAULT 0,
  calculated_cash DECIMAL(10,2) DEFAULT 0,
  difference DECIMAL(10,2) DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_deposits DECIMAL(10,2) DEFAULT 0,
  total_cash_in_drawer DECIMAL(10,2) DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 14. `jobs` (Repair Management)
```sql
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT,
  branch_id INT,
  customer_id INT,
  device_model VARCHAR(255),
  issue TEXT,
  status VARCHAR(50),                              -- 'new', 'in_progress', 'completed', 'collected'
  total_quote DECIMAL(10,2) DEFAULT 0,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  remaining_balance DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(100),
  notes TEXT NULL,                                 -- Activity updates appended over time
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 15. `device_transfers`
Tracks branch-to-branch inventory shipments.
```sql
CREATE TABLE IF NOT EXISTS device_transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  from_branch_id INT NOT NULL,
  to_branch_id INT NOT NULL,
  device_id INT,
  sku_id INT,
  quantity INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',            -- 'in_transit', 'completed', 'cancelled'
  initiated_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (from_branch_id) REFERENCES branches(id),
  FOREIGN KEY (to_branch_id) REFERENCES branches(id),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE SET NULL,
  FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 3. Multi-Tenant Scoping & User Roles (RBAC)

The EPOS system uses a robust relational mapping technique to scope business operations cleanly between shared centralized configurations and localized storefront operations, backed by a secure hierarchy of user authorization roles.

### A. Centralized vs. Localized Entities Matrix
To balance consistency (branding, customer records, and product definitions) with absolute local execution safety (stock counts, tills, and cash drawer balances), the tables in `src/mysql.ts` are categorized under distinct scopes:

1. **Business-Level Scoped Entities (Unified Bubble)**:
   * **`products` & `product_skus`**: Defined once globally per tenant. A charger has the same model code, SKU barcode, and cost structure in all branches, ensuring unified inventory management.
   * **`customers` & `customer_activity`**: The directory is global across the business. This permits cross-branch customer balance checks, store wallet usage (`wallet_balance`), and ledger reviews.
   * **`smtp_settings` & `settings`**: Configured globally so email delivery setups and basic business rules (such as custom checkout formats) apply universally across all branches.

2. **Branch-Level Scoped Entities (Isolated Storefront Nodes)**:
   * **`branch_stock`**: Local count registers. For SKU `X`, Branch `A` can have `10` units while Branch `B` has `0`.
   * **`devices` (IMEI Serial Records)**: Physical items reside directly inside a single storefront node. The record updates its `branch_id` only when a formal shipment transfer completes.
   * **`invoices` & `payments`**: Logged directly at the point-of-sale branch context to support hyper-local sales volume reporting.
   * **`closing_reports` (End of Day Shifts)**: Tracks cash counting registers, starting/closing till balances, and operational cash differences per storefront drawer.
   * **`jobs` (Repair Tickets)**: Managed and serviced locally by repair technicians working in a specific branch.

---

### B. Access Hierarchy & Role Capabilities Matrix
The system enforces a 4-tier Role-Based Access Control (RBAC) model. Scopes and routes are guarded dynamically on the server based on the user's decrypted session token.

```
                                [ ACCESS PRIVILEGE FLOW ]
                                
       [Developer]      ──► Global business approvals, master DB analytics, system overrides
            │
      [Superadmin]      ──► Business-wide context switching, user controls, global settings
            │
        [Admin]         ──► Branch user approvals, branch refund actions, local settings
            │
        [Staff]         ──► Local POS checkouts, customer creation, repair jobs, EOD starts
```

The database query execution layer applies these roles strictly to filter inputs:

```typescript
const isSuper = req.user.role === 'superadmin';
const isDeveloper = req.user.role === 'developer';

// Superadmins and Developers view global business records, while Staff/Admins are branch-locked
const sql = (isSuper || isDeveloper || !req.user.branch_id)
  ? 'SELECT * FROM invoices WHERE business_id = ?'
  : 'SELECT * FROM invoices WHERE business_id = ? AND branch_id = ?';
```

---

## 4. Stateless Authentication, Sessions & Credentials Pipeline

The core authentication system handles session security and password protection on the server.

```
                              [ AUTHENTICATION FLOW ]
                              
  [Sign-up Input] ─► Bcrypt Hashing (Round 10) ─► Safe SQL Insertion ─► Inactive Pending Status
                                                                                  │
  [Developer CC] ─────────────────────────────────────────────────────────► Approves Business
                                                                                  │
  [User Login] ───► Validate Bcrypt Match ─────────────────────────────────► Generate UUID Token
                                                                                  │
  [Header Auth] ──► Authorization Header ──► requireAuthAsync Middleware ───► Inject User Context
```

### A. Secure Password Hashing
Bcrypt is used with a cost factor of `10` to encrypt passwords. The legacy plain-text `password` column is bypassed.
During login, if an old user records a successful plain-text match, the system securely upgrades their credentials on the fly:
```typescript
let valid = false;
if (user.password_hash) {
  valid = await bcrypt.compare(password, user.password_hash);
} else {
  // Legacy plain-text verification
  valid = user.password === password;
  if (valid) {
    // Automatically migrate plain-text to Bcrypt hash
    const hash = await bcrypt.hash(password, 10);
    await execute("UPDATE users SET password_hash=?, password='' WHERE id=?", [hash, user.id]);
  }
}
```

### B. Session Memory Map
User sessions are tracked in-memory using cryptographically secure random UUIDs. A background daemon runs hourly to purge expired tokens:
```typescript
interface Session { userId: number; expiresAt: number; }
export const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 Hours TTL

const _cleanup = setInterval(() => {
  const now = Date.now();
  for (const [token, sess] of sessions) {
    if (sess.expiresAt <= now) sessions.delete(token);
  }
}, 60 * 60 * 1000);
```

### C. Multi-Tenant Request Scoping Middleware
Every protected endpoint passes through `requireAuthAsync`. This middleware validates the bearer token, retrieves the authentic user record directly from the database, and injects their context into the request:
```typescript
export async function requireAuthAsync(req: any, res: any, next: any) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const sess = token ? sessions.get(token) : undefined;
  if (!sess || sess.expiresAt <= Date.now()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const user = await queryOne('SELECT * FROM users WHERE id=?', [sess.userId]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    // Inject variables into Express request
    req.userId = sess.userId;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Session validation failed' });
  }
}
```

### D. OTP & Password Recovery Pipelines
* **Forgot Password (`POST /api/auth/forgot-password`)**: Generates a 6-digit numeric OTP valid for 2 minutes and emails it to the user.
* **Verify OTP (`POST /api/auth/verify-otp`)**: Matches the input OTP against `otp_code` and checks that the expiration timestamp is valid. If correct, it generates a secure 30-minute UUID password reset link.
* **Reset Password (`POST /api/auth/reset-password`)**: Verifies the reset link and updates the database with the new hashed password. It also invalidates all current active sessions for that user:
  ```typescript
  // Invalidate all active sessions for this user on password change
  for (const [token, sess] of sessions) {
    if (sess.userId === user.id) sessions.delete(token);
  }
  ```

---

## 4. Master API Endpoint Catalog (REST API Contracts)

Below is the complete API catalog detailing methods, payloads, and responses for every service route.

### A. Authentication API (`/api/auth`)

#### 1. `POST /signup`
Registers a new business tenant or branch staff member.
* **Payload**:
  ```json
  {
    "mode": "business_register", // or "staff_join"
    "name": "Jane Doe",
    "email": "jane@business.com",
    "password": "SecurePassword123!",
    "business_name": "TechInbox Ireland", // required for business_register
    "branch_name": "Dublin Retail Hub",   // required for business_register
    "branch_id": 4                        // required for staff_join
  }
  ```
* **Response**:
  ```json
  { "success": true, "message": "Business registered successfully! You can now log in." }
  ```

#### 2. `POST /login`
Authenticates a user and opens a secure session.
* **Payload**: `{"email": "jane@business.com", "password": "SecurePassword123!"}`
* **Response**:
  ```json
  {
    "token": "d748f219-c09a-4122-8bc1-6f01a75c12ef",
    "user": {
      "id": 12,
      "name": "Jane Doe",
      "email": "jane@business.com",
      "role": "superadmin",
      "status": "approved",
      "branch_id": 4,
      "branch_name": "Dublin Retail Hub",
      "business_id": 2,
      "business_name": "TechInbox Ireland"
    }
  }
  ```

#### 3. `GET /me`
Retrieves details of the currently logged-in user.
* **Headers**: `Authorization: Bearer <token>`
* **Response**:
  ```json
  {
    "id": 12,
    "business_id": 2,
    "branch_id": 4,
    "name": "Jane Doe",
    "email": "jane@business.com",
    "role": "superadmin",
    "status": "approved",
    "branch_name": "Dublin Retail Hub",
    "business_name": "TechInbox Ireland"
  }
  ```

---

### B. POS checkout & Invoices API (`/api/invoices`)

#### 1. `GET /`
Lists historical transaction sales. Automatically filtered by business and branch.
* **Query Parameters**: `startDate=2026-05-01&endDate=2026-05-17`
* **Response**:
  ```json
  [
    {
      "id": 89,
      "business_id": 2,
      "branch_id": 4,
      "invoice_number": "SA-102",
      "subtotal": 650.00,
      "tax_total": 0.00,
      "discount_total": 50.00,
      "grand_total": 600.00,
      "paid_amount": 600.00,
      "status": "paid",
      "created_at": "2026-05-17T09:00:00.000Z",
      "customer_name": "John Smith"
    }
  ]
  ```

#### 2. `GET /:id`
Retrieves detailed information for a single invoice, including line items and payments.
* **Response**:
  ```json
  {
    "id": 89,
    "invoice_number": "SA-102",
    "subtotal": 650.00,
    "grand_total": 600.00,
    "status": "paid",
    "items": [
      { "sku_id": 8, "device_id": 14, "quantity": 1, "price": 600.00, "product_name": "iPhone 13", "imei": "358912345678901" }
    ],
    "payments": [
      { "id": 145, "type": "sale_payment", "method": "Card", "amount": 600.00 }
    ]
  }
  ```

#### 3. `POST /checkout`
Submits a shopping cart from the POS terminal to process a sale.
* **Payload**:
  ```json
  {
    "customer_id": 3,
    "subtotal": 650.00,
    "tax_total": 0.00,
    "discount_total": 50.00,
    "grand_total": 600.00,
    "items": [
      { "sku_id": 8, "device_id": 14, "quantity": 1, "price": 600.00 }
    ],
    "payments": [
      { "method": "Card", "amount": 600.00 }
    ]
  }
  ```
* **Response**:
  ```json
  { "success": true, "invoiceId": 89, "invoiceNumber": "SA-102" }
  ```

#### 4. `POST /:id/refund`
Voids an invoice and returns its items to active inventory.
* **Payload**: `{"method": "Cash"}`
* **Response**: `{"success": true}`

---

### C. Inventory, Devices & Transfers API (`/api/inventory`)

#### 1. `POST /add`
Logs a batch of incoming stock (e.g. bulk accessory shipments or unique serialized devices).
* **Payload**:
  ```json
  {
    "sku_id": 14,
    "branch_id": 4,
    "quantity": 2,
    "cost_price": 400.00,
    "selling_price": 550.00,
    "po_number": "PO-991",
    "items": [
      { "imei": "358912345678902", "color": "Graphite", "gb": "128", "condition": "Like New" },
      { "imei": "358912345678903", "color": "Silver", "gb": "128", "condition": "New" }
    ]
  }
  ```
* **Response**: `{"success": true}`

#### 2. `POST /transfers`
Initiates a stock transfer from the active branch to a destination branch.
* **Payload**:
  ```json
  {
    "device_id": 15,
    "to_branch_id": 6,
    "notes": "Dublin warehouse transfer request"
  }
  ```
* **Response**: `{"success": true, "id": 4}`

#### 3. `PUT /transfers/:id/complete`
Completes an in-transit transfer, moving the stock balance to the target location.
* **Response**: `{"success": true}`

---

### D. Repairs Management API (`/api/repairs`)

#### 1. `POST /`
Creates a repair ticket and processes any initial cash deposit.
* **Payload**:
  ```json
  {
    "customer_id": 3,
    "device_model": "Samsung S23",
    "issue": "Cracked Front AMOLED Panel replacement",
    "status": "new",
    "total_quote": 200.00,
    "deposit_paid": 50.00,
    "remaining_balance": 150.00,
    "payment_method": "Cash"
  }
  ```
* **Response**: `{"id": 45, "customer_id": 3}`

#### 2. `PUT /:id`
Updates a repair status, appends progress notes, or records the final payment.
* **Payload**:
  ```json
  {
    "status": "completed",
    "notes": "Screen replaced successfully. Passed digitizer diagnostics.",
    "collected_amount": 150.00,
    "collected_method": "Card"
  }
  ```
* **Response**: `{"success": true, "invoice_number": "RE-004"}`

---

## 5. Transactional Engineering (Business Workflows In-Depth)

Point of Sale operations rely on strict database transactions. To prevent data corruption, if a query fails during a multi-step operation, the entire sequence is rolled back.

```
                         [ TRANSACTION ROLLBACK PIPELINE ]
                         
  ┌───────────────────────┐
  │ START TRANSACTION     │
  └──────────┬────────────┘
             │
             ├─► 1. Save Core Invoice record ───────────────► [SUCCESS]
             │
             ├─► 2. Dedeplete branch product stocks ────────► [SUCCESS]
             │
             ├─► 3. Log device sold status ─────────────────► [CRASH: Lockout / Duplicate IMEI]
             │
             ▼
  ┌───────────────────────┐
  │ ROLLBACK TRANSACTION  │ ◄─── (Reverts all database changes; no corrupted balances)
  └───────────────────────┘
```

### POS Checkout Transaction Walkthrough (`invoices.ts`):
Let's trace how the Express transaction handler processes a sale:

```typescript
const conn = await pool.getConnection();
try {
  // 1. Establish the transactional block
  await conn.beginTransaction();

  // 2. Fetch inventory catalog details using locking keys
  const [skuInfo] = await conn.query(
    'SELECT s.id as sku_id, p.product_type FROM product_skus s JOIN products p ON s.product_id=p.id WHERE s.id IN (?) FOR UPDATE',
    [skuIds]
  );
  
  // 3. Generate a sequential invoice number (e.g. SA-102)
  const invoiceNumber = `SA-${nextNum}`;
  
  // 4. Create the core invoice entry
  const [invResult] = await conn.execute(
    'INSERT INTO invoices (business_id, branch_id, grand_total, status) VALUES (?, ?, ?, ?)',
    [req.user.business_id, req.user.branch_id, grand_total, status]
  );
  const invoiceId = (invResult as any).insertId;

  // 5. Update inventory levels based on product type
  for (const item of items) {
    await conn.execute(
      'INSERT INTO invoice_items (invoice_id, sku_id, device_id, quantity, price, total) VALUES (?,?,?,?,?,?)',
      [invoiceId, item.sku_id, item.device_id || null, item.quantity, item.price, item.total]
    );

    if (item.device_id) {
      // Serialized product: mark individual device as sold
      await conn.execute(
        "UPDATE devices SET status='sold' WHERE id=? AND branch_id=?", 
        [item.device_id, req.user.branch_id]
      );
    } else {
      // Generic product: decrement general stock count
      await conn.execute(
        "UPDATE branch_stock SET quantity = quantity - ? WHERE sku_id=? AND branch_id=?",
        [item.quantity, item.sku_id, req.user.branch_id]
      );
    }
  }

  // 6. Record payment records
  for (const payment of payments) {
    await conn.execute(
      'INSERT INTO payments (invoice_id, method, amount) VALUES (?, ?, ?)',
      [invoiceId, payment.method, payment.amount]
    );
  }

  // 7. Commit transaction to disk
  await conn.commit();
  res.json({ success: true, invoiceId });

} catch (err) {
  // If ANY query fails, roll back all database changes to maintain data integrity
  await conn.rollback();
  res.status(500).json({ error: err.message });
} finally {
  conn.release();
}
```

---

## 6. Frontend SPA Central Architecture (Vite + React 19)

The frontend is built as a single-page application (SPA) optimized for low-latency tablet and desktop use.

### Central Routing in `App.tsx`
Instead of using traditional client-side routers that reload resources, the application uses a lightweight **state-based router** to dynamically switch views in memory:

```tsx
// Central switch-case views inside src/App.tsx
const renderView = () => {
  switch (currentView) {
    case 'home':             return <HomeMenu onNavigate={(v) => setCurrentView(v)} />;
    case 'register':         return <CashRegister onSelectProduct={viewDetails} />;
    case 'repairs':          return <RepairList />;
    case 'invoices':         return <InvoiceList onSelectInvoice={viewInvoice} />;
    case 'products':         return <ProductList onSelectProduct={viewProduct} />;
    case 'devices':          return <DeviceInventory onSelectDevice={viewDevice} />;
    case 'transfers':        return <BranchTransfer />;
    case 'end-of-day':       return <EndOfDay />;
    default:                 return <Dashboard />;
  }
};
```

### Central User Session Context (`AuthContext.tsx`)
Authentication state is managed globally using React Context. This context handles user login, session persistence, and logout:

```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check for active token on application startup
  useEffect(() => {
    const savedToken = localStorage.getItem('epos_token');
    if (savedToken) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${savedToken}` } })
        .then(r => r.json())
        .then(user => {
          if (user.id) { setCurrentUser(user); setToken(savedToken); }
          else { localStorage.removeItem('epos_token'); }
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    localStorage.setItem('epos_token', data.token);
    setCurrentUser(data.user);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem('epos_token');
    setCurrentUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Visual Style and Dynamic CSS Variables
The application's theme matches user configurations dynamically by injecting dynamic variables into the DOM wrapper.
For example, active variables are defined in [index.css](file:///c:/epos/src/index.css):
```css
:root {
  --bg-app: #0b0f19;
  --bg-header: #121826;
  --bg-sidebar: #0f1420;
  --bg-card: #151d30;
  --brand-primary: #3b82f6;
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --border-base: rgba(255, 255, 255, 0.08);
}
```

---

## 7. System Deployment, Local Execution & SQLite Compatibility

### A. Environment Configuration (`.env`)
Create a `.env` file in the root directory to store database connection details and environment variables:
```env
PORT=3000
DB_HOST=srv2113.hstgr.io
DB_PORT=3306
DB_USER=u583652021_clare_user
DB_PASS=Tani@8877!!
DB_NAME=u583652021_clare
NODE_ENV=development
```

### B. Main Installation and Startup Commands
Follow these commands to install dependencies, run the development server, or build the application for production:

```bash
# 1. Install all dependencies
npm install

# 2. Start the development server (runs express API & Vite dev server concurrently)
npm run dev

# 3. Build and package the application for production deployment
npm run build

# 4. Start the compiled production server
npm run start
```

### C. SQLite Fallback Compatibility
To support local development or simple offline environments where a central MySQL instance is unavailable, the database engine is designed to fall back to a local SQLite file (`pos.db`) using the `better-sqlite3` library if MySQL configurations are omitted.

---

> [!NOTE]
> This developer manual is maintained by the core engineering group as a reference for database operations and API schemas. For visual design guidelines and component selectors, reference the [LAYOUT_README.md](file:///c:/epos/LAYOUT_README.md) file.
