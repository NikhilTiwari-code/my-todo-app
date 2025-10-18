# ✅ Deployment Checklist

**Complete checklist for deploying to Railway with Docker and CI/CD**

---

## 📦 Files Created ✅

All necessary files have been created:

- [x] `Dockerfile` - Multi-stage Docker build configuration
- [x] `.dockerignore` - Files to exclude from Docker build
- [x] `railway.json` - Railway deployment configuration (already exists)
- [x] `.github/workflows/deploy.yml` - GitHub Actions CI/CD workflow
- [x] `next.config.ts` - Updated with `output: 'standalone'`

---

## 🔧 Configuration Steps

### Step 1: Update next.config.ts ✅

Already updated with:
- ✅ `output: 'standalone'` for Docker
- ✅ Cloudinary image configuration
- ✅ Console removal in production

### Step 2: Create Health Check Endpoint

**Action Required**: Create this file if it doesn't exist

**File**: `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  const isDbConnected = mongoose.connection.readyState === 1;
  
  return NextResponse.json({
    status: isDbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isDbConnected ? 'connected' : 'disconnected',
  });
}
```

**Status**: [ ] Create this file

---

## 🐳 Docker Setup

### Step 3: Test Docker Locally

```bash
# Build the image
docker build -t my-todo-app .

# Run the container
docker run -p 3000:3000 \
  -e MONGODB_URI="your_mongodb_uri" \
  -e JWT_SECRET="your_jwt_secret" \
  -e CLOUDINARY_CLOUD_NAME="your_cloud" \
  -e CLOUDINARY_API_KEY="your_key" \
  -e CLOUDINARY_API_SECRET="your_secret" \
  my-todo-app

# Test health endpoint
curl http://localhost:3000/api/health
```

**Status**: [ ] Docker build successful locally

---

## 🚂 Railway Deployment

### Step 4: Create Railway Project

**Option A: Railway Dashboard**
1. [ ] Go to [railway.app](https://railway.app)
2. [ ] Click "New Project"
3. [ ] Select "Deploy from GitHub repo"
4. [ ] Choose `my-todo-app` repository
5. [ ] Railway auto-detects Dockerfile
6. [ ] Click "Deploy"

**Option B: Railway CLI**
```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

**Status**: [ ] Railway project created

### Step 5: Add MongoDB Service

1. [ ] Railway Dashboard → Add Service
2. [ ] Select "MongoDB"
3. [ ] Copy connection string
4. [ ] Add to environment variables

**Status**: [ ] MongoDB service added

### Step 6: Add Redis Service (Optional but Recommended)

1. [ ] Railway Dashboard → Add Service
2. [ ] Select "Redis"
3. [ ] Use reference variable: `${{Redis.REDIS_URL}}`

**Status**: [ ] Redis service added

---

## 🔐 Environment Variables

### Step 7: Configure Environment Variables

Railway Dashboard → Your Project → Variables → Add:

#### Required Variables:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database (from MongoDB service)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Authentication (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars

# Redis (from Redis service or external)
REDIS_URL=${{Redis.REDIS_URL}}

# Cloudinary (from cloudinary.com dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Socket.io
SOCKET_PORT=3001

# Next.js
NEXT_TELEMETRY_DISABLED=1

# Frontend URL (for CORS)
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

**Checklist**:
- [ ] NODE_ENV set
- [ ] MONGODB_URI set
- [ ] JWT_SECRET set (generated securely)
- [ ] CLOUDINARY variables set
- [ ] REDIS_URL set (optional)

**Generate JWT Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🤖 CI/CD with GitHub Actions

### Step 8: Setup GitHub Secrets

Go to: GitHub → Settings → Secrets and variables → Actions

#### Required Secrets:

1. **RAILWAY_TOKEN**
   ```bash
   # Get your token
   railway login
   railway whoami --token
   
   # Add to GitHub
   # Name: RAILWAY_TOKEN
   # Value: <your_token>
   ```
   **Status**: [ ] RAILWAY_TOKEN added

2. **RAILWAY_PROJECT_ID** (Optional)
   ```bash
   # Get from Railway Dashboard → Project Settings
   # Or run: railway status
   
   # Name: RAILWAY_PROJECT_ID
   # Value: <project_id>
   ```
   **Status**: [ ] RAILWAY_PROJECT_ID added

#### Using GitHub CLI:
```bash
# Install GitHub CLI if not already installed
# Windows: winget install GitHub.cli
# Mac: brew install gh

# Login
gh auth login

# Add secrets
gh secret set RAILWAY_TOKEN
# Paste your token when prompted

gh secret set RAILWAY_PROJECT_ID
# Paste your project ID when prompted
```

### Step 9: Test GitHub Actions

```bash
# Make a test commit
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: trigger CI/CD pipeline"
git push origin main

# Check workflow
# Go to: GitHub → Actions tab
# You should see "Deploy to Railway" workflow running
```

**Status**: [ ] GitHub Actions workflow triggered successfully

---

## ✅ Verification Steps

### Step 10: Verify Deployment

#### 1. Check Railway Dashboard
- [ ] Build Status: ✅ Deployed
- [ ] Health Check: ✅ Passing
- [ ] Domain: ✅ Active

#### 2. Test Endpoints

```bash
# Replace YOUR_APP with your Railway domain
export APP_URL="https://your-app.railway.app"

# Health check
curl $APP_URL/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Login (test)
curl -X POST $APP_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
# Expected: {"success":true,"token":"..."}

# Feed endpoint (requires auth token from login)
curl $APP_URL/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: {"success":true,"data":{...}}
```

**Status**:
- [ ] Health check returns 200
- [ ] Login endpoint works
- [ ] Protected endpoints work with auth

#### 3. Check Logs

```bash
# Using Railway CLI
railway logs

# Or check Railway Dashboard → Deployments → Logs
```

**Status**: [ ] No critical errors in logs

#### 4. Test Core Features

Visit your deployed app and test:
- [ ] Homepage loads
- [ ] Login/Register works
- [ ] Todo CRUD works
- [ ] Feed loads
- [ ] Image upload works (Cloudinary)
- [ ] Real-time features work (Socket.io)

---

## 🔍 Troubleshooting Checklist

### If Build Fails:

- [ ] Check `package.json` has all dependencies
- [ ] Verify `next.config.ts` has `output: 'standalone'`
- [ ] Check Dockerfile syntax
- [ ] Review Railway build logs

### If App Crashes:

- [ ] Verify all environment variables are set
- [ ] Check MongoDB connection string is correct
- [ ] Verify JWT_SECRET is set
- [ ] Check Railway logs for errors
- [ ] Verify health check endpoint exists

### If Features Don't Work:

- [ ] Check Cloudinary credentials
- [ ] Verify image domains in next.config.ts
- [ ] Check CORS settings for Socket.io
- [ ] Verify Redis connection (if used)

---

## 📊 Performance Checklist

### Optimization Steps:

- [ ] Redis caching enabled
- [ ] Database indexes created
- [ ] Image optimization configured
- [ ] Console logs removed in production
- [ ] Rate limiting enabled
- [ ] GZIP compression enabled (Railway default)

---

## 🔐 Security Checklist

### Before Going Live:

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] Environment variables not hardcoded
- [ ] MongoDB has authentication enabled
- [ ] Database IP whitelist configured (0.0.0.0/0 for Railway)
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] HTTPS enabled (Railway provides by default)
- [ ] .env files in .gitignore
- [ ] Sensitive data not in logs

---

## 📈 Monitoring Setup

### Add Monitoring (Optional):

1. **Error Tracking**
   ```bash
   npm install @sentry/nextjs
   # Configure in sentry.client.config.js
   ```
   **Status**: [ ] Sentry configured

2. **Uptime Monitoring**
   - Use: [uptimerobot.com](https://uptimerobot.com) (free)
   - Monitor: Health check endpoint
   **Status**: [ ] Uptime monitoring configured

3. **Analytics**
   ```bash
   # Add Google Analytics or Vercel Analytics
   npm install @vercel/analytics
   ```
   **Status**: [ ] Analytics configured

---

## 🌐 Custom Domain (Optional)

### Step 11: Setup Custom Domain

1. [ ] Railway Dashboard → Settings → Domains
2. [ ] Click "Custom Domain"
3. [ ] Enter your domain
4. [ ] Update DNS records:
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Value: your-app.railway.app
   ```
5. [ ] Wait for DNS propagation (5-60 minutes)
6. [ ] SSL certificate auto-generated by Railway

**Status**: [ ] Custom domain configured

---

## 💾 Backup Strategy

### Setup Backups:

1. **Database Backups**
   - [ ] Enable Railway MongoDB backups (Dashboard → MongoDB → Backups)
   - [ ] Or setup automated MongoDB backups using mongodump

2. **Code Backups**
   - [ ] Git repository (already done ✅)
   - [ ] GitHub automatic backups

---

## 📚 Documentation Updates

### Update Your README:

Add deployment badges and info:

```markdown
## 🚀 Deployment

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template)

**Live Demo**: https://your-app.railway.app

### Environment Variables

See `.env.example` for required variables.

### Deploy Your Own

1. Fork this repository
2. Deploy to Railway
3. Add environment variables
4. Done! 🎉
```

**Status**: [ ] README updated

---

## ✅ Final Checklist

### Pre-deployment:
- [x] Dockerfile created
- [x] .dockerignore created
- [x] next.config.ts updated
- [ ] Health check endpoint created
- [ ] Local Docker test passed

### Railway:
- [ ] Project created
- [ ] MongoDB service added
- [ ] Redis service added (optional)
- [ ] Environment variables configured
- [ ] First deployment successful

### CI/CD:
- [x] GitHub Actions workflow created
- [ ] RAILWAY_TOKEN secret added
- [ ] Auto-deployment tested
- [ ] Build passing

### Verification:
- [ ] App accessible via Railway URL
- [ ] Health check returns 200
- [ ] Login working
- [ ] Database connected
- [ ] Images uploading
- [ ] All features working
- [ ] No errors in logs

### Production Ready:
- [ ] Custom domain configured (optional)
- [ ] Monitoring setup (optional)
- [ ] Backups enabled
- [ ] Security checklist complete
- [ ] Documentation updated

---

## 🎉 You're Done!

Once all items are checked, your app is:
- ✅ Deployed to Railway
- ✅ Accessible via HTTPS
- ✅ Automatically deploying on push
- ✅ Monitored and healthy
- ✅ Ready for production!

---

## 📞 Get Help

### If You're Stuck:

1. **Check Documentation**:
   - [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md)
   - [DOCKER-RAILWAY-DEPLOYMENT.md](./DOCKER-RAILWAY-DEPLOYMENT.md)
   - [GITHUB-ACTIONS-CICD.md](./GITHUB-ACTIONS-CICD.md)

2. **Railway Support**:
   - Discord: https://discord.gg/railway
   - Docs: https://docs.railway.app

3. **GitHub Actions**:
   - Docs: https://docs.github.com/actions

---

**Estimated Time**: 30-60 minutes
**Difficulty**: Medium
**Success Rate**: 95% with proper setup

Good luck! 🚀
