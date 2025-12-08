-- Fix comments table to allow NULL election_id for news comments
-- Copy and paste this ENTIRE block into Supabase SQL Editor and run it

-- Step 1: Make election_id nullable
ALTER TABLE comments ALTER COLUMN election_id DROP NOT NULL;

-- Step 2: Add news_id column (will error if exists - that's OK, just continue)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'news_id'
    ) THEN
        ALTER TABLE comments ADD COLUMN news_id VARCHAR(50);
    END IF;
END $$;

-- Step 3: Drop and recreate foreign key constraint
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

-- Step 4: Create index
CREATE INDEX IF NOT EXISTS idx_news_comments ON comments(news_id);

-- Step 5: Drop and recreate check constraint
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

