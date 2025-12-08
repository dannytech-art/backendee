# Supabase Setup Guide

This project uses Supabase as the database backend. Follow these steps to set up your Supabase database.

## 📋 Prerequisites

- Supabase account (sign up at https://supabase.com)
- Project ID: `pwcmyidxdyetvyiuosnm`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3Y215aWR4ZHlldHZ5aXVvc25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjkxOTMsImV4cCI6MjA4MDYwNTE5M30.-_DpZ1DVKjakar7wqFrE4LqcIXleU5jNY0RJdXthuW4`

## 🗄️ Database Setup

### Step 1: Run SQL Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `/src/database.supabase.sql` from the project root
4. Paste and execute the SQL script in Supabase SQL Editor

**Important:** Use `database.supabase.sql` (not `database.sql`) - it's the PostgreSQL/Supabase compatible version.

This will create all necessary tables, indexes, ENUM types, and initial data.

### Step 1.5: Setup Demo Users with Proper PIN Hashes

After running the main schema, you need to set up users with properly hashed PINs:

**Option A: Use the setup script (Recommended)**
```bash
cd backend
pnpm setup:users
```

**Option B: Run SQL manually**
1. Go to Supabase SQL Editor
2. Run the SQL from `backend/src/database/setupUsers.sql`

This will create users you can actually log in with:
- Admin: `admin@election.com` / PIN: `1234`
- User: `user@example.com` / PIN: `5678`

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Supabase
SUPABASE_URL=https://pwcmyidxdyetvyiuosnm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3Y215aWR4ZHlldHZ5aXVvc25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjkxOTMsImV4cCI6MjA4MDYwNTE5M30.-_DpZ1DVKjakar7wqFrE4LqcIXleU5jNY0RJdXthuW4
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Note:** Get your Service Role Key from Supabase Dashboard → Settings → API

### Step 3: Verify Tables

After running the SQL script, verify these tables exist in your Supabase database:

- ✅ `users`
- ✅ `countries`
- ✅ `elections`
- ✅ `candidates`
- ✅ `votes`
- ✅ `news`
- ✅ `news_tags`
- ✅ `news_hashtags`
- ✅ `comments`
- ✅ `comment_likes`
- ✅ `comment_reactions`
- ✅ `chat_rooms`
- ✅ `chat_messages`
- ✅ `chat_moderators`
- ✅ `saved_countries`
- ✅ `platform_settings`

## 🔐 Row Level Security (RLS)

For production, you should set up Row Level Security policies in Supabase. However, for development, the backend API handles authentication and authorization.

### Recommended RLS Policies

You can set up RLS policies in Supabase Dashboard → Authentication → Policies:

1. **Users Table**: Allow read for authenticated users, write for admins
2. **Votes Table**: Users can only read their own votes
3. **Comments Table**: Users can read all, write their own, update/delete their own
4. **Chat Messages**: Users can read all in a room, write their own

## 🧪 Testing Connection

Test your Supabase connection:

```bash
cd backend
pnpm install
pnpm dev
```

The server should start and connect to Supabase. Check the console for any connection errors.

## 📊 Supabase Dashboard

Access your Supabase dashboard:
- URL: `https://supabase.com/dashboard/project/pwcmyidxdyetvyiuosnm`
- Use the dashboard to:
  - View and edit data
  - Monitor API usage
  - Check logs
  - Manage authentication
  - Set up RLS policies

## 🔄 Database Migrations

Since we're using Supabase directly (not migrations), to update the schema:

1. Make changes in Supabase SQL Editor
2. Or update the `database.sql` file and re-run it
3. Test the changes in your backend API

## 🚨 Important Notes

1. **Service Role Key**: Keep this secret! Never commit it to version control
2. **Anon Key**: Safe to use in frontend, but backend uses it for server-side operations
3. **RLS**: For production, enable Row Level Security for better data protection
4. **Backups**: Supabase automatically backs up your database

## 🆘 Troubleshooting

### Connection Errors
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Check Supabase project is active
- Verify network connectivity

### Table Not Found
- Run the SQL schema script again
- Check table names match exactly (case-sensitive)

### Permission Errors
- Check RLS policies if enabled
- Verify Service Role Key for admin operations
- Check user authentication tokens

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

