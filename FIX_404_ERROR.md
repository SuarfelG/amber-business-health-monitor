# Fix: 404 Error on Invite Collaborator

## The Problem
You're getting a 404 error, which means the server is running but can't find the `/invitations` endpoint.

## The Solution

### Step 1: STOP the current server
Press `Ctrl+C` in the terminal where the server is running, or:
```bash
taskkill /F /IM node.exe
```

### Step 2: CLEAN rebuild
```bash
cd Apps/server

# Remove old build
rmdir /s /q dist

# Fresh build
npm run build
```

### Step 3: START fresh server
```bash
npm start
```

**Watch the terminal output** - you should see:
```
Server running on port 3001
Frontend URL: http://localhost:3000
Stripe configured: false
GHL configured: false
✓ Database connected
Sync scheduler started (daily at 2 AM UTC)
```

### Step 4: Verify the endpoint exists
Open a new terminal and run:

**On Windows:**
```bash
curl http://localhost:3001/health
```

You should see:
```json
{"status":"ok","database":"connected"}
```

If you see a 404, the server didn't start properly.

### Step 5: Check the exact error
Open browser console (F12) and look for the actual request being made.

**The frontend should be calling:**
```
POST http://localhost:3001/invitations
```

NOT some other URL.

---

## Common Causes of 404

### 1. Old server still running
```bash
taskkill /F /IM node.exe
# Wait 2 seconds
npm start
```

### 2. dist folder not rebuilt
```bash
rm -rf dist
npm run build
npm start
```

### 3. Database not running
```bash
docker-compose ps
# Should show postgres is running. If not:
docker-compose up
```

### 4. Server crashed silently
Check for errors in the terminal where you ran `npm start`. Look for red text.

### 5. Wrong API_URL in frontend
Check `Apps/web/.env`:
```
VITE_API_URL="http://localhost:3001"
```

If this is wrong or missing, the frontend is calling the wrong server.

---

## Debug Checklist

- [ ] Stop old server process
- [ ] Run `npm run build` in Apps/server
- [ ] Run `npm start` in Apps/server
- [ ] See "✓ Database connected" in logs
- [ ] See "Server running on port 3001" in logs
- [ ] Docker shows postgres running (`docker-compose ps`)
- [ ] Frontend `.env` has correct `VITE_API_URL`
- [ ] Frontend rebuilt (`npm run build` in Apps/web)
- [ ] Test health endpoint: `curl http://localhost:3001/health`

---

## Manual Test (Without Frontend)

1. Get your JWT token first (login to frontend, check browser storage)
2. Replace YOUR_JWT_BELOW with actual token:

```bash
curl -X POST http://localhost:3001/invitations \
  -H "Authorization: Bearer YOUR_JWT_BELOW" \
  -H "Content-Type: application/json"
```

**Expected responses:**
- ✅ 201 with invitation URL = SUCCESS
- ✅ 401 Unauthorized = No token (need to login first)
- ✅ 503 Database error = Database not running
- ❌ 404 Not Found = Server needs restart

---

## Server Logs to Look For

**Good logs:**
```
[Invitations] createInvitation called, userId: user_123
[InvitationsService] Creating invitation for user: user_123...
[InvitationsService] Invitation created successfully: cuid_xyz
```

**Bad logs:**
```
[Invitations] Missing userId, returning 401
```

**Database error logs:**
```
[InvitationsService] Database error: Can't reach database
```

---

## Last Resort: Full Reset

```bash
# Stop everything
taskkill /F /IM node.exe
docker-compose down

# Wait 5 seconds
timeout 5

# Start fresh
docker-compose up -d
cd Apps/server
rm -rf dist node_modules
npm install
npm run build
npx prisma migrate deploy
npm start
```

Then try the invite again.

---

**Let me know which step fails and I can fix it!**
