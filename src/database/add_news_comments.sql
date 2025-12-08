-- Add news_id column to comments table to support comments on news articles
-- This allows comments to be associated with either elections or news

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS news_id VARCHAR(50);

-- Add foreign key constraint
ALTER TABLE comments
ADD CONSTRAINT fk_comments_news 
FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_news_comments ON comments(news_id);

-- Update existing comments to ensure they have either election_id or news_id
-- (This is just a safety check, existing comments should already have election_id)

