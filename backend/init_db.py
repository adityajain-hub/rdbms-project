"""
Campus Lost & Found — Database Initializer
Creates tables and seeds sample data for SQLite demo mode (matching schema.sql & sample_data.sql)
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'campus_demo.db')

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'STUDENT'
);

CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    location TEXT NOT NULL,
    date_incident TEXT NOT NULL,
    image_url TEXT DEFAULT 'images/laptop.jpg',
    status TEXT DEFAULT 'ACTIVE',
    reported_by INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (reported_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS claims (
    claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    claimant_name TEXT NOT NULL,
    claimant_contact TEXT NOT NULL,
    proof_details TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    FOREIGN KEY (item_id) REFERENCES items(item_id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    details TEXT NOT NULL,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_resolve_item_on_claim
AFTER UPDATE OF status ON claims
FOR EACH ROW
WHEN NEW.status = 'APPROVED' AND OLD.status != 'APPROVED'
BEGIN
    UPDATE items SET status = 'RESOLVED' WHERE item_id = NEW.item_id;
    INSERT INTO activity_logs (action_type, details)
    VALUES ('CLAIM_APPROVED', 'Claim #' || NEW.claim_id || ' approved for Item #' || NEW.item_id);
END;
"""

SEED_USERS = [
    (1, 'Aditya', 'aditya.2502052853@muj.maipal.edu', '9829012345', 'adi@123', 'ADMIN'),
    (2, 'Aarav Sharma', 'aarav.sharma@muj.manipal.edu', '9829012346', 'student@123', 'STUDENT'),
    (3, 'Priya Patel', 'priya.patel@muj.manipal.edu', '9829023456', 'student@123', 'STUDENT'),
    (4, 'Sunil Yadav', 'sunil.security@jaipur.manipal.edu', '9829056789', 'staff@123', 'STAFF'),
]

SEED_CATEGORIES = [
    (1, 'Electronics & Gadgets'),
    (2, 'College ID & Documents'),
    (3, 'Wallets & Bags'),
    (4, 'Keys & Access Cards'),
    (5, 'Books & Stationery'),
    (6, 'Personal Belongings & Attire'),
]

def init_sqlite_db(force_reset=False):
    """Initializes SQLite database with schema and master lookup data."""
    if force_reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.executescript(SCHEMA_SQL)

    cur.executemany("INSERT OR IGNORE INTO users VALUES (?,?,?,?,?,?)", SEED_USERS)
    cur.executemany("INSERT OR IGNORE INTO categories VALUES (?,?)", SEED_CATEGORIES)
    conn.commit()
    conn.close()
    return True

if __name__ == '__main__':
    init_sqlite_db(force_reset=True)
    print("campus_demo.db initialized with clean schema (zero sample items/claims)!")
