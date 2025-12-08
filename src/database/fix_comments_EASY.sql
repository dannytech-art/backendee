-- EASIEST VERSION - Run these ONE AT A TIME in Supabase SQL Editor
-- If you get an error, just continue to the next step

-- 1. Make election_id nullable (THIS IS THE MOST IMPORTANT ONE)
ALTER TABLE comments ALTER COLUMN election_id DROP NOT NULL;

-- 2. Add news_id column (may error if exists - that's fine, skip to next)
ALTER TABLE comments ADD COLUMN news_id VARCHAR(50);

-- 3. Add foreign key (drop first if exists)
ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_news;
ALTER TABLE comments ADD CONSTRAINT fk_comments_news FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE;

-- 4. Add index
CREATE INDEX IF NOT EXISTS idx_news_comments ON comments(news_id);

-- 5. Add check constraint (drop first if exists)
ALTER TABLE comments DROP CONSTRAINT IF EXISTS check_election_or_news;
ALTER TABLE comments ADD CONSTRAINT check_election_or_news CHECK (election_id IS NOT NULL OR news_id IS NOT NULL);

