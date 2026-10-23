-- =====================================================================
-- CAMPUS LOST AND FOUND SYSTEM - RDBMS LAB PROJECT (CSC2131)
-- Simple, Clean & Academic Evaluation Schema (MySQL 8.0)
-- =====================================================================

DROP DATABASE IF EXISTS campus_lost_and_found;
CREATE DATABASE campus_lost_and_found;
USE campus_lost_and_found;

-- 1. USERS TABLE
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role ENUM('STUDENT', 'FACULTY', 'STAFF', 'ADMIN') DEFAULT 'STUDENT'
);

-- 2. CATEGORIES TABLE
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

-- 3. ITEMS TABLE (Central Entity for Lost and Found items)
CREATE TABLE items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    report_type ENUM('LOST', 'FOUND') NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category_id INT NOT NULL,
    location VARCHAR(100) NOT NULL,
    date_incident DATE NOT NULL,
    image_url VARCHAR(255) DEFAULT 'images/laptop.jpg',
    status ENUM('ACTIVE', 'CLAIM_PENDING', 'RESOLVED') DEFAULT 'ACTIVE',
    reported_by INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (reported_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 4. CLAIMS TABLE (Ownership verification requests for FOUND items)
CREATE TABLE claims (
    claim_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    claimant_name VARCHAR(100) NOT NULL,
    claimant_contact VARCHAR(50) NOT NULL,
    proof_details TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
);

-- 5. AUDIT LOG TABLE (Trigger logs actions here automatically)
CREATE TABLE activity_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    details VARCHAR(255) NOT NULL,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 6. DATABASE VIEW (Syllabus: Lab 10 / CO CSC2131.3)
-- Joins Items with Categories and Users for fast dashboard display
-- =====================================================================
CREATE VIEW vw_active_items AS
SELECT 
    i.item_id,
    i.report_type,
    i.title,
    i.description,
    c.category_name,
    i.location,
    i.date_incident,
    i.image_url,
    i.status,
    u.full_name AS reported_by_name,
    u.phone AS contact_phone
FROM items i
JOIN categories c ON i.category_id = c.category_id
JOIN users u ON i.reported_by = u.user_id
WHERE i.status != 'RESOLVED';

-- =====================================================================
-- 7. DATABASE TRIGGER (Syllabus: Lab 12 / CO CSC2131.5)
-- When a claim is marked APPROVED, automatically mark item as RESOLVED
-- and insert an audit record into activity_logs
-- =====================================================================
DELIMITER $$
CREATE TRIGGER trg_resolve_item_on_claim
AFTER UPDATE ON claims
FOR EACH ROW
BEGIN
    IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
        -- 1. Automatically update item status to RESOLVED
        UPDATE items 
        SET status = 'RESOLVED' 
        WHERE item_id = NEW.item_id;

        -- 2. Automatically log to audit table
        INSERT INTO activity_logs (action_type, details)
        VALUES ('CLAIM_APPROVED', CONCAT('Claim #', NEW.claim_id, ' approved for Item #', NEW.item_id));
    END IF;
END$$
DELIMITER ;

-- =====================================================================
-- 8. STORED PROCEDURE (Syllabus: Lab 12 / CO CSC2131.5)
-- Demonstrates Transaction Control (START TRANSACTION, COMMIT)
-- =====================================================================
DELIMITER $$
CREATE PROCEDURE sp_approve_claim(IN p_claim_id INT)
BEGIN
    START TRANSACTION;
        UPDATE claims 
        SET status = 'APPROVED' 
        WHERE claim_id = p_claim_id;
    COMMIT;
END$$
DELIMITER ;

-- =====================================================================
-- 9. MASTER LOOKUP DATA (Required for Foreign Keys & Dropdowns)
-- =====================================================================
INSERT INTO users (user_id, full_name, email, phone, password, role) VALUES
(1, 'Aditya', 'aditya.2502052853@muj.maipal.edu', '9829012345', 'adi@123', 'ADMIN'),
(2, 'Aarav Sharma', 'aarav.sharma@muj.manipal.edu', '9829012346', 'student@123', 'STUDENT'),
(3, 'Priya Patel', 'priya.patel@muj.manipal.edu', '9829023456', 'student@123', 'STUDENT'),
(4, 'Sunil Yadav', 'sunil.security@jaipur.manipal.edu', '9829056789', 'staff@123', 'STAFF');

INSERT INTO categories (category_id, category_name) VALUES
(1, 'Electronics & Gadgets'),
(2, 'College ID & Documents'),
(3, 'Wallets & Bags'),
(4, 'Keys & Access Cards'),
(5, 'Books & Stationery'),
(6, 'Personal Belongings & Attire');

