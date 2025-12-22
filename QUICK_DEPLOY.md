# Quick Deployment Guide

## 🎯 Your Setup

**Frontend (Already Deployed):**
- Vercel: https://no-limits-jade.vercel.app/
- Status: ✅ Live

**Backend (To Deploy):**
- Platform: Render
- Status: ⏳ Pending

**Database:**
- Supabase PostgreSQL
- Status: ✅ Configured

---

## 🚀 Deploy Backend to Render (5 Steps)

### Step 1: Go to Render
Visit: https://dashboard.render.com/

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your backend repository

### Step 3: Configure Service
```
Name: no-limits-backend
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: backend
Runtime: Node

⚠️ IMPORTANT - Copy the FULL build command below (order matters!):
Build Command: npm install && npx prisma generate && npm run build

Start Command: npm start
Instance Type: Free
```

**Note**: The build command MUST include all three steps IN THIS ORDER:
1. `npm install` - Install dependencies
2. `npx prisma generate` - Generate Prisma Client (must be before build!)
3. `npm run build` - Compile TypeScript

If you only see `npm install` or the order is wrong, the deployment will fail.

### Step 4: Add Environment Variables
Click "Advanced" → Add these variables:

```bash
NODE_ENV=production
PORT=3001

# Database (from your .env file)
DATABASE_URL=postgresql://postgres:sepmIn-zohro7-pacqek@db.ydzikxftogcggykkoetu.supabase.co:5432/postgres

# Supabase (from your .env file)
SUPABASE_URL=https://ydzikxftogcggykkoetu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkemlreGZ0b2djZ2d5a2tvZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMjkxMjcsImV4cCI6MjA4MTYwNTEyN30.HohFPXMBQeKN29pQ9woR-yce0G3fHhRqSdPYXE2hqfs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkemlreGZ0b2djZ2d5a2tvZXR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyOTEyNywiZXhwIjoyMDgxNjA1MTI3fQ.y6pbt-v9o8LjkIrsJmPVy-WFl2JlQ4bGy32zDhxR82Q

# CORS - Your Vercel Frontend
FRONTEND_URL=https://no-limits-jade.vercel.app

# JWT Secrets (GENERATED - USE THESE):
JWT_SECRET=e06f98e764e3b8c9ee9afb2140be0a0fc15e58e75a90487231f03f7d1f1ef1b96bd74138f943b548ad16cbb5536f80cf79ed13aa749fc1120b2d6737f55045d9
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=0534e1e3d068c21cb671223f5ac425696690f3f0b5710d4be8cc24e2922dde4778de608c3e681ea54e40b1c72d0b241d3e13e36c4469515e818e4386bad0cac7
JWT_REFRESH_EXPIRES_IN=30d
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait 2-5 minutes for build
3. **Copy your backend URL** (looks like: `https://no-limits-backend-xxxx.onrender.com`)

---

## 🔗 Connect Frontend to Backend

### Update Vercel Environment Variable

1. Go to: https://vercel.com/dashboard
2. Select project: **no-limits-jade**
3. Go to: **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
     *(Replace with your actual Render URL from Step 5)*
5. Click **Save**
6. Go to **Deployments** → Click **"..."** on latest → **Redeploy**

---

## ✅ Test Your Deployment

### 1. Test Backend
Visit: `https://your-backend-url.onrender.com/`

Should see:
```json
{"message": "API is running"}
```

### 2. Test Frontend
1. Visit: https://no-limits-jade.vercel.app/
2. Login with:
   - Email: `superadmin@nolimits.com`
   - Password: `password123`
3. Should successfully login and redirect to dashboard

### 3. Check Network (Browser DevTools)
1. Press **F12** to open DevTools
2. Go to **Network** tab
3. Login again
4. Should see API calls going to your Render backend URL
5. **No CORS errors** should appear

---

## 📝 Test Accounts

All use password: `password123`

| Role | Email |
|------|-------|
| Super Admin | superadmin@nolimits.com |
| Admin | admin@nolimits.com |
| Employee | employee@nolimits.com |
| Client 1 | papercrush@example.com |
| Client 2 | caobali@example.com |
| Client 3 | terppens@example.com |

---

## 🐛 Troubleshooting

### CORS Error in Browser or wrong order. Go to Settings → Build & Deploy
2. Set Build Command to: `npm install && npx prisma generate && npm run build`
3. ⚠️ Order matters! Prisma MUST be generated before TypeScript build
4. Save and redeploy

### TypeScript errors: Module '@prisma/client' has no exported member
**Fix**:
1. Prisma Client not generated before build
2. Update Build Command to: `npm install && npx prisma generate && npm run build`
3. Make sure `npx prisma generate` comes BEFORE `npm run build`
1. Build command is incomplete. Go to Settings → Build & Deploy
2. Set Build Command to: `npm install && npm run build && npx prisma generate`
3. Save and redeploy
OR
4. Wait 1-2 minutes. Free tier takes time to start.

### API Calls Still Going to localhost
**Fix**: 
1. Check Vercel environment variable is set
2. Make sure you redeployed after adding it
3. Clear browser cache

### Login Not Working
**Fix**:
1. Check Render logs for errors
2. Verify DATABASE_URL is correct
3. Test backend health endpoint

---

## 📊 Expected Behavior

✅ **Frontend**: https://no-limits-jade.vercel.app/
✅ **Backend**: https://your-backend-url.onrender.com/
✅ **Database**: Supabase (already connected)
✅ **CORS**: Configured
✅ **Authentication**: JWT tokens working
✅ **API calls**: Going from Vercel → Render → Supabase

---

## ⚡ Performance Note

**Render Free Tier**:
- Spins down after 15 minutes of inactivity
- First request takes ~30-60 seconds to wake up
- Subsequent requests are fast

**For Production**: Consider upgrading to a paid Render plan for 24/7 uptime.

---

## 📞 Need Help?

- Check Render logs: Dashboard → Your Service → Logs
- Check Vercel logs: Dashboard → Your Project → Deployments → View Logs
- Check Supabase: Dashboard → Database → Logs

---

## 🎉 When Everything Works

You should be able to:
1. ✅ Visit frontend at Vercel URL
2. ✅ Login with test credentials
3. ✅ See dashboard load
4. ✅ Navigate between pages
5. ✅ Logout successfully
6. ✅ No console errors

**Congratulations! Your full-stack app is live! 🚀**
