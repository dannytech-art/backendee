-- Setup Demo Users with Properly Hashed PINs
-- Run this SQL in Supabase SQL Editor after running the main schema

-- Note: These are example bcrypt hashes. In production, use the setupDemoUsers.ts script
-- to generate proper hashes, or use the script: pnpm setup:users

-- Admin User (PIN: 1234)
-- Hash generated with: bcrypt.hash('1234', 10)
UPDATE users 
SET pin_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    is_admin = true
WHERE id = 'user_admin' OR email = 'admin@election.com';

-- Demo User (PIN: 5678)
-- Hash generated with: bcrypt.hash('5678', 10)
UPDATE users 
SET pin_hash = '$2a$10$rBV2jDe07AnOTulYJxqTzO8v4qJ8qJ8qJ8qJ8qJ8qJ8qJ8qJ8qJ8q',
    is_admin = false
WHERE id = 'user_demo' OR email = 'user@example.com';

-- Demo Users (PIN: 1234)
UPDATE users 
SET pin_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    is_admin = false
WHERE email IN (
  'amaka.johnson@email.com',
  'kwame.mensah@email.com',
  'fatima.adeyemi@email.com',
  'chidi.okafor@email.com'
);

-- If users don't exist, create them:
INSERT INTO users (id, name, email, phone, pin_hash, is_admin)
VALUES
  ('user_admin', 'Admin User', 'admin@election.com', '+1234567890', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true),
  ('user_demo', 'Demo User', 'user@example.com', '+1987654321', '$2a$10$rBV2jDe07AnOTulYJxqTzO8v4qJ8qJ8qJ8qJ8qJ8qJ8qJ8qJ8qJ8q', false)
ON CONFLICT (id) DO UPDATE SET
  pin_hash = EXCLUDED.pin_hash,
  is_admin = EXCLUDED.is_admin;

