# Railway Deployment Guide

## Prerequisites
1. Railway account (sign up at railway.app)
2. GitHub repository: `https://github.com/digitalconnectionsau/j11-production-manager.git`

## Railway Deployment Steps

### 1. Setup Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Select `digitalconnectionsau/j11-production-manager`
5. Choose the `backend` folder as the root directory

### 2. Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "New Service" → "Database" → "PostgreSQL"
3. Railway will automatically provide `DATABASE_URL` environment variable

### 3. Configure Environment Variables
In Railway dashboard, go to your backend service → Variables, add:

```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.railway.app
JWT_SECRET=your-super-secure-random-string-here
```

### 4. Configure Build Settings
Railway should automatically detect the Node.js project. If needed, set:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `/backend`

### 5. Deploy Frontend
Repeat similar steps for frontend:
1. Create new service from same GitHub repo
2. Set root directory to `/frontend`
3. Set environment variables:
   ```
   VITE_API_URL=https://productionmanager-production.up.railway.app
   ```

### 6. Database Migration (After First Deploy)
Once backend is deployed, run database migrations:
1. In Railway dashboard, go to backend service
2. Open the "Deploy" tab
3. Use Railway CLI or the web terminal to run:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

## Alternative: Using Railway CLI

### Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Deploy Backend
```bash
cd backend
railway init
railway add postgresql
railway up
```

### Deploy Frontend
```bash
cd ../frontend
railway init
railway up
```

## Environment Variables Summary

### Backend (.env)
```
NODE_ENV=production
DATABASE_URL=postgresql://... (auto-provided by Railway)
FRONTEND_URL=https://your-frontend.railway.app
JWT_SECRET=generate-a-secure-random-string
PORT=3001
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend.railway.app
```

## Testing Deployment
1. Check backend health: `https://your-backend.railway.app/health`
2. Test API endpoints: `https://your-backend.railway.app/api/users`
3. Verify frontend loads: `https://your-frontend.railway.app`

## Database Schema
After successful deployment, your PostgreSQL database will have:
- `users` table
- `production_tasks` table  
- `projects` table
- `project_tasks` table (junction)

## Current Production URLs
- **Backend**: https://productionmanager-production.up.railway.app
- **Frontend**: https://j11-frontend-production.up.railway.app

## Required Environment Variables

### Frontend Service (Railway Dashboard)
```
VITE_API_URL=https://productionmanager-production.up.railway.app
```

### Backend Service (Railway Dashboard)
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://j11-frontend-production.up.railway.app
JWT_SECRET=your-jwt-secret-here
EMAIL_MODE=production
SMTP_PASS=your-smtp2go-api-key
FROM_EMAIL=noreply@digitalconnections.au
DATABASE_URL=(automatically provided by Railway PostgreSQL)
```

## Troubleshooting
- Check Railway logs for build/runtime errors
- Verify all environment variables are set
- Ensure DATABASE_URL is connected
- Check CORS settings if frontend can't connect to backend
- **Route not found errors**: Verify VITE_API_URL points to correct backend URL
