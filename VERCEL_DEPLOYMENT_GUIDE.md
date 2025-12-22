# Vercel Deployment Guide

This guide explains how to properly deploy the No Limits application on Vercel with correct environment variables.

## Problem

If you're seeing CORS errors like:
```
Access to fetch at 'https://no-limits-backend.onrender.com/api/auth/login' from origin 'https://no-limits-jade.vercel.app'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This is because the frontend is trying to connect to an old/incorrect backend URL.

## Solution

### Frontend Deployment (Vercel)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your frontend project: `no-limits-jade` (or whatever your project is named)
3. Go to **Settings** → **Environment Variables**
4. Add/Update the following environment variable:

   **Variable Name:** `NEXT_PUBLIC_API_URL`

   **Value:** `https://no-limits-backend.vercel.app/api`

   **Environments:** Select all (Production, Preview, Development)

5. Click **Save**
6. Go to **Deployments** tab
7. Click on the three dots (...) next to your latest deployment
8. Select **Redeploy** to redeploy with the new environment variable

### Backend Deployment (Vercel)

1. Go to your Vercel dashboard
2. Select your backend project: `no-limits-backend`
3. Go to **Settings** → **Environment Variables**
4. Verify/Add the following environment variable:

   **Variable Name:** `FRONTEND_URL`

   **Value:** `https://no-limits-jade.vercel.app`

   **Environments:** Select all (Production, Preview, Development)

5. Add all other required environment variables from `backend/.env.production.example`:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `NODE_ENV=production`
   - `PORT=3001`

6. Click **Save**
7. Redeploy if necessary

## Current Production URLs

- **Frontend:** https://no-limits-jade.vercel.app/
- **Backend:** https://no-limits-backend.vercel.app/

## How It Works

### Frontend
The frontend code uses `process.env.NEXT_PUBLIC_API_URL` to determine which backend to connect to:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
```

This pattern is used throughout the codebase in:
- `frontend/src/lib/api.ts`
- `frontend/src/lib/auth-api.ts`
- `frontend/src/components/auth/AuthProvider.tsx`
- And other components

### Backend
The backend uses `FRONTEND_URL` for CORS configuration to allow requests from the frontend:

```typescript
const allowedOrigins = env.frontendUrl.split(',').map(url => url.trim());
```

You can specify multiple origins separated by commas:
```
FRONTEND_URL="http://localhost:3000,https://no-limits-jade.vercel.app"
```

## Local Development

For local development, create a `.env.local` file in the frontend directory:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

And ensure your backend `.env` includes:

```bash
# backend/.env
FRONTEND_URL="http://localhost:3000,https://no-limits-jade.vercel.app"
```

## Troubleshooting

### CORS errors persist after updating environment variables
1. Clear your browser cache and cookies
2. Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Verify the environment variables are set correctly in Vercel dashboard
4. Check that you redeployed after setting the variables
5. Check browser console network tab to see which URL is being called

### Frontend still calling old URL
1. Check if there are any hardcoded URLs in your code
2. Ensure the environment variable name is exactly `NEXT_PUBLIC_API_URL` (Next.js requires the `NEXT_PUBLIC_` prefix for client-side variables)
3. Redeploy the frontend after setting the variable

### Backend rejecting requests
1. Verify `FRONTEND_URL` is set correctly in backend environment variables
2. Check that the frontend URL matches exactly (including https://)
3. Check backend logs in Vercel for CORS errors
