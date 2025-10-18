# ✅ Trending Feature - Installation Checklist

## 📋 Pre-Installation

- [x] All 26+ files created successfully
- [x] Code follows best practices
- [x] TypeScript types properly defined
- [x] Comments added for clarity
- [x] Error handling implemented
- [x] Security measures in place

## 🔧 Installation Steps

### 1. Dependencies
```bash
npm install node-cron axios
```

**Check if already installed:**
```bash
npm list node-cron axios socket.io socket.io-client
```

**Expected output:**
```
├── axios@X.X.X
├── node-cron@X.X.X
├── socket.io@X.X.X
└── socket.io-client@X.X.X
```

### 2. Environment Variables

Add to `.env.local`:
```env
# External APIs (Optional)
NEWS_API_KEY=your_newsapi_key
YOUTUBE_API_KEY=your_youtube_api_key
ADMIN_API_KEY=your_secret_admin_key

# Required (should already exist)
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional but recommended
REDIS_URL=your_redis_url
```

**Verification:**
- [ ] `.env.local` file exists
- [ ] MONGODB_URI is set
- [ ] JWT_SECRET is set
- [ ] NEXT_PUBLIC_APP_URL is set

### 3. Database Setup

**MongoDB Indexes (Auto-created on first use):**
- [ ] `trending_topics` collection will be created
- [ ] `search_history` collection will be created
- [ ] `hashtag_stats` collection will be created
- [ ] Text indexes will be created automatically
- [ ] TTL indexes will be set up

**Manual verification (optional):**
```javascript
// In MongoDB shell
use your_database
db.trending_topics.getIndexes()
```

### 4. Start Server

```bash
npm run dev
```

**Check console for:**
- [ ] `✅ Trending cron job started (runs every 30 minutes)`
- [ ] `✅ Daily hashtag reset cron job started (midnight UTC)`
- [ ] `✅ Weekly hashtag reset cron job started (Monday midnight UTC)`
- [ ] `> Ready on http://localhost:3000`
- [ ] `> Socket.io server running`

## 🧪 Testing Checklist

### Basic Functionality

#### 1. UI Access
- [ ] Navigate to http://localhost:3000/trending
- [ ] Page loads without errors
- [ ] Search bar is visible
- [ ] Category tabs are visible
- [ ] No console errors

#### 2. API Endpoints
- [ ] GET http://localhost:3000/api/trending returns JSON
- [ ] GET http://localhost:3000/api/search?q=test works
- [ ] GET http://localhost:3000/api/search/popular works
- [ ] GET http://localhost:3000/api/hashtags/trending works

#### 3. Search Functionality
- [ ] Type in search bar
- [ ] Suggestions appear (after data is fetched)
- [ ] Can select suggestion
- [ ] Recent searches stored in localStorage
- [ ] Popular searches load from API

#### 4. Category Filtering
- [ ] Click "News" tab → filters to news
- [ ] Click "Tech" tab → filters to tech
- [ ] Click "All" tab → shows all categories
- [ ] Active tab is highlighted
- [ ] Transitions are smooth

#### 5. Trending Cards
- [ ] Cards display properly (after data fetch)
- [ ] Images load correctly
- [ ] Rank badges show (#1, #2, etc.)
- [ ] Category badges have correct colors
- [ ] External links work
- [ ] Time ago is displayed

### Advanced Features

#### 6. Manual Data Fetch
```bash
curl -X POST http://localhost:3000/api/trending \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your_admin_key", "categories": ["tech", "crypto"]}'
```

- [ ] Returns success response
- [ ] Data appears in database
- [ ] UI updates with new data
- [ ] Console shows fetch logs

#### 7. Cron Jobs (Production Only)
- [ ] Set NODE_ENV=production
- [ ] Restart server
- [ ] Check console for cron logs
- [ ] Wait 30 minutes for auto-update
- [ ] Verify data refreshes automatically

#### 8. Socket.io (Optional)
- [ ] Open browser DevTools → Console
- [ ] Look for "✅ Connected to Socket.io"
- [ ] Trigger manual update
- [ ] Check for "📡 Trending update received"
- [ ] UI should auto-refresh

#### 9. Redis Caching (If Redis is set up)
- [ ] First request: "❌ Cache MISS"
- [ ] Second request: "✅ Cache HIT"
- [ ] Response time improves significantly

#### 10. Search History
- [ ] Perform a search
- [ ] GET /api/search/history
- [ ] Search should appear in history
- [ ] Recent searches show in dropdown

## 🔍 Verification Commands

### Check Files Created
```bash
# Models
ls src/models/trending.model.ts
ls src/models/searchHistory.model.ts
ls src/models/hashtagStats.model.ts

# APIs
ls src/lib/external-apis/*.ts

# Routes
ls src/app/api/trending/route.ts
ls src/app/api/search/route.ts

# Components
ls src/components/trending/*.tsx

# Page
ls src/app/\(dashboard\)/trending/page.tsx
```

### Check MongoDB Collections
```javascript
use your_database
show collections
// Should see: trending_topics, search_history, hashtag_stats
```

### Check Server Logs
Look for these in console:
```
✅ Trending cron job started
✅ Daily hashtag reset cron job started
✅ Weekly hashtag reset cron job started
> Ready on http://localhost:3000
> Socket.io server running
```

### Test API Responses
```bash
# Trending
curl http://localhost:3000/api/trending | jq

# Search
curl "http://localhost:3000/api/search?q=javascript" | jq

# Popular searches
curl http://localhost:3000/api/search/popular | jq

# Hashtags
curl http://localhost:3000/api/hashtags/trending | jq
```

## 🐛 Troubleshooting

### Issue: Module not found
**Fix:**
```bash
npm install node-cron axios
# Restart dev server
npm run dev
```

### Issue: MongoDB connection failed
**Fix:**
- [ ] Check MONGODB_URI in .env.local
- [ ] Verify MongoDB is running
- [ ] Test connection with mongosh

### Issue: No trending data
**Fix:**
```bash
# Manually trigger fetch
curl -X POST http://localhost:3000/api/trending \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your_admin_key", "categories": ["tech"]}'
```

### Issue: Search not working
**Fix:**
- [ ] Ensure MongoDB text indexes exist
- [ ] Check if data exists in database
- [ ] Verify query is at least 2 characters

### Issue: Cron jobs not running
**Fix:**
- [ ] Set NODE_ENV=production
- [ ] Check server.js for cron initialization
- [ ] Verify cron syntax is correct
- [ ] Check console for error logs

### Issue: Socket.io not connecting
**Fix:**
- [ ] Check JWT token in localStorage
- [ ] Verify NEXT_PUBLIC_APP_URL
- [ ] Check CORS settings
- [ ] Look for errors in browser console

## 📊 Performance Checklist

- [ ] API response time < 500ms
- [ ] Page loads in < 2 seconds
- [ ] Search suggestions appear < 300ms
- [ ] Images lazy load properly
- [ ] No memory leaks
- [ ] No console errors
- [ ] Responsive on all devices

## 🔒 Security Checklist

- [ ] ADMIN_API_KEY is secret and secure
- [ ] JWT_SECRET is not exposed
- [ ] API keys are in .env.local (not committed)
- [ ] Authentication required for search history
- [ ] Input validation on all endpoints
- [ ] No sensitive data in console logs
- [ ] CORS properly configured
- [ ] Rate limiting considered

## 📈 Production Readiness

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Environment variables documented
- [ ] API keys obtained
- [ ] Redis configured (optional)
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Performance optimized
- [ ] Documentation complete

## ✅ Final Verification

### Quick Test Script
```bash
# 1. Test API
curl http://localhost:3000/api/trending

# 2. Check response
# Should see: {"success": true, "data": {...}}

# 3. Open UI
open http://localhost:3000/trending

# 4. Verify page loads without errors
```

### Success Criteria
- ✅ All 26+ files created
- ✅ Dependencies installed
- ✅ Server starts without errors
- ✅ API endpoints respond correctly
- ✅ UI loads and is functional
- ✅ Search works
- ✅ Categories filter properly
- ✅ No console errors

## 🎉 Installation Complete!

If all items are checked, your trending feature is:
- ✅ Fully installed
- ✅ Properly configured
- ✅ Tested and working
- ✅ Production-ready

**Next steps:**
1. Get API keys for external sources
2. Set up Redis for caching (optional)
3. Configure monitoring
4. Deploy to production

**Documentation:**
- Quick Start: `QUICK-START.md`
- Full Setup: `TRENDING-SETUP.md`
- Complete Guide: `TRENDING-README.md`

---

**🔥 Congratulations! Your Twitter/X-style trending feature is ready to use! 🔥**

**Access at:** http://localhost:3000/trending
