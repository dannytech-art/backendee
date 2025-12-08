# Election Engagement Platform - Backend API

Complete CRUD API for the Election Engagement Platform built with Express, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account and project
- pnpm (or npm)

### Setup

1. **Install dependencies**
```bash
cd backend
pnpm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. **Setup Supabase database**
```bash
# Go to Supabase Dashboard → SQL Editor
# Run the SQL script from ../src/database.sql
# See SUPABASE_SETUP.md for detailed instructions
```

4. **Start development server**
```bash
pnpm dev
```

The API will be available at `http://localhost:3000`

**Note:** See `SUPABASE_SETUP.md` for complete Supabase setup instructions.

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Countries
- `GET /api/countries` - Get all countries
- `GET /api/countries/:id` - Get country by ID
- `POST /api/countries` - Create country (Admin)
- `PUT /api/countries/:id` - Update country (Admin)
- `DELETE /api/countries/:id` - Delete country (Admin)
- `GET /api/countries/:id/elections` - Get elections for country

### Elections
- `GET /api/elections` - Get all elections
- `GET /api/elections/:id` - Get election by ID
- `POST /api/elections` - Create election (Admin)
- `PUT /api/elections/:id` - Update election (Admin)
- `DELETE /api/elections/:id` - Delete election (Admin)
- `GET /api/elections/:id/stats` - Get vote statistics

### Candidates
- `GET /api/candidates` - Get all candidates (optional ?electionId=)
- `GET /api/candidates/:id` - Get candidate by ID
- `POST /api/candidates` - Create candidate (Admin)
- `PUT /api/candidates/:id` - Update candidate (Admin)
- `DELETE /api/candidates/:id` - Delete candidate (Admin)

### Votes
- `POST /api/votes` - Cast a vote (Authenticated)
- `GET /api/votes/check/:electionId` - Check if user voted
- `GET /api/votes/user` - Get user's votes

### News
- `GET /api/news` - Get all news (optional ?countryId= & ?priority=)
- `GET /api/news/:id` - Get news by ID
- `POST /api/news` - Create news (Admin)
- `PUT /api/news/:id` - Update news (Admin)
- `DELETE /api/news/:id` - Delete news (Admin)

### Comments
- `GET /api/comments/election/:electionId` - Get comments for election
- `POST /api/comments` - Create comment (Authenticated)
- `POST /api/comments/:id/like` - Like/unlike comment
- `POST /api/comments/:id/reaction` - Add reaction
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `GET /api/comments/admin/all` - Get all comments for moderation (Admin)

### Chat
- `GET /api/chat/rooms` - Get all chat rooms
- `GET /api/chat/rooms/:id` - Get room by ID
- `POST /api/chat/rooms` - Create room (Admin)
- `PUT /api/chat/rooms/:id` - Update room (Admin)
- `DELETE /api/chat/rooms/:id` - Delete room (Admin)
- `GET /api/chat/rooms/:roomId/messages` - Get messages
- `POST /api/chat/rooms/:roomId/messages` - Send message
- `PUT /api/chat/messages/:id` - Update message
- `DELETE /api/chat/messages/:id` - Delete message
- `GET /api/chat/messages/flagged` - Get flagged messages (Admin)

### Settings
- `GET /api/settings` - Get all settings
- `GET /api/settings/:key` - Get setting by key
- `PUT /api/settings/:key` - Update setting (Admin)
- `DELETE /api/settings/:key` - Delete setting (Admin)

## 🔐 Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Admin-only endpoints require the user to have `isAdmin: true`.

## 🗄️ Database Schema

The database uses Supabase (PostgreSQL). The schema is defined in `../src/database.sql`. 

**Setup:** See `SUPABASE_SETUP.md` for complete database setup instructions.

## 📝 Environment Variables

```env
# Supabase
SUPABASE_URL=https://pwcmyidxdyetvyiuosnm.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 🛠️ Development

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server

**Database:** Use Supabase Dashboard to manage your database. See `SUPABASE_SETUP.md` for details.

## 📦 Project Structure

```
backend/
├── src/
│   ├── database/
│   │   └── connection.ts      # Supabase connection
│   ├── middleware/
│   │   ├── auth.ts            # Authentication middleware
│   │   └── errorHandler.ts    # Error handling
│   ├── routes/
│   │   ├── auth.ts            # Auth routes
│   │   ├── countries.ts       # Country CRUD
│   │   ├── elections.ts       # Election CRUD
│   │   ├── candidates.ts      # Candidate CRUD
│   │   ├── votes.ts           # Vote operations
│   │   ├── news.ts            # News CRUD
│   │   ├── comments.ts        # Comment CRUD
│   │   ├── chat.ts            # Chat CRUD
│   │   └── settings.ts       # Settings CRUD
│   └── index.ts               # Express app setup
├── package.json
├── tsconfig.json
├── SUPABASE_SETUP.md          # Supabase setup guide
└── README.md
```

**Note:** Database schema is in `../src/database.sql` (run in Supabase SQL Editor)

