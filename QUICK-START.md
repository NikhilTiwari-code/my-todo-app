# 🚀 Trending Feature - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (30 seconds)

```bash
npm install node-cron axios
```

### Step 2: Add Environment Variables (1 minute)

Open your `.env.local` and add these lines:

```env
# External APIs (All Optional - features work without them)
NEWS_API_KEY=your_key_here
YOUTUBE_API_KEY=your_key_here
ADMIN_API_KEY=make_up_a_secret_key

# Already have these (just verify they exist)
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional but recommended for caching
REDIS_URL=your_redis_url
```

**Don't have API keys?** No problem! The feature works with free APIs:
- ✅ Reddit (no key needed)
- ✅ Hacker News (no key needed)
- ✅ CoinGecko (no key needed)

### Step 3: Start the Server (10 seconds)

```bash
npm run dev
```

### Step 4: Test It! (2 minutes)

**Option 1: Visit the UI**
Open: http://localhost:3000/trending

**Option 2: Test the API**
Open: http://localhost:3000/api/trending

**Option 3: Manual Data Fetch**
```bash
curl -X POST http://localhost:3000/api/trending \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your_admin_key", "categories": ["tech"]}'
```

## ✅ What You Should See

### In Your Browser (http://localhost:3000/trending)
- ✅ Trending page with category tabs
- ✅ Search bar at the top
- ✅ Trending cards (if data is fetched)
- ✅ "No trending topics yet" message (if no data yet)

### In Your Terminal
```
✅ Trending cron job started (runs every 30 minutes)
✅ Daily hashtag reset cron job started (midnight UTC)
✅ Weekly hashtag reset cron job started (Monday midnight UTC)
> Ready on http://localhost:3000
```

### In API Response
```json
{
  "success": true,
  "data": {
    "news": [...],
    "youtube": [...],
    "tech": [...],
    "crypto": [...]
  }
}
```

## 🎉 Success Indicators

| ✅ Indicator | What It Means |
|------------|---------------|
| Page loads at `/trending` | UI is working |
| Search bar shows suggestions | Search API is connected |
| Category tabs are clickable | State management works |
| Trending cards display | Data is fetched & displayed |
| API returns `{"success": true}` | Backend is working |
| Console shows cron logs | Automation is running |

## 🐛 Troubleshooting

### Issue: "Cannot find module 'node-cron'"
**Fix:**
```bash
npm install node-cron axios
```

### Issue: No trending data showing
**Fix:**
```bash
# Manually trigger data fetch
curl -X POST http://localhost:3000/api/trending \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your_admin_key", "categories": ["tech", "crypto"]}'
```

### Issue: Search not working
**Fix:** MongoDB text indexes might be missing. They'll be created automatically on first use, but you can create them manually:
```javascript
// In MongoDB shell or Compass
db.trending_topics.createIndex({ title: "text", description: "text" })
```

### Issue: Cron jobs not running
**Fix:** Cron jobs only run in production. For development, manually trigger updates via API.

### Issue: "Module not found" errors
**Fix:** Restart your dev server:
```bash
# Press Ctrl+C to stop, then:
npm run dev
```

## 📱 Next Actions

### 1. Get API Keys (Optional)

**NewsAPI** (100 free requests/day)
1. Go to: https://newsapi.org/
2. Sign up for free
3. Copy your API key
4. Add to `.env.local`: `NEWS_API_KEY=your_key`

**YouTube Data API** (10,000 free units/day)
1. Go to: https://console.cloud.google.com/
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials → API key
5. Add to `.env.local`: `YOUTUBE_API_KEY=your_key`

### 2. Test All Features

**Search:**
1. Go to `/trending`
2. Type "javascript" in search bar
3. Should see suggestions

**Categories:**
1. Click "Tech" tab
2. Should filter to tech topics
3. Click "News" tab
4. Should filter to news

**Manual Update:**
```bash
curl -X POST http://localhost:3000/api/trending \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your_admin_key", "categories": ["news", "tech", "crypto"]}'
```

### 3. Check MongoDB

```bash
# Using mongosh
mongosh "your_mongodb_uri"

# Check trending topics
use your_database_name
db.trending_topics.find().limit(5)

# Check indexes
db.trending_topics.getIndexes()
```

## 🎨 Customization

### Change Update Frequency

Edit `src/lib/cron/trending-updater.ts`:
```typescript
// Current: Every 30 minutes
cron.schedule('0,30 * * * *', ...)

// Every 15 minutes
cron.schedule('*/15 * * * *', ...)

// Every hour
cron.schedule('0 * * * *', ...)
```

### Add More Categories

Edit `src/components/trending/CategoryTabs.tsx`:
```typescript
const categories = [
  // ... existing categories
  { id: 'gaming', label: 'Gaming', icon: Gamepad },
];
```

### Change Cache Duration

Edit `src/lib/cache/trending-cache.ts`:
```typescript
const CACHE_TTL = 300; // 5 minutes (default)
// Change to:
const CACHE_TTL = 600; // 10 minutes
```

## 📊 Monitor Performance

### Check Cache Hit Rate
```bash
# Look for these logs in console:
✅ Cache HIT for tech
❌ Cache MISS for news
```

### Check Cron Job Execution
```bash
# Look for these logs every 30 minutes:
🔄 Fetching trending data for: news, youtube, tech, crypto
✅ Trending update completed in 5.23s
✅ Saved 87 trending items to database
```

### Check API Response Time
```bash
# Without cache: ~200-500ms
# With cache: ~10-50ms
time curl http://localhost:3000/api/trending
```

## 🚀 Production Deployment

Before deploying to production:

1. ✅ Set `NODE_ENV=production`
2. ✅ Add all API keys to environment
3. ✅ Set up Redis for caching
4. ✅ Configure CORS properly
5. ✅ Set up monitoring for cron jobs
6. ✅ Test Socket.io connections
7. ✅ Verify MongoDB indexes
8. ✅ Enable rate limiting

## 📚 Documentation

- **Full Setup:** See `TRENDING-SETUP.md`
- **Complete Guide:** See `TRENDING-README.md`
- **API Docs:** See API section in `TRENDING-README.md`

## 🎉 You're All Set!

Your trending feature is now:
- ✅ Fully installed
- ✅ Properly configured
- ✅ Ready to use
- ✅ Production-ready

**Access it at:** http://localhost:3000/trending

---

**Need help?** Check the full documentation in `TRENDING-SETUP.md`

**Want to understand the code?** Check `TRENDING-README.md`

**Ready to deploy?** Follow the production checklist above!

🔥 **Enjoy your Twitter/X-style trending feature!** 🔥
