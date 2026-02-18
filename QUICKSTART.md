# Quick Start Guide

Get the app running locally in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running locally (or use Neon free tier)

## 1. Set Up Database

### Option A: PostgreSQL Locally

```bash
# Create a local database
createdb amber_business_health_monitor

# Connection string:
# postgresql://localhost/amber_business_health_monitor
```

### Option B: Neon (Free Cloud)

1. Sign up at https://neon.tech
2. Create project and copy connection string
3. Save it for next step

## 2. Set Up Backend

```bash
cd Apps/server

# Create .env file
cp .env.example .env

# Edit .env and set DATABASE_URL
# DATABASE_URL="postgresql://localhost/amber_business_health_monitor"

# Install and set up
npm install
npm run prisma:generate
npm run prisma:migrate

# Start server (http://localhost:3001)
npm run dev
```

## 3. Set Up Frontend

In a new terminal:

```bash
cd Apps/web

# Create .env file
cp .env.example .env

# Install and start (http://localhost:3000)
npm install
npm run dev
```

## 4. Test It

1. Open http://localhost:3000 in browser
2. Click "Create one" to register
3. Enter email and password
4. Click "Log in" to test login
5. You should see "Welcome back" message
6. Click "Log out" to test logout

## 5. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment options.

## What's Working

✅ User registration
✅ User login
✅ Session persistence (refresh tokens)
✅ Protected routes
✅ User logout
✅ No sensitive data exposed

## File Structure

```
Apps/
  server/
    src/
      modules/auth/
        auth.routes.ts       ← API endpoints
        auth.controller.ts   ← Request handlers
        auth.service.ts      ← Business logic
        auth.middleware.ts   ← JWT verification
      config.ts              ← Configuration
      index.ts               ← Express server
    prisma/schema.prisma     ← Database schema
  web/
    src/
      pages/
        Auth.tsx             ← Login/Register UI
        Home.tsx             ← Authenticated page
      AuthContext.tsx        ← Auth state management
      api.ts                 ← API client
      App.tsx                ← Route switcher
```

## Common Commands

### Backend

```bash
cd Apps/server

npm run dev              # Development server
npm run build           # Compile TypeScript
npm start              # Production server
npm run prisma:studio  # View/edit database
npm run prisma:migrate # Create schema migrations
```

### Frontend

```bash
cd Apps/web

npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## API Reference

All endpoints return JSON. Access token sent as `Authorization: Bearer <token>`

### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Get Current User
```bash
GET /auth/me
Authorization: Bearer <accessToken>

Response:
{
  "id": "user-id",
  "email": "user@example.com",
  "role": "OWNER",
  "createdAt": "2024-02-16T..."
}
```

### Refresh Token
```bash
POST /auth/refresh
(Sends refreshToken cookie automatically)

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout
```bash
POST /auth/logout
(Clears refreshToken cookie)

Response:
{
  "message": "Logged out"
}
```

## Troubleshooting

### Database connection error
- Verify PostgreSQL is running
- Check DATABASE_URL in .env is correct
- Run `npm run prisma:migrate` to set up tables

### Port already in use
- Backend: Change SERVER_PORT in .env
- Frontend: Run on different port: `npm run dev -- --port 3001`

### CORS errors
- Check FRONTEND_URL in backend .env
- For local dev, should be `http://localhost:3000`

### Can't log in after register
- Check database is running
- Verify API is responding: `curl http://localhost:3001/health`

## Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to production
- See [CLAUDE.md](./CLAUDE.md) for architecture rules
