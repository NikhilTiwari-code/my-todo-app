# 🐳 Docker Deployment Guide for Railway

**Deploy your Next.js app with authentication to Railway using Docker**

---

## 📋 Table of Contents

1. [Dockerfile Setup](#dockerfile-setup)
2. [Docker Compose (Local Testing)](#docker-compose)
3. [Railway Configuration](#railway-configuration)
4. [Environment Variables](#environment-variables)
5. [Deployment Steps](#deployment-steps)

---

## 🐳 Dockerfile Setup

### Create Dockerfile

**Create**: `Dockerfile` in project root

```dockerfile
# syntax=docker/dockerfile:1

# ========================
# Stage 1: Dependencies
# ========================
FROM node:20-alpine AS deps

# Install libc6-compat for compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# ========================
# Stage 2: Builder
# ========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app
RUN npm run build

# ========================
# Stage 3: Runner
# ========================
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
```

---

## 📝 Update next.config.ts

Add standalone output for Docker:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Existing image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Disable telemetry in production
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
};

export default nextConfig;
```

---

## 🔧 Create .dockerignore

**Create**: `.dockerignore` in project root

```
# Dependencies
node_modules
npm-debug.log
yarn-error.log

# Next.js
.next
out
dist

# Testing
coverage
.jest

# Environment files
.env
.env.local
.env*.local

# Git
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Documentation
*.md
!README.md

# Logs
logs
*.log

# Other
.prettierrc
.eslintrc.json
```

---

## 🐳 Docker Compose (Local Testing)

**Create**: `docker-compose.yml` for local testing

```yaml
version: '3.8'

services:
  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
      - SOCKET_PORT=3001
    depends_on:
      - redis
    networks:
      - app-network
    restart: unless-stopped

  # Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - app-network
    restart: unless-stopped
    command: redis-server --appendonly yes

  # MongoDB (optional - use if you want local DB)
  # Uncomment if you want to run MongoDB locally
  # mongodb:
  #   image: mongo:7
  #   ports:
  #     - "27017:27017"
  #   environment:
  #     - MONGO_INITDB_ROOT_USERNAME=admin
  #     - MONGO_INITDB_ROOT_PASSWORD=password
  #   volumes:
  #     - mongo-data:/data/db
  #   networks:
  #     - app-network
  #   restart: unless-stopped

volumes:
  redis-data:
  # mongo-data:

networks:
  app-network:
    driver: bridge
```

---

## 🚂 Railway Configuration

### Option 1: Using Dockerfile (Recommended)

Railway automatically detects and uses your Dockerfile.

**Create**: `railway.json` in project root

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  }
}
```

### Option 2: Using Nixpacks (Alternative)

If you prefer Nixpacks instead of Docker:

**Update**: `nixpacks.json`

```json
{
  "phases": {
    "setup": {
      "nixPkgs": ["nodejs-20_x", "python3"]
    },
    "install": {
      "cmds": ["npm ci"]
    },
    "build": {
      "cmds": ["npm run build"]
    }
  },
  "start": {
    "cmd": "node server.js"
  },
  "staticAssets": {
    "output": [".next/static", "public"]
  }
}
```

---

## 🔐 Environment Variables

### Railway Environment Variables Setup

Go to Railway Dashboard → Your Project → Variables → Add:

```env
# Application
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars

# Redis (Railway Redis Plugin)
REDIS_URL=${{Redis.REDIS_URL}}

# Cloudinary
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

### Generate Secure JWT Secret

```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Your Code

```bash
# 1. Create Dockerfile (see above)
# 2. Create .dockerignore (see above)
# 3. Update next.config.ts (add output: 'standalone')
# 4. Commit changes
git add Dockerfile .dockerignore next.config.ts railway.json
git commit -m "Add Docker configuration for Railway deployment"
git push origin main
```

### Step 2: Create Railway Project

**Option A: Using Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to your repo
railway link

# Deploy
railway up
```

**Option B: Using Railway Dashboard**

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway auto-detects Dockerfile
6. Click "Deploy"

### Step 3: Add Database Services

**Add MongoDB:**
1. Railway Dashboard → Add Service
2. Select "MongoDB"
3. Copy connection string to `MONGODB_URI` variable

**Add Redis:**
1. Railway Dashboard → Add Service
2. Select "Redis"
3. Use reference: `${{Redis.REDIS_URL}}`

### Step 4: Configure Environment Variables

1. Go to Variables tab
2. Add all variables from the list above
3. Click "Deploy" to restart with new variables

### Step 5: Setup Custom Domain (Optional)

1. Railway Dashboard → Settings → Domains
2. Click "Generate Domain" or add custom domain
3. Update DNS records if using custom domain

---

## 🧪 Local Docker Testing

Test your Docker setup locally before deploying:

```bash
# Build the image
docker build -t my-todo-app .

# Run the container
docker run -p 3000:3000 \
  -e MONGODB_URI="your_mongodb_uri" \
  -e JWT_SECRET="your_jwt_secret" \
  -e CLOUDINARY_CLOUD_NAME="your_cloud_name" \
  -e CLOUDINARY_API_KEY="your_api_key" \
  -e CLOUDINARY_API_SECRET="your_api_secret" \
  my-todo-app

# Or use docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop containers
docker-compose down
```

### Test Health Endpoint

```bash
# Should return { status: 'ok' }
curl http://localhost:3000/api/health
```

---

## 🔍 Troubleshooting

### Issue 1: Build Fails

**Error**: "Cannot find module 'next'"

**Solution**:
```bash
# Make sure package.json has correct dependencies
npm install next@15.5.4 react@19.1.0 react-dom@19.1.0
```

### Issue 2: Server Won't Start

**Error**: "Address already in use"

**Solution**:
```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Issue 3: Environment Variables Not Loading

**Solution**:
```typescript
// Add validation in server.js or app startup
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME'
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});
```

### Issue 4: MongoDB Connection Fails

**Error**: "MongoServerError: Authentication failed"

**Solution**:
- Check MONGODB_URI is correct
- Whitelist Railway IP (0.0.0.0/0 for all IPs)
- Verify database user has correct permissions

### Issue 5: Image Upload Fails

**Error**: "Cloudinary credentials invalid"

**Solution**:
```bash
# Verify variables are set in Railway
railway variables

# Check variable names (no NEXT_PUBLIC_ prefix for server-side)
CLOUDINARY_CLOUD_NAME=xyz  # ✅
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xyz  # ❌ Wrong
```

---

## 📊 Performance Optimization

### 1. Enable Next.js Cache

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  
  // Enable SWC minification
  swcMinify: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

### 2. Multi-stage Build Benefits

```
Original Size:  ~500MB
After Multi-stage: ~150MB (70% reduction!)
```

### 3. Railway Scaling

```yaml
# In Railway Dashboard → Settings → Service
Resources:
  CPU: 1 vCPU (512MB RAM) - Free tier
  Auto-scaling: Up to 2 instances
  
Estimated Cost: $5-10/month (if exceeding free tier)
```

---

## 🔐 Security Checklist

Before deploying:

- [ ] JWT_SECRET is strong (32+ random characters)
- [ ] Environment variables are set (not hardcoded)
- [ ] MongoDB has authentication enabled
- [ ] Database IP whitelist configured
- [ ] CORS configured for your domain
- [ ] Rate limiting enabled
- [ ] HTTPS enabled (Railway provides by default)
- [ ] Sensitive data not in logs
- [ ] .env files in .gitignore
- [ ] Docker runs as non-root user

---

## 📈 Monitoring

### Add Health Check Endpoint

**Create**: `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: 'unknown',
      },
    };

    // Check Redis
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.ping();
        health.services.redis = 'connected';
      } catch {
        health.services.redis = 'disconnected';
      }
    }

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 503 }
    );
  }
}
```

### Railway Logging

```bash
# View logs in real-time
railway logs

# View logs for specific service
railway logs --service <service-name>
```

---

## 🚀 Quick Deployment Commands

```bash
# Full deployment workflow
git add .
git commit -m "Deploy to Railway"
git push origin main

# Railway auto-deploys on push to main

# Check deployment status
railway status

# View logs
railway logs

# Open deployed app
railway open
```

---

## 📚 Additional Resources

### Railway Documentation:
- [Railway Docs](https://docs.railway.app/)
- [Dockerfile Deployment](https://docs.railway.app/deploy/dockerfiles)
- [Environment Variables](https://docs.railway.app/develop/variables)

### Docker Documentation:
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Next.js Dockerfile](https://nextjs.org/docs/deployment#docker-image)

### Next.js Deployment:
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
- [Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)

---

## ✅ Deployment Checklist

### Pre-deployment:
- [ ] Dockerfile created
- [ ] .dockerignore created
- [ ] next.config.ts updated (output: 'standalone')
- [ ] railway.json configured
- [ ] Local Docker test passed
- [ ] Environment variables documented

### Railway Setup:
- [ ] Railway account created
- [ ] GitHub repo connected
- [ ] Project created
- [ ] MongoDB service added
- [ ] Redis service added (optional)
- [ ] Environment variables configured

### Post-deployment:
- [ ] Health check endpoint working
- [ ] Authentication working
- [ ] Database connected
- [ ] Redis connected (if used)
- [ ] Image uploads working (Cloudinary)
- [ ] Custom domain configured (optional)
- [ ] Monitoring setup
- [ ] Backup strategy defined

---

**Estimated Deployment Time**: 30-60 minutes

**Cost**: Free tier available (limited resources), ~$5-10/month for production

**Success Rate**: 95%+ with proper configuration

Good luck with your deployment! 🚀
