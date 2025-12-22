# Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### Backend (Render)
- [ ] Code is pushed to GitHub repository
- [ ] All console logs removed (✅ Already done)
- [ ] Environment variables ready (see `.env.production.example`)
- [ ] Strong JWT secrets generated (run `node generate-secrets.js`)
- [ ] Database URL verified in Supabase
- [ ] CORS configured for Vercel frontend
- [ ] Build command tested locally: `npm run build`
- [ ] Start command works: `npm start`

### Frontend (Vercel)
- [ ] Code is pushed to GitHub/connected to Vercel
- [ ] Environment variable `NEXT_PUBLIC_API_URL` will be set after backend deployment
- [ ] Build succeeds on Vercel

### Database (Supabase)
- [x] Schema created and pushed
- [x] Test users seeded
- [ ] Database connection string ready for Render

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Render

1. **Create Render Account** (if you haven't)
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure Build Settings**
   ```
   Name: no-limits-backend
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: npm start
   ```

4. **Add Environment Variables**
   - Copy from `.env.production.example`
   - Generate new JWT secrets with: `node generate-secrets.js`
   - Set all variables in Render dashboard

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete (~2-5 minutes)
   - Note your backend URL: `https://your-app-name.onrender.com`

6. **Verify Backend is Running**
   - Visit: `https://your-app-name.onrender.com/`
   - Should see: `{"message": "API is running"}`

### Step 2: Configure Frontend on Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `no-limits-jade`

2. **Add Environment Variable**
   - Settings → Environment Variables
   - Add:
     ```
     Name: NEXT_PUBLIC_API_URL
     Value: https://your-backend-url.onrender.com/api
     ```
     (Replace with your actual Render backend URL)

3. **Redeploy Frontend**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait for deployment to complete

### Step 3: Test the Full Stack

1. **Visit Your Frontend**
   - Go to: https://no-limits-jade.vercel.app/

2. **Test Login**
   - Email: `superadmin@nolimits.com`
   - Password: `password123`

3. **Check Browser Console**
   - Open DevTools (F12)
   - Network tab should show API calls to your Render backend
   - No CORS errors should appear

4. **Test Other Features**
   - Navigate to dashboard
   - Check that data loads
   - Test logout

---

## 🔧 After Deployment

### Update Backend CORS (if needed)
If you get CORS errors:
1. Go to Render dashboard
2. Update `FRONTEND_URL` environment variable
3. Make sure it's: `https://no-limits-jade.vercel.app` (no trailing slash)
4. Manual Deploy → Deploy latest commit

### Monitor Logs
- **Render**: Dashboard → Your Service → Logs
- **Vercel**: Dashboard → Your Project → Logs
- **Supabase**: Dashboard → Logs

### Performance Notes
- **Render Free Tier**: Spins down after 15 min of inactivity
- First request may take 30-60 seconds to wake up
- Consider upgrading for production use

---

## 📋 Environment Variables Reference

### Backend (Render)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.ydzikxftogcggykkoetu.supabase.co:5432/postgres
SUPABASE_URL=https://ydzikxftogcggykkoetu.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
FRONTEND_URL=https://no-limits-jade.vercel.app
JWT_SECRET=[GENERATED_SECRET]
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=[GENERATED_SECRET_2]
JWT_REFRESH_EXPIRES_IN=30d
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
```

---

## 🐛 Common Issues

### "Not allowed by CORS"
**Solution**: Check `FRONTEND_URL` in Render matches your Vercel URL exactly

### "502 Bad Gateway" on Render
**Solution**: Wait 1-2 minutes for backend to start, check Render logs

### API calls fail from frontend
**Solution**: Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel

### Login fails
**Solution**: Check backend logs in Render, verify database connection

### Database connection errors
**Solution**: Verify `DATABASE_URL` in Render, check Supabase is accessible

---

## 📞 Support Resources

- **Render Docs**: https://docs.render.com
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs

---

## 🔐 Security Reminders

- ✅ Never commit `.env` files
- ✅ Use strong, unique JWT secrets in production
- ✅ Rotate secrets regularly
- ✅ Monitor logs for suspicious activity
- ✅ Keep dependencies updated
