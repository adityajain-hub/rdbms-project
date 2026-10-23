# Campus Lost & Found — Management System
**RDBMS Lab Project (CSC2131) · Manipal University Jaipur**

---

## Run the Project

**Step 1 — Load MySQL schema** (MySQL Workbench or CLI):
```sql
SOURCE /path/to/database/schema.sql;
```

**Step 2 — Start Flask server:**
```powershell
cd backend
python app.py
```
Open **`http://127.0.0.1:5000`** in Chrome. *(If MySQL is unavailable, SQLite fallback activates automatically.)*

### Demo User Accounts

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin (Aditya)** | `aditya.2502052853@muj.maipal.edu` | `adi@123` | Can report items, view claims, approve claims (fires Trigger) |
| **Student (Aarav)** | `aarav.sharma@muj.manipal.edu` | `student@123` | Can report items with photo attachment, file claims |

*(Use the **1-Click Quick Demo Sign-In** buttons on the login modal for instant evaluation).*

---

## Folder Structure

```
RDBMS Project/
├── backend/
│   ├── app.py            ← Flask REST API (8 routes, ~100 lines)
│   ├── campus_demo.db    ← SQLite fallback DB for offline demo
│   └── requirements.txt
├── database/
│   ├── schema.sql        ← 5 tables, View, Trigger, Procedure, Lookups
│   └── queries.sql       ← Practice SQL queries (JOINs, agg, etc.)
├── frontend/
│   ├── index.html        ← 3-panel desktop dashboard
│   ├── styles.css        ← Light / dark theme
│   ├── app.js            ← UI logic and API communication
│   └── images/           ← Category reference images
├── docs/
│   ├── project_report.html ← 7-page print-ready report (MUJ format)
│   ├── er_diagram.svg      ← Clean ER diagram
│   └── relational_schema.svg ← Relational schema with column types
└── README.md
```

---

## Teacher Q&A — Quick Reference

**Q: Where is the MySQL connection?**
`backend/app.py` → `get_db()` function — uses `mysql.connector.connect()` with automatic SQLite fallback.

**Q: Show your JOIN query.**
`backend/app.py` → `get_items()` — 3-table INNER JOIN across `items`, `categories`, `users`.

**Q: Explain your Trigger.**
`database/schema.sql` → `trg_resolve_item_on_claim` — AFTER UPDATE trigger on `claims`; auto-sets `items.status = 'RESOLVED'` and logs to `activity_logs`.

**Q: Why 3NF?**
- Categories are in a separate table → no transitive dependency (`item_id → category_id → category_name`).
- Each non-key column depends only on the primary key of its own table.

**Q: What does the Stored Procedure do?**
`sp_approve_claim(claim_id)` — wraps the approve logic in a transaction; teacher can call it directly in MySQL Workbench to demonstrate TCL/DCL concepts.

---

## Key RDBMS Concepts Demonstrated

| Lab Topic | Implementation |
|---|---|
| DDL / DML | `schema.sql` — CREATE, INSERT, UPDATE |
| Multi-table JOIN | `app.py` `get_items()` — 3-table JOIN |
| Aggregate Functions | `app.py` `get_stats()` — COUNT, SUM |
| View | `vw_active_items` in `schema.sql` |
| Trigger | `trg_resolve_item_on_claim` |
| Stored Procedure + TCL | `sp_approve_claim` with COMMIT/ROLLBACK |
| Normalization (3NF) | Separate `users`, `categories`, `items`, `claims` tables |
