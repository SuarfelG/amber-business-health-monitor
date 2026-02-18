# Deployment Guide

This guide covers how to deploy Amber - Business Health Monitor to production.

## Architecture Overview

The application consists of:
- **Backend**: Node.js + Express API (Apps/server)
- **Frontend**: React SPA (Apps/web)
- **Database**: PostgreSQL

For production, you'll need:
1. A hosting service for the backend API
2. A hosting service for the frontend
3. A PostgreSQL database service

## Recommended Hosting Stack

We recommend this stack for ease and cost-effectiveness:

### Backend
- **Render** or **Heroku** for Node.js hosting (easier)
- **Railway** or **Fly.io** for more control

### Frontend
- **Vercel** (recommended - made by Next.js team, works great with React)
- **Netlify** (excellent alternative)

### Database
- **Neon** (serverless PostgreSQL, integrates well with Render/Railway)
- **AWS RDS** (if you need more control)
- **Digital Ocean** (simple managed PostgreSQL)

---

## Deployment Option 1: Render + Vercel + Neon (Recommended)

This is the easiest path with good free tier options.

### Step 1: Set Up PostgreSQL with Neon

1. Go to https://neon.tech and sign up (free tier available)
2. Create a new project
3. Copy the connection string that looks like:
   ```
   postgresql://user:password@host/database
   ```
4. Save this for later

### Step 2: Deploy Backend to Render

1. Push your code to GitHub (if not already done)
2. Go to https://render.com and sign up
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository
5. Fill in the deployment settings:
   - **Name**: `amber-business-health-monitor-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add environment variables in the "Environment" section:
   ```
   DATABASE_URL=<your-neon-connection-string>
   NODE_ENV=production
   JWT_SECRET=<generate-a-strong-random-string>
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
7. Click "Create Web Service"
8. Render will deploy automatically. Wait for it to finish.
9. Copy the URL (looks like `https://amber-business-health-monitor-api.onrender.com`)

**⚠️ Important**: On free tier, Render spins down after 15 minutes of inactivity. For production, upgrade to paid plan.

### Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign up with your GitHub account
2. Click "Add New..." and select "Project"
3. Import your repository
4. Select the root directory: `/` (since Vercel auto-detects)
5. In "Build and Output Settings":
   - **Framework**: React
   - **Build Command**: `cd Apps/web && npm install && npm run build`
   - **Output Directory**: `Apps/web/dist`
6. Add environment variables:
   ```
   VITE_API_URL=https://amber-business-health-monitor-api.onrender.com
   ```
7. Click "Deploy"
8. Vercel will deploy automatically. Copy your frontend URL.

### Step 4: Update Backend FRONTEND_URL

1. Go back to Render dashboard
2. Open your backend service
3. Go to "Environment" settings
4. Update `FRONTEND_URL` to your Vercel URL
5. Render will redeploy automatically

---

## Deployment Option 2: Railway + Vercel + Railway Postgres

Railway is simpler than Render.

### Step 1: Set Up PostgreSQL on Railway

1. Go to https://railway.app and sign up
2. Click "New Project" and select "Provision PostgreSQL"
3. Go to the database, click "Connect" and copy the URL
4. Save for later

### Step 2: Deploy Backend to Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. In `Apps/server` directory:
   ```bash
   railway init
   ```
4. Link the PostgreSQL database:
   ```bash
   railway link
   ```
5. Add environment variables:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=<strong-random-string>
   railway variables set FRONTEND_URL=https://your-frontend.vercel.app
   ```
6. Deploy:
   ```bash
   railway up
   ```
7. Get the URL from Railway dashboard

### Step 3: Deploy Frontend to Vercel (same as Option 1)

---

## Deployment Option 3: Docker + AWS/GCP (More Control)

If you want more control or already use AWS/GCP:

### Build Docker Images

1. Create `Apps/server/Dockerfile`:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   RUN npx prisma generate
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

2. Create `Apps/web/Dockerfile`:
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. Push to Docker Hub or container registry
4. Deploy to AWS ECS, GCP Cloud Run, or similar

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] Backend health check: `GET https://your-api.com/health` returns 200
- [ ] Frontend loads without errors
- [ ] Can register a new user
- [ ] Can log in with registered email
- [ ] Session persists after page refresh
- [ ] Logout clears the session
- [ ] JWT_SECRET is strong and unique
- [ ] CORS is configured correctly
- [ ] No sensitive data in logs
- [ ] SSL/HTTPS is enabled everywhere

---

## Environment Variables Summary

### Backend (.env)

```
DATABASE_URL=postgresql://...
NODE_ENV=production
JWT_SECRET=<generate-strong-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
SERVER_PORT=3001
FRONTEND_URL=https://your-frontend-url.com
```

### Frontend (.env)

```
VITE_API_URL=https://your-backend-url.com
```

---

## Production Considerations

### Security

1. **JWT_SECRET**: Generate a strong random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **CORS**: Ensure `FRONTEND_URL` matches your actual frontend domain

3. **HTTPS**: Always use HTTPS in production. Both Vercel and Render provide free SSL.

4. **Refresh Tokens**: Stored in httpOnly cookies, not vulnerable to XSS

5. **Password Hashing**: Bcrypt with 10 rounds (configured in auth.service.ts)

### Database Backups

- Set up automated backups with your database provider
- For Neon: Automatic backups included
- For Railway: Configure backup frequency in settings

### Monitoring

- Monitor error logs in your hosting provider's dashboard
- Set up email alerts for deployment failures
- Monitor database connection pool usage

### Scaling

- Frontend: Vercel handles scaling automatically
- Backend: Start on free/hobby tier, upgrade if needed
- Database: Monitor connection usage, upgrade plan if needed

---

## Troubleshooting

### 401 Unauthorized errors

- Check JWT_SECRET matches between deploy and local
- Verify FRONTEND_URL is correct in backend

### CORS errors

- Update FRONTEND_URL in backend environment variables
- Ensure frontend is making requests to correct API URL

### Database connection errors

- Verify DATABASE_URL is correct
- Check database is accessible from your hosting provider
- Run migrations: Backend runs automatically on deploy (via Prisma)

### Frontend blank page

- Check browser console for errors
- Verify VITE_API_URL is set correctly
- Check network tab to see if API calls are working

---

## Cost Estimate (Monthly)

| Service | Free Tier | Estimated Cost |
|---------|-----------|-----------------|
| Backend (Render) | $0 (hibernates) | $7-12 (production) |
| Frontend (Vercel) | Free | $0 |
| Database (Neon) | Free (up to 3GB) | $0-25 |
| **Total** | **$0** | **$7-37** |

Vercel frontend is always free for public projects. Upgrade database only if you exceed free tier limits.

---

## Next Steps

1. Choose hosting option above
2. Set up PostgreSQL database
3. Deploy backend
4. Deploy frontend
5. Test production environment
6. Set up monitoring and backups
7. Document any custom configurations
