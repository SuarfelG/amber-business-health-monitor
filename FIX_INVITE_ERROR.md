# Fix: Invite Collaborator Network Error

## The Problem
When you click "Generate Invitation Link", you get a "Network error" message. This happens because the app can't connect to the database.

## The Root Cause
Your database URL in `Apps/server/.env` was pointing to an **offline Supabase server**:
```
DATABASE_URL="postgresql://postgres.dcswpmfvuywknarzneug:%2312yonasdon@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

I've already changed it to use a **local PostgreSQL database**:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/business_health_monitor"
```

## How to Fix It (3 Steps)

### Step 1: Start PostgreSQL Database
**On Windows**, double-click:
```
setup-and-run.bat
```

**On Mac/Linux**, run:
```bash
docker-compose up
```

Wait until you see:
```
postgres_1  | database system is ready to accept connections
```

### Step 2: (Only if you used manual commands) Run Migrations
Open a new terminal and run:
```bash
cd Apps/server
npx prisma migrate deploy
```

This creates all the database tables needed, including the `Invitation` table.

### Step 3: Start the Server
```bash
cd Apps/server
npm run build
npm start
```

You should see:
```
Server running on port 3001
Frontend URL: http://localhost:3000
Stripe configured: false
GHL configured: false
✓ Database connected
```

The **✓ Database connected** message means the database is working!

## Step 4: Test It

1. Open http://localhost:3000
2. Login to your account
3. Click "Invite your advisor"
4. Click "Generate Invitation Link"

**You should now see** a link like:
```
http://localhost:3000/expert/abc123def456...
```

## If It Still Doesn't Work

Check the server logs for one of these errors:

### Error 1: "Can't reach database server"
```
Can't reach database server at localhost:5432
```
**Fix:** Make sure `docker-compose up` is still running in another terminal

### Error 2: "relation \"Invitation\" does not exist"
```
relation "public.Invitation" does not exist
```
**Fix:** Run migrations: `npx prisma migrate deploy`

### Error 3: "no more connections available"
```
remaining connection slots are reserved
```
**Fix:** Restart Docker: `docker-compose down && docker-compose up`

## What Changed

I modified these files to make debugging easier:

1. **`.env`** - Changed DATABASE_URL to localhost
2. **`Apps/server/src/prisma.ts`** - Added logging to show database errors
3. **`Apps/server/src/modules/invitations/invitations.service.ts`** - Added detailed logging
4. **`Apps/server/src/modules/invitations/invitations.controller.ts`** - Better error messages for database issues
5. **`docker-compose.yml`** - New file for local PostgreSQL
6. **`setup-and-run.bat`** - Automated setup for Windows

## The Flow (Now That It's Fixed)

```
You click "Generate Invitation Link"
   ↓
Frontend sends: POST /invitations (with your JWT token)
   ↓
Backend checks: Are you authenticated? ✅
   ↓
Backend connects to PostgreSQL database ✅ (NOW FIXED)
   ↓
Backend creates Invitation table row with unique token
   ↓
Backend returns: {url: "http://localhost:3000/expert/TOKEN123"}
   ↓
Frontend displays the URL
   ↓
You copy and share it with an expert
```

## Next: Fix Stripe

Once this works, update `Apps/server/.env`:
```
STRIPE_CLIENT_ID="ca_xxxxxxxxxxxxxxxx"
STRIPE_CLIENT_SECRET="sk_test_xxxxxxxxxxxxxxxx"
```

Get these from: https://dashboard.stripe.com/settings/apikeys

Then Stripe will work too!
