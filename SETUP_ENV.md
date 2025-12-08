# Environment Setup - Quick Fix

## ⚠️ JWT_SECRET Error Fix

If you're getting "secretOrPrivateKey must have a value", you need to create a `.env` file.

### Quick Fix

1. **Create `.env` file in `backend/` directory:**

```bash
cd backend
touch .env
```

2. **Add this content to `.env`:**

```env
# Supabase
SUPABASE_URL=https://pwcmyidxdyetvyiuosnm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3Y215aWR4ZHlldHZ5aXVvc25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjkxOTMsImV4cCI6MjA4MDYwNTE5M30.-_DpZ1DVKjakar7wqFrE4LqcIXleU5jNY0RJdXthuW4
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server
PORT=3000
NODE_ENV=development

# JWT - IMPORTANT: Change this in production!
JWT_SECRET=election-engagement-platform-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

3. **Restart backend server:**

```bash
# Stop current server (Ctrl+C)
# Then restart:
pnpm dev
```

### Alternative: One-Line Setup

```bash
cd backend && cat > .env << 'EOF'
SUPABASE_URL=https://pwcmyidxdyetvyiuosnm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3Y215aWR4ZHlldHZ5aXVvc25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjkxOTMsImV4cCI6MjA4MDYwNTE5M30.-_DpZ1DVKjakar7wqFrE4LqcIXleU5jNY0RJdXthuW4
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=3000
NODE_ENV=development
JWT_SECRET=election-engagement-platform-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
EOF
```

### Note

The code now has a fallback default JWT_SECRET for development, but it's better to set it explicitly in `.env`.

After creating `.env`, restart your backend server and try logging in again!

