# Step-by-Step: Fix 404 Error

## Quick Reset (Recommended)

### Step 1: Run the complete reset batch file
Double-click: `COMPLETE_RESET.bat`

Wait until you see:
```
RESET COMPLETE
```

This will:
- Kill all Node processes
- Delete old builds
- Reinstall all dependencies
- Rebuild everything fresh

---

## Manual Steps (If batch fails)

### Terminal 1: Start Database
```bash
docker-compose up
```

Wait for:
```
postgres_1  | database system is ready to accept connections
```

### Terminal 2: Start Server
```bash
cd Apps/server

# Kill any old processes
taskkill /F /IM node.exe

# Fresh build
npm run build

# Start
npm start
```

You MUST see ALL of these messages:
```
Server running on port 3001
Frontend URL: http://localhost:3000
Stripe configured: false
GHL configured: false
✓ Database connected
Sync scheduler started (daily at 2 AM UTC)
[2025-02-23T...] GET /health | Auth: NO
```

### Terminal 3: Start Frontend
```bash
cd Apps/web
npm run dev
```

You should see:
```
VITE v5.4.21  ready in 123 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

---

## Step 4: Test It

### In Browser:

1. Go to http://localhost:5173 (or whatever port Vite shows)
2. Login with your credentials
3. Click "Invite your advisor"
4. Click "Generate Invitation Link"

### In Server Terminal:

You should see requests logged:
```
[2025-02-23T12:34:56.789Z] POST /invitations | Auth: YES
[Invitations] createInvitation called, userId: user_123
[InvitationsService] Creating invitation for user: user_123...
[InvitationsService] Invitation created successfully: cuid_xyz
[Invitations] Invitation created: cuid_xyz
```

### In Browser Console (F12 → Console):

You should see:
```
[InviteModal] Generating invitation...
[InviteModal] Invitation created successfully
```

---

## Troubleshooting

### Still getting 404?

1. **Check server logs** - Do you see the POST /invitations request logged?
   - If NO: The frontend is not sending the request (check browser Network tab)
   - If YES: But you see 404, the route is not registered

2. **Check frontend Network tab** (F12 → Network):
   - Click "Generate Invitation Link"
   - Look for a POST request to `localhost:3001/invitations`
   - Check:
     - Status: Should NOT be 404
     - Headers: Authorization header should be present
     - Response: Shows the error

3. **Check if routes are registered** - Open: `http://localhost:3001/debug/routes`
   - You should see `POST /invitations` in the list
   - If not: The server didn't build routes properly

4. **Check for compilation errors** - In terminal where you ran `npm run build`, look for:
   - Red text
   - "error TS"
   - Any errors about modules

### Database not connected?

Server logs show:
```
✗ Database connection failed: Can't reach database server
```

**Fix:**
```bash
# In a new terminal
docker-compose ps
# Should show postgres running

# If not:
docker-compose up
```

### Server crashed on startup?

Server shows error and closes. Look for message like:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Fix:**
```bash
taskkill /F /IM node.exe
npm start
```

---

## Debug Endpoints

### Check all routes
```
http://localhost:3001/debug/routes
```

### Check database connection
```
http://localhost:3001/health
```

Should return:
```json
{"status":"ok","database":"connected"}
```

---

## Final Checklist

Before trying again, verify:

- [ ] `taskkill /F /IM node.exe` ran
- [ ] `docker-compose ps` shows postgres running
- [ ] Server shows `✓ Database connected`
- [ ] Frontend shows `Ready in XXX ms`
- [ ] `http://localhost:3001/health` returns 200 OK
- [ ] `http://localhost:3001/debug/routes` lists `/invitations`
- [ ] Browser console (F12) is open and clear
- [ ] Server terminal shows all POST requests

Then try clicking "Generate Invitation Link" again.

---

**If it still doesn't work, copy-paste the full error message from:**
1. Browser console (F12)
2. Server terminal
3. Browser Network tab (F12 → Network → Response)

And share all three!
