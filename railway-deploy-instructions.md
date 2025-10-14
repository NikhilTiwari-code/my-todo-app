# Railway Deployment Instructions

## Easy Way - No CLI Needed

### Step 1: Create Empty Project on Railway
1. Go to https://railway.app
2. Click "New Project"
3. Select "Empty Project"

### Step 2: Add Service
1. Click "+ New"
2. Select "Empty Service"

### Step 3: Connect GitHub Repository
1. In your new service, go to Settings tab
2. Click "Source" section
3. Click "Connect Repo"
4. Authorize GitHub if asked
5. Select "NikhilTiwari-code/my-todo-app"
6. Root Directory: `/` (leave default)

### Step 4: Configure Settings
In Settings tab:
- **Start Command**: `node socket-server.js`
- **Build Command**: Leave empty (no build needed)

### Step 5: Add Environment Variables
Go to Variables tab and add:
```
MONGODB_URI=mongodb+srv://nikhiltiwari0190_db_user:n5CqcBvu3EvQjHzc@cluster0.n3o1z6v.mongodb.net/todo-app?retryWrites=true&w=majority

JWT_SECRET=8f3d9a2b7c1e4f6a5d8b9c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a

FRONTEND_URL=https://my-todo-app-gilt.vercel.app

NODE_ENV=production
```

### Step 6: Deploy
Railway will automatically deploy!

### Step 7: Get Your URL
- Go to Settings tab
- Under "Networking" section
- Click "Generate Domain"
- Copy the URL (e.g., `your-app.up.railway.app`)

### Step 8: Update Vercel
1. Go to Vercel dashboard
2. Settings > Environment Variables
3. Add: `NEXT_PUBLIC_SOCKET_URL=https://your-railway-url.up.railway.app`
4. Redeploy

---

## Alternative: Using Railway CLI

If you want to use CLI:

```powershell
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to project
railway link

# Add environment variables
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="8f3d9a2b7c1e4f6a5d8b9c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a"
railway variables set FRONTEND_URL="https://my-todo-app-gilt.vercel.app"
railway variables set NODE_ENV="production"

# Deploy
railway up
```

---

## Troubleshooting

### GitHub Repo Not Showing?
1. Make sure your GitHub account is connected to Railway
2. Go to https://github.com/settings/installations
3. Find "Railway" and configure access
4. Grant access to "NikhilTiwari-code/my-todo-app" repository

### Deployment Failing?
Check the logs in Railway dashboard:
- Click on your service
- Go to "Deployments" tab
- Click on latest deployment
- Check logs for errors
