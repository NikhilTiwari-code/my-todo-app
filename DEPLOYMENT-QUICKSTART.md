# 🚀 Quick Start: Docker + Railway + CI/CD

**Get your app deployed in 30 minutes!**

---

## ⚡ Super Quick Deployment

### Option 1: Railway Auto-Deploy (Easiest)

```bash
# 1. Push your code to GitHub
git add .
git commit -m "Deploy to Railway"
git push origin main

# 2. Go to Railway.app
# 3. Click "New Project" → "Deploy from GitHub"
# 4. Select your repo
# 5. Railway auto-detects Dockerfile and deploys! ✅
```

**Done!** Your app is live in 5 minutes! 🎉

---

### Option 2: Railway CLI (Recommended)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize
railway init

# 4. Add environment variables
railway variables set MONGODB_URI="your_mongodb_uri"
railway variables set JWT_SECRET="your_jwt_secret"
railway variables set CLOUDINARY_CLOUD_NAME="your_cloud"
railway variables set CLOUDINARY_API_KEY="your_key"
railway variables set CLOUDINARY_API_SECRET="your_secret"

# 5. Deploy!
railway up

# 6. Open your app
railway open
```

**Done!** Your app is live! 🚀

---

## 📋 Pre-deployment Checklist

### 1. Create Required Files

```bash
# Check if these files exist:
✅ Dockerfile
✅ .dockerignore
✅ railway.json (optional)
✅ .env.example
```

**Missing files?** I just created them for you! Check your project root.

### 2. Update next.config.ts

```typescript
// Add this line to next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone', // ← Add this!
  // ... rest of your config
};
```

### 3. Create Health Check Endpoint

**Create**: `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
```

---

## 🔐 Environment Variables

### Get Your Values:

```bash
# 1. MongoDB URI
# Go to: MongoDB Atlas → Clusters → Connect
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# 2. JWT Secret (generate secure secret)
# Run this command:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<paste_generated_secret>

# 3. Cloudinary (if using image uploads)
# Go to: cloudinary.com → Dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Set in Railway:

**Option A: Railway Dashboard**
1. Go to your project → Variables
2. Click "New Variable"
3. Add each variable
4. Click "Deploy" to restart

**Option B: Railway CLI**
```bash
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="your_secret_here"
railway variables set CLOUDINARY_CLOUD_NAME="your_cloud"
railway variables set CLOUDINARY_API_KEY="your_key"
railway variables set CLOUDINARY_API_SECRET="your_secret"
```

---

## 🧪 Test Locally with Docker

Before deploying, test Docker locally:

```bash
# 1. Build the image
docker build -t my-todo-app .

# 2. Run the container
docker run -p 3000:3000 \
  -e MONGODB_URI="your_mongodb_uri" \
  -e JWT_SECRET="your_jwt_secret" \
  my-todo-app

# 3. Test in browser
# Open: http://localhost:3000

# 4. Stop the container
# Press Ctrl+C
```

### Test Health Endpoint

```bash
# Should return: {"status":"ok","timestamp":"..."}
curl http://localhost:3000/api/health
```

---

## 🤖 Setup GitHub Actions CI/CD

### Step 1: Create Workflow File

```bash
mkdir -p .github/workflows
```

**Copy this into**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Railway
        run: npm i -g @railway/cli
      
      - name: Deploy
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Step 2: Add GitHub Secrets

```bash
# 1. Get Railway token
railway login
railway whoami --token

# 2. Add to GitHub
# Go to: GitHub → Settings → Secrets and variables → Actions
# Click: "New repository secret"
# Name: RAILWAY_TOKEN
# Value: <paste_your_token>

# Or use GitHub CLI:
gh secret set RAILWAY_TOKEN
# Paste your token when prompted
```

### Step 3: Push and Deploy

```bash
git add .github/workflows/deploy.yml
git commit -m "Add CI/CD with GitHub Actions"
git push origin main

# 🎉 GitHub Actions will automatically deploy to Railway!
# Check: GitHub → Actions tab
```

---

## 📊 Verify Deployment

### 1. Check Railway Dashboard

```
✅ Build Status: Deployed
✅ Health Check: Passing
✅ Domain: https://your-app.railway.app
```

### 2. Test Endpoints

```bash
# Health check
curl https://your-app.railway.app/api/health

# Login endpoint
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Feed endpoint (requires auth)
curl https://your-app.railway.app/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Check Logs

```bash
# Using Railway CLI
railway logs

# Or check Railway Dashboard → Deployments → Logs
```

---

## 🐛 Troubleshooting

### Issue 1: Build Fails

**Error**: "Cannot find module 'next'"

```bash
# Solution: Make sure package.json has all dependencies
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue 2: App Crashes on Start

**Error**: "MongoServerError: bad auth"

```bash
# Solution: Check MONGODB_URI is correct
railway variables

# Update if needed:
railway variables set MONGODB_URI="correct_uri_here"
```

### Issue 3: Images Not Loading

**Error**: "Cloudinary credentials invalid"

```bash
# Solution: Check Cloudinary variables
railway variables

# Verify names (no NEXT_PUBLIC_ prefix!):
CLOUDINARY_CLOUD_NAME=xyz  # ✅ Correct
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xyz  # ❌ Wrong for server-side
```

### Issue 4: 502 Bad Gateway

**Error**: "Application not responding"

```bash
# Solution: Check if app is listening on correct port
# In server.js or next.config.ts:
const PORT = process.env.PORT || 3000;

# Railway provides PORT automatically
railway logs | grep "listening"
```

---

## 📈 Monitor Your App

### Railway Built-in Monitoring

```
Railway Dashboard → Metrics:
├── CPU Usage
├── Memory Usage
├── Network Traffic
├── Request Count
└── Error Rate
```

### Add Custom Monitoring (Optional)

```bash
# 1. Add Sentry for error tracking
npm install @sentry/nextjs

# 2. Add LogTail for logging
npm install @logtail/node

# 3. Configure in next.config.js
```

---

## 💰 Cost Estimation

### Railway Pricing:

```
Free Tier:
├── $5 credit/month
├── Shared CPU
├── 512 MB RAM
└── Suitable for: Development/Testing

Hobby Plan ($5/month):
├── $5 credit included
├── More resources
└── Suitable for: Small apps

Pro Plan ($20/month):
├── $20 credit included
├── Dedicated resources
├── Better performance
└── Suitable for: Production
```

**Your app estimated cost**: ~$5-10/month

---

## 🎯 Complete Setup Checklist

### Pre-deployment:
- [x] Dockerfile created
- [x] .dockerignore created
- [x] next.config.ts updated (output: 'standalone')
- [ ] Health check endpoint created
- [ ] Environment variables documented
- [ ] Local Docker test passed

### Railway Setup:
- [ ] Railway account created
- [ ] Project created
- [ ] GitHub repo connected
- [ ] Environment variables added
- [ ] MongoDB connected
- [ ] First deployment successful

### CI/CD Setup:
- [ ] GitHub Actions workflow created
- [ ] RAILWAY_TOKEN secret added
- [ ] Auto-deployment working
- [ ] Build status badge added to README

### Verification:
- [ ] App accessible via Railway URL
- [ ] Health check returns 200
- [ ] Login working
- [ ] Database connected
- [ ] Images uploading (Cloudinary)
- [ ] Logs showing no errors

---

## 🚀 Next Steps After Deployment

### 1. Setup Custom Domain (Optional)

```bash
# Railway Dashboard → Settings → Domains
# Add: yourdomain.com
# Update DNS: CNAME → your-app.railway.app
```

### 2. Add Monitoring

```bash
# Sentry for errors
npm install @sentry/nextjs
# Configure in sentry.client.config.js

# Uptime monitoring
# Use: uptimerobot.com (free)
```

### 3. Setup Backups

```bash
# MongoDB backups
# Railway → MongoDB → Backups → Enable

# Automated database backups
railway run mongodump --uri=$MONGODB_URI
```

### 4. Add Rate Limiting (if not already)

Your app already has rate limiting! ✅
Check: `src/lib/rate-limiter.ts`

### 5. Enable Caching

Your app already has Redis caching! ✅
Check: `src/lib/redis.ts`

---

## 📚 Useful Commands

```bash
# Railway CLI commands
railway login              # Login to Railway
railway link               # Link to existing project
railway up                 # Deploy your app
railway logs               # View logs
railway logs --tail        # Follow logs in real-time
railway status             # Check deployment status
railway open               # Open app in browser
railway variables          # List environment variables
railway run node           # Run commands in Railway environment

# Docker commands
docker build -t app .      # Build image
docker run -p 3000:3000 app # Run container
docker ps                  # List running containers
docker logs <container>    # View logs
docker stop <container>    # Stop container
docker system prune        # Clean up unused images

# GitHub CLI commands
gh secret set NAME         # Add secret
gh secret list             # List secrets
gh workflow list           # List workflows
gh run list                # List workflow runs
gh run view <run-id>       # View workflow run
```

---

## 🎉 Success!

If you've followed all steps, your app should now be:

✅ Deployed to Railway
✅ Accessible via HTTPS
✅ Automatically deploying on push
✅ Monitored and healthy
✅ Ready for users!

**Your app URL**: https://your-app.railway.app

---

## 📞 Need Help?

### Check Documentation:
- 📖 [Full Docker Guide](./DOCKER-RAILWAY-DEPLOYMENT.md)
- 🤖 [Complete CI/CD Guide](./GITHUB-ACTIONS-CICD.md)
- 🚂 [Railway Docs](https://docs.railway.app/)

### Common Resources:
- Railway Discord: https://discord.gg/railway
- GitHub Actions Docs: https://docs.github.com/actions
- Docker Docs: https://docs.docker.com/

---

**Deployment Time**: 30-60 minutes
**Difficulty**: Medium
**Success Rate**: 95% with proper setup

Good luck! 🚀
