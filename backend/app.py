"""
Campus Lost & Found System — Flask REST API
RDBMS Lab Project (CSC2131), Manipal University Jaipur
"""

import os
import time
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import mysql.connector
import sqlite3
from init_db import init_sqlite_db, DB_PATH

app = Flask(__name__, static_folder='../frontend', static_url_path='')

# ── File Upload Config ──────────────────────────────────────────────
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/uploads'))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ── DB Config (override via environment variables or edit here) ───
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'aditya'),
    'database': os.getenv('DB_NAME', 'campus_lost_and_found')
}

# ── CORS Support (allows frontend to connect from file:// or localhost) ──
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

@app.route('/api/<path:dummy>', methods=['OPTIONS'])
def options_handler(dummy):
    return ('', 204)

def get_db():
    """MySQL primary; SQLite fallback for offline demo."""
    try:
        return mysql.connector.connect(**DB_CONFIG), 'MYSQL'
    except Exception:
        if not os.path.exists(DB_PATH):
            init_sqlite_db()
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn, 'SQLITE'

def ph(mode):   return '?' if mode == 'SQLITE' else '%s'
def rows(cur, mode): return [dict(r) for r in cur.fetchall()] if mode == 'SQLITE' else cur.fetchall()

# ── Routes ──────────────────────────────────────────────────────

@app.route('/')
def home():
    return app.send_static_file('index.html')


@app.route('/api/login', methods=['POST'])
def login():
    d = request.json or {}
    email = (d.get('email') or '').strip().lower()
    password = (d.get('password') or '').strip()

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password required.'}), 400

    conn, mode = get_db()
    cur = conn.cursor(dictionary=True) if mode == 'MYSQL' else conn.cursor()
    p = ph(mode)

    # Tolerant match for email domain typo (e.g. maipal vs manipal)
    alt_email = email.replace('manipal', 'maipal') if 'manipal' in email else email.replace('maipal', 'manipal')

    cur.execute(
        f"SELECT user_id, full_name, email, phone, role, password FROM users "
        f"WHERE (LOWER(email) = {p} OR LOWER(email) = {p})",
        (email, alt_email)
    )

    if mode == 'SQLITE':
        row = cur.fetchone()
        user_row = dict(row) if row else None
    else:
        user_row = cur.fetchone()

    conn.close()

    if not user_row:
        return jsonify({'success': False, 'message': 'Account not found. Verify email.'}), 401

    if user_row['password'] != password:
        return jsonify({'success': False, 'message': 'Incorrect password.'}), 401

    return jsonify({
        'success': True,
        'user': {
            'user_id': user_row['user_id'],
            'full_name': user_row['full_name'],
            'email': user_row['email'],
            'phone': user_row['phone'],
            'role': user_row['role']
        }
    })


@app.route('/api/register', methods=['POST'])
def register():
    d = request.json or {}
    full_name = (d.get('full_name') or '').strip()
    email = (d.get('email') or '').strip().lower()
    phone = (d.get('phone') or '').strip()
    password = (d.get('password') or '').strip()
    role = (d.get('role') or 'STUDENT').strip().upper()

    if not full_name or not email or not password:
        return jsonify({'success': False, 'message': 'Full name, email, and password are required.'}), 400

    if role not in ('STUDENT', 'FACULTY', 'STAFF', 'ADMIN'):
        role = 'STUDENT'

    conn, mode = get_db()
    cur = conn.cursor(dictionary=True) if mode == 'MYSQL' else conn.cursor()
    p = ph(mode)

    # Check if email is already registered
    cur.execute(f"SELECT user_id FROM users WHERE LOWER(email) = {p}", (email,))
    existing = cur.fetchone()
    if existing:
        conn.close()
        return jsonify({'success': False, 'message': 'Email is already registered. Please sign in.'}), 409

    # Insert new user
    cur.execute(
        f"INSERT INTO users (full_name, email, phone, password, role) VALUES ({p}, {p}, {p}, {p}, {p})",
        (full_name, email, phone or '9829000000', password, role)
    )
    conn.commit()
    new_user_id = cur.lastrowid

    try:
        cur.execute(
            f"INSERT INTO activity_logs (action_type, details) VALUES ({p}, {p})",
            ('USER_REGISTERED', f"New {role} registered: {full_name} ({email})")
        )
        conn.commit()
    except Exception:
        pass

    conn.close()

    return jsonify({
        'success': True,
        'message': f'Account created successfully! Welcome, {full_name}.',
        'user': {
            'user_id': new_user_id,
            'full_name': full_name,
            'email': email,
            'phone': phone or '9829000000',
            'role': role
        }
    }), 201


@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part in request.'}), 400
    file = request.files['image']
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected.'}), 400
    if allowed_file(file.filename):
        safe_name = secure_filename(file.filename)
        filename = f"upload_{int(time.time())}_{safe_name}"
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(save_path)
        return jsonify({'image_url': f'uploads/{filename}'})
    return jsonify({'error': 'Invalid file format. Allowed: png, jpg, jpeg, webp, gif.'}), 400


@app.route('/api/categories')
def get_categories():
    conn, mode = get_db()
    cur = conn.cursor(dictionary=True) if mode == 'MYSQL' else conn.cursor()
    cur.execute("SELECT category_id, category_name FROM categories ORDER BY category_id")
    data = rows(cur, mode)
    conn.close()
    return jsonify(data)


@app.route('/api/items')
def get_items():
    conn, mode = get_db()
    cur = conn.cursor(dictionary=True) if mode == 'MYSQL' else conn.cursor()
    sql = """SELECT i.item_id, i.report_type, i.title, i.description,
               c.category_name, i.location, i.date_incident, i.image_url, i.status,
               u.full_name AS reported_by_name, u.phone AS contact_phone
        FROM items i
        JOIN categories c ON i.category_id = c.category_id
        JOIN users u ON i.reported_by = u.user_id"""
    report_type = request.args.get('type')
    if report_type:
        cur.execute(sql + f" WHERE i.report_type = {ph(mode)} ORDER BY i.item_id DESC", (report_type,))
    else:
        cur.execute(sql + " ORDER BY i.item_id DESC")
    data = rows(cur, mode)
    conn.close()
    return jsonify(data)


@app.route('/api/items', methods=['POST'])
def add_item():
    d = request.json or {}
    conn, mode = get_db()
    cur = conn.cursor()
    p = ph(mode)
    cur.execute(
        f"INSERT INTO items (report_type,title,description,category_id,location,date_incident,image_url,reported_by)"
        f" VALUES ({p},{p},{p},{p},{p},{p},{p},{p})",
        (d['report_type'], d['title'], d['description'],
         d['category_id'], d['location'], d['date_incident'],
         d.get('image_url', 'images/laptop.jpg'), d.get('reported_by', 1))
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return jsonify({"message": f"{d['report_type']} item reported!", "item_id": new_id})


@app.route('/api/claims', methods=['POST'])
def submit_claim():
    d = request.json or {}
    conn, mode = get_db()
    cur = conn.cursor()
    p = ph(mode)
    cur.execute(
        f"INSERT INTO claims (item_id,claimant_name,claimant_contact,proof_details) VALUES ({p},{p},{p},{p})",
        (d['item_id'], d['claimant_name'], d['claimant_contact'], d['proof_details'])
    )
    cur.execute(f"UPDATE items SET status='CLAIM_PENDING' WHERE item_id={p}", (d['item_id'],))
    conn.commit()
    new_claim_id = cur.lastrowid
    conn.close()
    return jsonify({"message": "Claim submitted — awaiting Admin verification.", "claim_id": new_claim_id})


@app.route('/api/claims')
def get_claims():
    conn, mode = get_db()
    cur = conn.cursor(dictionary=True) if mode == 'MYSQL' else conn.cursor()
    cur.execute("""SELECT c.claim_id, c.item_id, i.title AS item_title, i.location,
               c.claimant_name, c.claimant_contact, c.proof_details, c.status
        FROM claims c JOIN items i ON c.item_id = i.item_id
        WHERE c.status = 'PENDING' ORDER BY c.claim_id DESC""")
    data = rows(cur, mode)
    conn.close()
    return jsonify(data)


@app.route('/api/items/<int:item_id>/claims')
def get_item_claims(item_id):
    conn, mode = get_db()
    cur = conn.cursor(dictionary=True) if mode == 'MYSQL' else conn.cursor()
    p = ph(mode)
    cur.execute(f"SELECT * FROM claims WHERE item_id = {p} ORDER BY claim_id DESC", (item_id,))
    data = rows(cur, mode)
    conn.close()
    return jsonify(data)


@app.route('/api/items/<int:item_id>/notify-found', methods=['POST'])
def notify_found_item(item_id):
    d = request.json or {}
    finder_name = (d.get('finder_name') or 'Campus Member').strip()
    finder_contact = (d.get('finder_contact') or '').strip()
    message = (d.get('message') or '').strip()

    if not finder_contact or not message:
        return jsonify({'success': False, 'message': 'Contact and message details are required.'}), 400

    conn, mode = get_db()
    cur = conn.cursor()
    p = ph(mode)

    proof_text = f"DIRECT HANDOVER NOTICE: {message}"
    cur.execute(
        f"INSERT INTO claims (item_id, claimant_name, claimant_contact, proof_details, status) VALUES ({p}, {p}, {p}, {p}, 'PENDING')",
        (item_id, finder_name, finder_contact, proof_text)
    )
    new_claim_id = cur.lastrowid

    cur.execute(f"UPDATE items SET status='CLAIM_PENDING' WHERE item_id={p}", (item_id,))

    try:
        cur.execute(
            f"INSERT INTO activity_logs (action_type, details) VALUES ({p}, {p})",
            ('FINDER_NOTIFIED', f"Finder {finder_name} ({finder_contact}) notified owner of Item #{item_id}: {message[:100]}")
        )
    except Exception:
        pass

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': 'Owner has been notified! Item status set to CLAIM_PENDING.',
        'claim_id': new_claim_id
    })


# Approving in MySQL fires trigger: trg_resolve_item_on_claim
@app.route('/api/claims/approve/<int:claim_id>', methods=['POST'])
def approve_claim(claim_id):
    conn, mode = get_db()
    cur = conn.cursor()
    p = ph(mode)
    cur.execute(f"UPDATE claims SET status='APPROVED' WHERE claim_id={p}", (claim_id,))
    if mode == 'SQLITE':  # simulate trigger for demo mode
        cur.execute("UPDATE items SET status='RESOLVED' WHERE item_id=(SELECT item_id FROM claims WHERE claim_id=?)", (claim_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Claim APPROVED — trigger marked item as RESOLVED."})


@app.route('/api/stats')
def get_stats():
    conn, mode = get_db()
    cur = conn.cursor(dictionary=True) if mode == 'MYSQL' else conn.cursor()
    cur.execute("""SELECT COUNT(*) AS total_items,
        COALESCE(SUM(report_type='LOST'), 0) AS total_lost,
        COALESCE(SUM(report_type='FOUND'), 0) AS total_found,
        COALESCE(SUM(status='RESOLVED'), 0) AS total_resolved FROM items""")
    stat = dict(cur.fetchone()) if mode == 'SQLITE' else cur.fetchone()
    stat['db_mode'] = mode
    conn.close()
    return jsonify(stat)


if __name__ == '__main__':
    # Ensure SQLite demo database is ready on startup
    init_sqlite_db()
    print("Campus Lost & Found REST API Running")
    print("Web Dashboard -> http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
