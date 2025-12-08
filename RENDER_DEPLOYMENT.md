# Deploy Backend to Render - Step-by-Step Guide

Complete guide to deploy your Election Engagement Platform backend to Render.

## 🚀 Quick Deploy Steps

### Step 1: Sign Up
1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with your GitHub account (recommended)

### Step 2: Create New Web Service
1. Click "New +" button in dashboard
2. Select "Web Service"
3. Connect your GitHub account if not already connected
4. Select repository: `Election-Engagement--main`

### Step 3: Configure Service

**Basic Settings:**
- **Name:** `election-engagement-backend` (or your preferred name)
- **Region:** Choose closest to your users (e.g., `Oregon (US West)`)
- **Branch:** `main`
- **Root Directory:** `backend` ⚠️ **IMPORTANT: Set this to `backend`**

**Build & Deploy Settings:**
- **Environment:** `Node`
- **Build Command:** `pnpm install && pnpm build`
- **Start Command:** `pnpm start` ⚠️ **CRITICAL: Make sure this is exactly `pnpm start`, NOT `nom run dev` or `npm run dev`**

**Advanced Settings (Optional):**
- **Auto-Deploy:** `Yes` (deploys on every push to main branch)

### Step 4: Add Environment Variables

Click "Environment" tab and add these variables:

```env
# Supabase Configuration
SUPABASE_URL=https://pwcmyidxdyetvyiuosnm.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration
JWT_SECRET=generate-a-strong-random-secret-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
PORT=10000

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com
```

**Important Notes:**
- Replace `your-supabase-anon-key-here` with your actual Supabase anon key
- Generate a strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- Set `CORS_ORIGIN` to your frontend URL (e.g., `https://your-app.vercel.app`)

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will start building and deploying
3. Wait for deployment to complete (usually 2-5 minutes)
4. Your backend will be available at: `https://your-service-name.onrender.com`

---

## 📋 Pre-Deployment Checklist

- [ ] Supabase database is set up and migrations are run
- [ ] Environment variables are configured
- [ ] `JWT_SECRET` is generated and set
- [ ] `CORS_ORIGIN` is set to your frontend URL
- [ ] Backend code is pushed to GitHub
- [ ] Root directory is set to `backend` in Render settings

---

## 🔧 Render Configuration

### Build Command
```bash
pnpm install && pnpm build
```

### Start Command
```bash
pnpm start
```

### Root Directory
```
backend
```

---

## 🌐 After Deployment

### 1. Get Your Backend URL
Your backend will be available at:
```
https://your-service-name.onrender.com
```

### 2. Test the API
```bash
curl https://your-service-name.onrender.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-01-XX..."}
```

### 3. Update Frontend Environment
Update your frontend `.env` file:
```env
VITE_API_BASE_URL=https://your-service-name.onrender.com/api
```

---

## 🔄 Auto-Deploy Setup

Render automatically deploys when you:
- Push to the `main` branch
- Merge a pull request to `main`

To disable auto-deploy:
- Go to your service settings
- Toggle "Auto-Deploy" off

---

## 💰 Pricing

### Free Tier
- ✅ Free forever
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold start takes ~30 seconds after spin-down
- ✅ 750 hours/month free

### Paid Plans
- **Starter:** $7/month - Always on, no cold starts
- **Standard:** $25/month - Better performance
- **Pro:** Custom pricing - Production grade

**Recommendation:** Start with free tier, upgrade to Starter ($7/month) for production.

---

## 🐛 Troubleshooting

### Issue: Build Fails
**Solution:**
- Check build logs in Render dashboard
- Ensure `pnpm` is available (Render auto-installs it)
- Verify `package.json` has correct scripts

### Issue: Service Won't Start
**Solution:**
- Check start command: `pnpm start` (NOT `nom run dev` or `npm run dev`)
- Verify `dist/index.js` exists after build
- Check environment variables are set
- If you see "nom: command not found", update Start Command in Render settings to `pnpm start`

### Issue: CORS Errors
**Solution:**
- Update `CORS_ORIGIN` environment variable
- Ensure frontend URL is correct (include `https://`)
- Check backend logs for CORS errors

### Issue: Database Connection Errors
**Solution:**
- Verify Supabase credentials are correct
- Check Supabase project is active
- Ensure database tables exist

### Issue: Cold Start Delays
**Solution:**
- Free tier: Normal (15min inactivity = spin down)
- Upgrade to Starter plan ($7/month) for always-on

---

## 📊 Monitoring

### View Logs
1. Go to your service in Render dashboard
2. Click "Logs" tab
3. View real-time logs

### Health Check
Render automatically checks: `https://your-service.onrender.com/health`

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** ✅ (already in .gitignore)
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **Set CORS_ORIGIN** - Only allow your frontend domain
4. **Use HTTPS** - Render provides this automatically
5. **Keep dependencies updated** - Run `pnpm update` regularly

---

## 🚀 Quick Deploy Checklist

1. ✅ Code pushed to GitHub
2. ✅ Render account created
3. ✅ Web service created
4. ✅ Root directory set to `backend`
5. ✅ Build command: `pnpm install && pnpm build`
6. ✅ Start command: `pnpm start`
7. ✅ Environment variables added
8. ✅ Service deployed
9. ✅ Health check passing
10. ✅ Frontend updated with new API URL

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **Community:** https://community.render.com

---

## 🎉 You're All Set!

Once deployed, your backend will be:
- ✅ Accessible globally
- ✅ Auto-deploying on git push
- ✅ Secured with HTTPS
- ✅ Monitored by Render

**Next Steps:**
1. Deploy your frontend (Vercel, Netlify, etc.)
2. Update frontend API URL
3. Test the full application
4. Share your platform! 🎊

