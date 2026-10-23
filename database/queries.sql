-- =====================================================================
-- MANIPAL UNIVERSITY JAIPUR - DEPARTMENT OF COMPUTER SCIENCE & ENGG
-- RDBMS LAB (CSC2131) - LABORATORY QUERY DEMONSTRATION SUITE
-- Topic: Campus Lost and Found Management System
-- Mapped to Course Outcomes (CO1 to CO5) & Lab Syllabus
-- =====================================================================

USE campus_lost_and_found;

-- =====================================================================
-- SECTION 1: BASIC DML, SELECTION, AND FILTERING (Labs 6 & 7)
-- =====================================================================

-- 1.1 Simple Selection with Multiple Conditions (SELECT, WHERE, AND, OR, ORDER BY)
-- Find all ACTIVE items lost or found, ordered newest first:
SELECT 
    item_id, 
    report_type, 
    title, 
    location,
    date_incident, 
    status
FROM items
WHERE status = 'ACTIVE' 
ORDER BY date_incident DESC;

-- 1.2 Pattern Matching using LIKE
-- Search for any item mentioning 'laptop', 'Dell', or 'charger':
SELECT 
    item_id, 
    title, 
    description, 
    location,
    report_type, 
    status
FROM items
WHERE title LIKE '%Dell%' 
   OR description LIKE '%laptop%'
   OR description LIKE '%phone%';

-- 1.3 Finding the newly inserted item from frontend:
SELECT * FROM items ORDER BY item_id DESC LIMIT 1;


-- =====================================================================
-- SECTION 2: AGGREGATE FUNCTIONS, GROUP BY & HAVING (Lab 7)
-- =====================================================================

-- 2.1 Aggregations: Total, Minimum, Maximum, and Category Counts
SELECT 
    COUNT(*) AS total_items,
    COUNT(DISTINCT category_id) AS distinct_categories,
    COUNT(DISTINCT reported_by) AS distinct_reporters,
    MIN(date_incident) AS earliest_incident,
    MAX(date_incident) AS latest_incident
FROM items;

-- 2.2 GROUP BY with Aggregate Counts
-- Count how many lost vs found items were reported per category:
SELECT 
    c.category_name,
    COUNT(i.item_id) AS total_items,
    SUM(CASE WHEN i.report_type = 'LOST' THEN 1 ELSE 0 END) AS count_lost,
    SUM(CASE WHEN i.report_type = 'FOUND' THEN 1 ELSE 0 END) AS count_found
FROM categories c
LEFT JOIN items i ON c.category_id = i.category_id
GROUP BY c.category_id, c.category_name
ORDER BY total_items DESC;

-- 2.3 GROUP BY with HAVING Clause
-- Identify locations with MORE THAN 1 lost or found incident:
SELECT 
    location,
    COUNT(item_id) AS incident_count
FROM items
GROUP BY location
HAVING COUNT(item_id) >= 1
ORDER BY incident_count DESC;


-- =====================================================================
-- SECTION 3: MULTI-TABLE JOINS (Lab 8)
-- =====================================================================

-- 3.1 3-Table INNER JOIN: Item details with Category and Reporter Info
SELECT 
    i.item_id,
    i.report_type,
    i.title,
    c.category_name,
    i.location,
    i.date_incident,
    u.full_name AS reported_by,
    u.phone AS contact_phone,
    i.status
FROM items i
JOIN categories c ON i.category_id = c.category_id
JOIN users u ON i.reported_by = u.user_id
ORDER BY i.item_id DESC;

-- 3.2 LEFT OUTER JOIN: All categories, even if no items currently logged
SELECT 
    c.category_id,
    c.category_name,
    COUNT(i.item_id) AS items_in_category
FROM categories c
LEFT JOIN items i ON c.category_id = i.category_id
GROUP BY c.category_id, c.category_name;

-- 3.3 JOIN: Pending Claims with Target Item Details
SELECT 
    cl.claim_id,
    cl.item_id,
    i.title AS item_title,
    i.location,
    cl.claimant_name,
    cl.claimant_contact,
    cl.proof_details,
    cl.status AS claim_status
FROM claims cl
JOIN items i ON cl.item_id = i.item_id
WHERE cl.status = 'PENDING';


-- =====================================================================
-- SECTION 4: SUBQUERIES (SINGLE-ROW, MULTI-ROW) (Lab 9)
-- =====================================================================

-- 4.1 Single-Row Subquery
-- Find the item with the highest ID (most recently inserted):
SELECT item_id, title, report_type, location, date_incident, status
FROM items
WHERE item_id = (SELECT MAX(item_id) FROM items);

-- 4.2 Multi-Row Subquery using IN
-- Find users who have reported at least one LOST item:
SELECT user_id, full_name, email, phone, role
FROM users
WHERE user_id IN (
    SELECT DISTINCT reported_by 
    FROM items 
    WHERE report_type = 'LOST'
);

-- 4.3 Multi-Row Subquery using NOT IN
-- Find items that have NEVER had an ownership claim filed against them:
SELECT item_id, title, location, report_type, status
FROM items
WHERE item_id NOT IN (
    SELECT DISTINCT item_id FROM claims
);


-- =====================================================================
-- SECTION 5: SET OPERATIONS (UNION) (Lab 8)
-- =====================================================================

-- 5.1 UNION: Consolidated Campus Incident Log
SELECT 
    date_incident AS event_date,
    title AS event_title,
    location,
    CONCAT('LOST (Reported by User #', reported_by, ')') AS event_type
FROM items 
WHERE report_type = 'LOST'

UNION

SELECT 
    date_incident AS event_date,
    title AS event_title,
    location,
    'FOUND BELONGING' AS event_type
FROM items 
WHERE report_type = 'FOUND'
ORDER BY event_date DESC;


-- =====================================================================
-- SECTION 6: VIEWS (Lab 10 / CO CSC2131.3)
-- =====================================================================

-- 6.1 Querying the Active Items Database View (Created in schema.sql)
SELECT * FROM vw_active_items;

-- 6.2 Filter through View
SELECT item_id, title, location, category_name, reported_by_name
FROM vw_active_items
WHERE report_type = 'LOST';


-- =====================================================================
-- SECTION 7: USER PRIVILEGES AND ACCESS CONTROL (DCL) (Lab 11)
-- =====================================================================

-- 7.1 Create restricted application user role
CREATE USER IF NOT EXISTS 'campus_app'@'localhost' IDENTIFIED BY 'AppPass123';

-- 7.2 Grant least-privilege permissions to standard application user
GRANT SELECT, INSERT, UPDATE ON campus_lost_and_found.items TO 'campus_app'@'localhost';
GRANT SELECT, INSERT ON campus_lost_and_found.claims TO 'campus_app'@'localhost';
GRANT SELECT ON campus_lost_and_found.categories TO 'campus_app'@'localhost';
GRANT SELECT ON campus_lost_and_found.vw_active_items TO 'campus_app'@'localhost';

-- 7.3 Revoke dangerous DROP privileges from application user
REVOKE DROP, ALTER ON campus_lost_and_found.* FROM 'campus_app'@'localhost';
FLUSH PRIVILEGES;


-- =====================================================================
-- SECTION 8: TRANSACTION CONTROL & PROCEDURES EXECUTION (Lab 12)
-- =====================================================================

-- 8.1 Testing Transaction Control with SAVEPOINT, ROLLBACK & COMMIT
START TRANSACTION;
    -- Step 1: Set savepoint
    SAVEPOINT sp_before_test;

    -- Step 2: Insert temporary draft item
    INSERT INTO items (
        report_type, title, description, category_id, location, 
        date_incident, status, reported_by
    ) VALUES (
        'LOST', 'Temporary Test Notepad', 'Draft entry for rollback demonstration', 5, 'Library', 
        CURRENT_DATE, 'ACTIVE', 2
    );

    -- Step 3: Rollback to savepoint to discard draft without affecting session
    ROLLBACK TO SAVEPOINT sp_before_test;

    -- Step 4: Finalize transaction
COMMIT;

-- 8.2 Executing Stored Procedure: Approve Claim with TCL Transaction Control
-- Demonstrates Procedure + TCL (CALL sp_approve_claim)
CALL sp_approve_claim(1);

-- 8.3 Verifying Trigger Execution (trg_resolve_item_on_claim)
-- The trigger automatically sets items.status = 'RESOLVED' and logs to activity_logs
SELECT item_id, title, status FROM items WHERE item_id = 2;

-- Check activity logs written automatically by trigger
SELECT * FROM activity_logs ORDER BY log_id DESC;
