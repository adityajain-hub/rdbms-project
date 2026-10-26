# Campus Lost & Found — Relational Database Management System

**Course:** Relational Database Management Systems Lab (CSC2131)  
**Department:** Computer Science & Engineering  
**Institution:** Manipal University Jaipur (MUJ)  
**Lead Developer:** Aditya Jain (Admin / Lead Developer)  

---

## 📌 Project Overview

The **Campus Lost & Found Management System** is a full-stack, enterprise-grade academic web application designed to streamline the reporting, tracking, verification, and recovery of misplaced student and faculty belongings across the MUJ campus.

Unlike simple CRUD demos, this system is built on strict **Third Normal Form (3NF)** relational database principles in **MySQL 8.0 (InnoDB)**, implementing advanced database features including **multi-table JOINs**, a **database View**, an **AFTER UPDATE Trigger**, a **transaction-controlled Stored Procedure (TCL)**, and a **centralized live audit log**.

---

## 🚀 Key Features & Modules

### 1. Item Lifecycle & Reporting
* **Report Lost or Found Belongings:** Campus members can post detailed listings specifying item name, category, campus location, incident date, identifying marks, and contact information.
* **Photo Attachment & Image Upload:** Users can attach actual photos from their device; files are sanitized and stored on the server via `/api/upload` with instant preview.
* **Auto-Categorization:** 6 official campus categories with dedicated SVG line iconography (Electronics & Gadgets, College ID & Documents, Wallets & Bags, Keys & Access Cards, Books & Stationery, Personal Belongings & Attire).

### 2. Smart Handover & Claim Verification
* **Direct Finder Handover Notification:** A finder who spots a lost belonging can directly send a handover message (`/api/items/<id>/notify-found`) with their contact details to the owner without generating a duplicate item listing.
* **Ownership Claim Submission:** True owners of found items submit verifiable identifying proof (serial number, lockscreen image, scratch marks).
* **Role-Based Handover Authorization (RBAC):** Only the original reporter of an item or Admin Aditya has permission to verify handover and mark an item as **RESOLVED**. Other students see a locked access notice (`🔒 Handover Verification Pending`).

### 3. Records Archive & Live System Audit Trail
* **Resolved Belongings Archive:** Resolved items are automatically removed from active boards and permanently archived in the **Records** section.
* **Live System Audit Logs (`activity_logs`):** Every lifecycle event (`ITEM_REPORTED`, `FINDER_NOTIFIED`, `CLAIM_SUBMITTED`, `CLAIM_APPROVED`, `ITEM_RESOLVED`, `USER_REGISTERED`) is permanently written to the database with timestamps and filterable in real time.

### 4. Authentication & Dynamic Account Switcher
* **Session Management:** Secure login and registration supporting `ADMIN`, `STUDENT`, `FACULTY`, and `STAFF` roles.
* **1-Click Quick Demo Sign-In:** One-click instant switching between Admin Aditya and Student Aarav Sharma for rapid evaluator demonstration.
* **Auto-Refresh State Synchronization:** Account switching refreshes the workspace, instantly re-evaluating DOM permissions and claim actions.

### 5. UI/UX & Architecture
* **Desktop 3-Panel Workspace:** Sidebar filters, dynamic grid deck, and deep-inspection right sidebar.
* **Dark & Light Mode:** Toggleable color themes with CSS design tokens.
* **Dual-Database Failover:** Connected to MySQL 8.0 InnoDB by default; automatically falls back to an embedded SQLite database if MySQL server is offline.

---

## 🗄️ Database Architecture & RDBMS Syllabus Mapping

| Syllabus Component | Course Outcome (CO) | Database Implementation |
|---|---|---|
| **Data Definition (DDL)** | CO1: Relational Modeling | `schema.sql` — `users`, `categories`, `items`, `claims`, `activity_logs` with PK, FK, UNIQUE, and ENUM constraints. |
| **Data Normalization** | CO2: Normalization (3NF) | 1NF (atomic attributes), 2NF (no partial dependencies), 3NF (categories separated to eliminate transitive dependencies). |
| **Multi-Table JOINs** | CO3: Advanced Querying | 3-table `INNER JOIN` (`items` + `categories` + `users`) in `/api/items` and `queries.sql`. |
| **Database View** | CO3: Views & Abstraction | `vw_active_items` — pre-joined view abstracting active listings for dashboard consumers. |
| **Set Operations & Subqueries** | CO3: Relational Algebra | `UNION` incident logs, single-row `(SELECT MAX(item_id))` and multi-row `IN / NOT IN` queries in `queries.sql`. |
| **Security & Privileges (DCL)** | CO4: Database Security | Least-privilege user creation (`campus_app`) with `GRANT SELECT, INSERT, UPDATE` and `REVOKE DROP` in `queries.sql`. |
| **Transaction Control (TCL)** | CO5: Transactions & Concurrency | `sp_approve_claim` executing `START TRANSACTION` and `COMMIT`; savepoint rollback demonstration in `queries.sql`. |
| **Database Trigger** | CO5: Active Databases | `trg_resolve_item_on_claim` — automatically transitions item status to `RESOLVED` and writes audit record on claim approval. |

---

## 📂 Project Directory Structure

```
RDBMS Project/
├── backend/
│   ├── app.py               # Flask REST API (Authentication, Uploads, Items, Claims, Logs)
│   ├── init_db.py           # SQLite database schema initializer & lookup seed
│   ├── campus_demo.db       # Embedded offline demonstration database
│   └── requirements.txt     # Python dependencies (Flask, mysql-connector-python, werkzeug)
├── database/
│   ├── schema.sql           # Complete MySQL 8.0 DDL (Tables, View, Trigger, Procedure, Lookups)
│   └── queries.sql          # Academic Lab Demonstration Suite (Labs 6 to 12)
├── frontend/
│   ├── index.html           # 3-Panel Desktop Dashboard & Authentication Modals
│   ├── styles.css           # Modern CSS Design System (Dark & Light Theme)
│   ├── app.js               # Frontend Controller, RBAC Permissions, & State Management
│   ├── uploads/             # Attached item photographs uploaded by users
│   └── images/              # Master reference category imagery
├── docs/
│   ├── project_report.html  # Comprehensive, print-ready MUJ project report
│   ├── er_diagram.svg       # Entity-Relationship diagram
│   └── relational_schema.svg# Detailed relational schema diagram
└── README.md                # Project documentation and evaluation guide
```

---

## ⚙️ Setup & Execution Instructions

### Step 1: Initialize MySQL Database
Open **MySQL 8.0 Command Line Client** or **MySQL Workbench**, then execute:
```sql
SOURCE C:/Users/DELL/OneDrive/Desktop/RDBMS Project/database/schema.sql;
```
*(Verify by running: `USE campus_lost_and_found; SHOW TABLES;`)*

### Step 2: Install Python Dependencies
Open PowerShell or Terminal and install the required packages:
```powershell
pip install -r backend/requirements.txt
```

### Step 3: Configure Database Credentials (Optional)
If your local MySQL root password differs from default (`aditya`), update `DB_CONFIG` in `backend/app.py` or set an environment variable:
```powershell
$env:DB_PASSWORD="your_mysql_password"
```

### Step 4: Run the Backend Server
```powershell
cd backend
python app.py
```
*The server will start at: **`http://127.0.0.1:5000`***

### Step 5: Launch the Application
Open your web browser (Chrome / Edge / Firefox) and navigate to:
**`http://127.0.0.1:5000`**

*(Note: If MySQL is not running on your computer, the backend will automatically activate the SQLite demo engine so the entire web app remains fully functional).*

---

## 👥 Pre-Configured Demo Accounts

| User Name | Role | Email | Password | Permissions |
|---|---|---|---|---|
| **Aditya** | `ADMIN` | `aditya.2502052853@muj.maipal.edu` | `adi@123` | Full administrative control, review claims, approve transfers, trigger execution, resolve any item. |
| **Aarav Sharma** | `STUDENT` | `aarav.sharma@muj.manipal.edu` | `student@123` | Report belongings with photos, notify finders, claim found items, resolve own reported items. |
| **Priya Patel** | `STUDENT` | `priya.patel@muj.manipal.edu` | `student@123` | Report belongings, file ownership claims, direct handover messaging. |
| **Sunil Yadav** | `STAFF` | `sunil.security@jaipur.manipal.edu` | `staff@123` | Campus security desk account for logging turned-in belongings. |

*(Click **Switch** in the top navigation bar and select **1-Click Quick Demo Sign-In** for instant account switching).*

---

## 🎓 Teacher Evaluation & Viva Cheat Sheet

### Q1: Why is this schema in Third Normal Form (3NF)?
* **1NF:** Every column contains single, atomic values. Primary keys (`user_id`, `category_id`, `item_id`, `claim_id`, `log_id`) uniquely identify rows.
* **2NF:** Every table has a single-column primary key, eliminating partial dependencies.
* **3NF:** Transitive functional dependencies are eliminated. For example, `category_name` is isolated into `categories` table. The `items` table stores only the foreign key `category_id`, avoiding `item_id → category_id → category_name` redundancy.

### Q2: Show me the Trigger in action.
1. When an ownership claim is approved in the Admin Claims panel (or via `CALL sp_approve_claim(claim_id);`), the MySQL trigger `trg_resolve_item_on_claim` fires automatically on the `claims` table.
2. It sets `items.status = 'RESOLVED'` and inserts a record into `activity_logs`.
3. The item immediately vanishes from active boards and appears in the **Records Archive**, while the audit log appears in the **Audit & Activity Logs** tab.

### Q3: Where is Transaction Control (TCL) implemented?
In `database/schema.sql`, the stored procedure `sp_approve_claim` encapsulates the status update inside a `START TRANSACTION` ... `COMMIT` block. In `database/queries.sql` (Section 8), a test script demonstrates `SAVEPOINT` and `ROLLBACK TO SAVEPOINT`.

### Q4: What happens if someone tries to resolve another student's item?
The system enforces strict Role-Based Access Control (RBAC) on both the client (`frontend/app.js`) and server (`backend/app.py`). Only the original reporter (`reported_by`) or Admin Aditya can mark an item resolved. Unauthorized users see `🔒 Handover Verification Pending` and any direct API attempt is rejected with HTTP 403 Forbidden.

---

## 📄 License & Academic Attribution
Developed for the **RDBMS Lab Project (CSC2131)** at **Manipal University Jaipur**.  
All rights reserved © 2026.
