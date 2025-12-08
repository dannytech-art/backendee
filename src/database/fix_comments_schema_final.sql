-- Fix comments table to allow NULL election_id for news comments
-- Run this in Supabase SQL Editor

-- Step 1: Drop the NOT NULL constraint on election_id
ALTER TABLE comments 
ALTER COLUMN election_id DROP NOT NULL;

-- Step 2: Add news_id column (ignore error if already exists)
ALTER TABLE comments 
ADD COLUMN news_id VARCHAR(50);

-- Step 3: Drop existing foreign key constraint if it exists (ignore error if doesn't exist)
ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_news;

-- Step 4: Add foreign key constraint for news_id
ALTER TABLE comments
ADD CONSTRAINT fk_comments_news 
FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE;

-- Step 5: Add index for better query performance (ignore error if already exists)
CREATE INDEX IF NOT EXISTS idx_news_comments ON comments(news_id);

-- Step 6: Drop existing check constraint if it exists (ignore error if doesn't exist)
ALTER TABLE comments DROP CONSTRAINT IF EXISTS check_election_or_news;

-- Step 7: Add check constraint to ensure at least one of election_id or news_id is set
ALTER TABLE comments
ADD CONSTRAINT check_election_or_news 
CHECK (election_id IS NOT NULL OR news_id IS NOT NULL);

