# Amber - Business Health Monitor

A calm, minimal business health monitor for founder-led service businesses.

## Project Structure

```
Apps/
  server/        → Node.js + Express backend API
  web/           → React frontend

Packages/
  types/         → Shared TypeScript types
  core/          → Business logic (future)
  utils/         → Utilities (future)
```

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd Apps/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Update `DATABASE_URL` with your PostgreSQL connection string.

4. Generate Prisma client and run migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3001`

### Frontend Setup

1. Navigate to the web directory:
   ```bash
   cd Apps/web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

## Authentication Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Log in
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Log out
- `GET /auth/me` - Get current user (protected)

## Phase 1: Authentication Complete ✓

The following features are implemented:
- User registration
- User login
- Session persistence
- Refresh token mechanism
- Logout
- Protected routes
- No sensitive data leaks

## Next Phase

After Phase 1 is complete, await explicit instruction before starting Phase 2.
