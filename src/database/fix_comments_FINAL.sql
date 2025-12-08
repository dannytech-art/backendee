-- Fix comments table - FINAL VERSION
-- Run this ENTIRE block in Supabase SQL Editor
-- This handles the case where news_id column already exists

-- Step 1: Make election_id nullable (MOST IMPORTANT - run this first!)
ALTER TABLE comments ALTER COLUMN election_id DROP NOT NULL;

-- Step 2: Add news_id column only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'news_id'
    ) THEN
        ALTER TABLE comments ADD COLUMN news_id VARCHAR(50);
    END IF;
END $$;

-- Step 3: Drop foreign key constraint if exists, then add it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_comments_news'
    ) THEN
        ALTER TABLE comments DROP CONSTRAINT fk_comments_news;
    END IF;
END $$;

ALTER TABLE comments 
ADD CONSTRAINT fk_comments_news 
FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE;

-- Step 4: Create index (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_news_comments ON comments(news_id);

-- Step 5: Drop check constraint if exists, then add it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_election_or_news'
    ) THEN
        ALTER TABLE comments DROP CONSTRAINT check_election_or_news;
    END IF;
END $$;

ALTER TABLE comments 
ADD CONSTRAINT check_election_or_news 
CHECK (election_id IS NOT NULL OR news_id IS NOT NULL);

