-- Fix comments table to allow NULL election_id for news comments
-- This migration makes election_id nullable and adds news_id column

-- First, drop the NOT NULL constraint on election_id
ALTER TABLE comments 
ALTER COLUMN election_id DROP NOT NULL;

-- Add news_id column if it doesn't exist
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS news_id VARCHAR(50);

-- Drop constraint if it exists, then add foreign key constraint for news_id
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

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_news_comments ON comments(news_id);

-- Drop check constraint if it exists, then add new one
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_election_or_news'
    ) THEN
        ALTER TABLE comments DROP CONSTRAINT check_election_or_news;
    END IF;
END $$;

-- Add check constraint to ensure at least one of election_id or news_id is set
ALTER TABLE comments
ADD CONSTRAINT check_election_or_news 
CHECK (election_id IS NOT NULL OR news_id IS NOT NULL);

