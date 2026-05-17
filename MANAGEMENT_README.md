# EPOS System Management & Architecture Guide

Welcome to the EPOS System documentation. This guide explains the core functional layout, multi-tenant data flow, registration processes, and how the system separates entities (Businesses, Branches, and Users).

---

## 1. System Architecture & Layout

The EPOS platform operates as a multi-tenant (SaaS) application. This means multiple distinct companies (Businesses) can use the same deployed application and database, completely isolated from one another.

### Core Entities:
- **Developer / Super Admin**: The ultimate system owner (e.g., `support@techinbox.ie`, `tanveerfixit@gmail.com`). Has access to the **Developer Control Center** to oversee all businesses globally.
- **Businesses**: The highest tenant level. A business acts as a completely isolated bubble. Data from Business A can never be seen by Business B.
- **Branches**: Physical or logical store locations belonging to a Business. A Business can have one or many branches.
- **Users**: Employees configured with role-based access control (`staff`, `admin`, `superadmin`) who work at a specific Branch.

---

## 2. Data Flow & Security Isolation

To guarantee that tenants do not see each other's data, the entire database and API structure relies on **Strict Isolation Filters**.

1. **Database Schema**: Almost every major table (`customers`, `products`, `invoices`, `settings`, `smtp_settings`, `devices`) possesses a `business_id`. 
2. **Authentication Injection**: When a user logs in, the server generates a token mapped to their specific `business_id` and `branch_id`. 
3. **API Routing**: Every standard backend route (like `/api/products` or `/api/customers`) automatically enforces `WHERE business_id = ?` under the hood. No client-side request structure is trusted for multi-tenant isolation.
4. **Branch Level Filtering**: While products and customers are accessible across the entire Business, volatile entities like **Invoices** and **Inventory Quantities** (`branch_stock`) are strictly tracked per `branch_id`.

---

## 3. The Registration Pipeline

The journey of onboarded users involves a strict verification flow to maintain system integrity.

### A. Business Registration (New Tenant)
1. **Sign Up**: A prospective owner visits the portal and switches to "Register Business" mode. They input their Business Name, Initial Branch Name, and Admin Credentials.
2. **Inactive State**: By default, to prevent spam and unapproved usage, the system inserts the business into the database with an `inactive` status.
3. **The Developer Gate**: The user cannot immediately log in. They will see an error stating: *"Your business account is pending developer approval..."*
4. **Approval**: A developer logs in from their specialized account, opens the **Developer Control Center**, navigates to the **Business Hub**, reviews the tenant, and clicks "Approve". Only then is the business `active`.

### B. User / Staff Enrollment
1. **Sign Up**: A new employee visits the portal and stays in the standard "Join as Staff" mode. They select their localized branch from a provided lookup.
2. **Pending Approval**: Their account is immediately placed into a `pending` state with the `staff` role.
3. **Admin Verification**: The Business Owner (Admin) logs into the System Control Panel, reviews pending users for their business, and approves them. If a user loses their credentials, the Admin can use the portal to instantly generate and email them a fresh, sanitized password.

## 4. Business vs. Branch Operational Scoping

To maintain high efficiency in a retail and repair SaaS ecosystem, the platform splits entities into **Global Business Contexts** and **Localized Branch Operations**.

```
                           [ SYSTEM SCOPING MATRIX ]

  ┌──────────────────────────────────────────────────────────────────────┐
  │                        BUSINESS SCOPE (Tenant Bubble)                │
  │  - Shared Customers     - Unified SKUs & Prices   - SMTP Settings    │
  │  - Suppliers Catalog    - Business Brand & Name   - Categories Map   │
  └───────────────────────────────────┬──────────────────────────────────┘
                                      │
           ┌──────────────────────────┴──────────────────────────┐
           ▼                                                     ▼
┌─────────────────────────────────────┐               ┌─────────────────────────────────────┐
│      BRANCH A SCOPE (Store A)       │               │      BRANCH B SCOPE (Store B)       │
│ - Local branch_stock quantities     │               │ - Local branch_stock quantities     │
│ - Physical IMEI device records      │               │ - Physical IMEI device records      │
│ - Invoices & Sales transaction logs │               │ - Invoices & Sales transaction logs │
│ - Drawer EOD Closing audits         │               │ - Drawer EOD Closing audits         │
│ - Localized Repair tickets          │               │ - Localized Repair tickets          │
└─────────────────────────────────────┘               └─────────────────────────────────────┘
```

### A. Business Scope (The Global Tenant Bubble)
A Business represents the master organization. To prevent duplication and improve administrative oversight, several modules are shared globally across all branches under a single `business_id`:
* **Unified Product Catalog**: Items (`products` and `product_skus`) are defined once at the business level. This guarantees consistent pricing, barcodes, SKU naming, and description fields across all retail outlets.
* **Shared Customers Directory**: Customers are business-scoped. A customer registered at *Branch A* can walk into *Branch B*, have their record instantly retrieved, make payments, utilize their store credit wallet (`wallet_balance`), and view their consolidated ledger statement.
* **Business-Wide Settings**: SMTP email servers, categories, suppliers, and manufacturer catalogs are shared, ensuring that all physical branches present a cohesive brand identity and send emails through a single verified server.

### B. Branch Scope (The Localized Retail Node)
A Branch represents a physical storefront or local warehouse. The system scopes highly dynamic and location-sensitive data to `branch_id` to prevent cross-location operational conflicts:
* **Localized Stock Quantities**: Physical inventory levels inside the `branch_stock` table are branch-scoped. If *Branch A* sells a charger, the quantity decreases for *Branch A* only, leaving *Branch B*'s inventory untouched.
* **Physical IMEI Trackers**: High-value devices (e.g., iPhones, iPads) have a physical location. Individual rows in the `devices` table belong strictly to the `branch_id` where the unit physically resides.
* **Cash Drawer Auditing**: EOD shift reports (`closing_reports`) are strictly branch-scoped. Counter tills, expected drawer calculations, and physical currency audits are performed locally for each location.
* **Branch-to-Branch Stock Transfers**: To shift stock between stores, users must create a transfer record. This initiates a secure, auditable lifecycle:
  1. **Initiated (`in_transit`)**: The item is locked in the source branch's stock and marked as `transfer` status.
  2. **Completed**: Once the target branch receives and signs for the shipment, the database automatically decrements the item's quantity in the source branch's `branch_stock`, increments it in the target branch's `branch_stock`, and updates the device's `branch_id`.

---

## 5. User Roles and Capabilities (RBAC Matrix)

The application enforces a rigorous **Role-Based Access Control (RBAC)** matrix via server-side verification middleware. The hierarchy consists of four roles: `staff`, `admin`, `superadmin`, and `developer`.

```
                                [ RBAC ACCESS HIERARCHY ]
                                
       [Developer]      ──► Master platform dashboard, global audits, business approvals
            │
      [Superadmin]      ──► Business-wide settings, multi-branch switching, user management
            │
        [Admin]         ──► Branch administration, local settings, staff approvals
            │
        [Staff]         ──► POS checkout, repair creation, local stock search
```

### A. Role Capabilities & Restrictions

| Capability / Permission | Staff | Admin | Superadmin | Developer |
| :--- | :---: | :---: | :---: | :---: |
| **POS Checkout & Invoicing** | Yes | Yes | Yes | Yes |
| **Create & Edit Local Repairs** | Yes | Yes | Yes | Yes |
| **Search Local Branch Inventory** | Yes | Yes | Yes | Yes |
| **Initiate Stock Transfers** | Yes | Yes | Yes | Yes |
| **Approve Inbound Transfers** | Yes | Yes | Yes | Yes |
| **Verify Drawer EOD Reports** | Local Drawer | Local Branch | All Branches | All Branches |
| **Void or Refund Sales** | No | Local Branch | All Branches | Yes |
| **Approve / Manage Local Users** | No | Local Branch | All Branches | Yes |
| **Modify Business Settings / SMTP** | No | No | Yes | Yes |
| **Create / Manage Branches** | No | No | Yes | Yes |
| **Access Developer Control Panel** | No | No | No | Yes |
| **Approve / Suspend Entire Businesses** | No | No | No | Yes |

### B. Detailed Role Workflows

#### 1. Staff (Branch Operator)
The everyday frontline user. Scoped entirely to a single physical location (`branch_id`).
* **Operational Scope**: Performs localized, transactional tasks. They use the cash register interface to scan items, process sales, log repair details, search for stock, and print customer receipts.
* **Security Scoping**: The database query builder intercepts their token and injects their branch ID:
  `SELECT * FROM branch_stock WHERE sku_id = ? AND branch_id = req.user.branch_id`
* **Core Restrictions**: Staff have zero administrative privileges. They cannot access system settings, alter tax policies, approve new staff requests, delete customer activity, or view transactions from other locations.

#### 2. Admin (Branch Manager)
An administrative role scoped to a single branch (`branch_id`).
* **Operational Scope**: Manages local operations. They approve newly registered staff accounts for their assigned branch, view local sales history, issue refunds, and adjust local stock details.
* **Core Restrictions**: They cannot alter global business configurations (e.g., SMTP servers) or register new branches.

#### 3. Superadmin (Business Owner)
The highest administrative tier within a business tenant.
* **Operational Scope**: Owns the entire business bubble (`business_id`). They have total control over all configurations and data across all branches.
* **Ubiquitous Context Switching**: Superadmins bypass branch-level database filters. In the React interface, they can use a **Branch Selector** to instantly switch their active context to any location to view local invoices, manage inventory, or audit transactions.
  `const sql = isSuper ? 'SELECT * FROM invoices WHERE business_id = ?' : 'SELECT * FROM invoices WHERE business_id = ? AND branch_id = ?'`
* **User & Branch Management**: Superadmins can create new branches, update SMTP email parameters, modify payment methods, and manage all users across the business.

#### 4. Developer (System Owner)
The ultimate administrator of the entire SaaS platform.
* **Operational Scope**: Owns and manages the software deployment. They operate outside individual business restrictions to maintain the platform.
* **Developer Control Panel**: Developers access a secure dashboard to monitor overall platform health, view global registration logs, approve newly registered businesses, or suspend non-compliant tenants.
* **Bypassing Tenant Scoping**: Developers can bypass tenant checks for platform-wide troubleshooting, database maintenance, or manual record updates.

