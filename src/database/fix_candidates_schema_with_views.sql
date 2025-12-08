-- Fix candidates table to allow longer values
-- This script handles views that depend on the candidates table
-- Run this ENTIRE block in Supabase SQL Editor

-- Step 1: Drop dependent views temporarily
DROP VIEW IF EXISTS vote_statistics CASCADE;
DROP VIEW IF EXISTS comment_statistics CASCADE;
DROP VIEW IF EXISTS chat_activity CASCADE;

-- Step 2: Increase field lengths in candidates table
ALTER TABLE candidates 
ALTER COLUMN image TYPE VARCHAR(1000);

ALTER TABLE candidates 
ALTER COLUMN name TYPE VARCHAR(500);

ALTER TABLE candidates 
ALTER COLUMN party TYPE VARCHAR(500);

-- Step 3: Ensure bio is TEXT (unlimited length)
-- If bio is already TEXT, this will do nothing
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'bio' 
        AND data_type != 'text'
    ) THEN
        ALTER TABLE candidates ALTER COLUMN bio TYPE TEXT;
    END IF;
END $$;

-- Step 4: Recreate the views
CREATE OR REPLACE VIEW vote_statistics AS
SELECT 
    e.id AS election_id,
    e.description AS election_name,
    c.id AS candidate_id,
    c.name AS candidate_name,
    c.party,
    c.color,
    COUNT(v.id) AS vote_count,
    ROUND(COUNT(v.id) * 100.0 / NULLIF(SUM(COUNT(v.id)) OVER (PARTITION BY e.id), 0), 2) AS percentage
FROM elections e
JOIN candidates c ON e.id = c.election_id
LEFT JOIN votes v ON c.id = v.candidate_id
GROUP BY e.id, c.id, c.name, c.party, c.color, e.description
ORDER BY e.id, vote_count DESC;

CREATE OR REPLACE VIEW comment_statistics AS
SELECT 
    e.id AS election_id,
    e.description AS election_name,
    COUNT(DISTINCT cm.id) AS total_comments,
    COUNT(DISTINCT cm.user_id) AS unique_commenters,
    COALESCE(SUM(cm.likes), 0) AS total_likes,
    COUNT(CASE WHEN cm.flagged = TRUE THEN 1 END) AS flagged_count
FROM elections e
LEFT JOIN comments cm ON e.id = cm.election_id
GROUP BY e.id, e.description;

CREATE OR REPLACE VIEW chat_activity AS
SELECT 
    cr.id AS room_id,
    cr.name AS room_name,
    cr.type AS room_type,
    COUNT(cm.id) AS message_count,
    COUNT(DISTINCT cm.user_id) AS unique_participants,
    MAX(cm.timestamp) AS last_activity
FROM chat_rooms cr
LEFT JOIN chat_messages cm ON cr.id = cm.room_id AND cm.deleted = FALSE
GROUP BY cr.id, cr.name, cr.type;

