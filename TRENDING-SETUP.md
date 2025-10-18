# 🔥 Trending Feature - Setup & Configuration Guide

## 📋 Overview

This trending feature implements a Twitter/X-style trending and search system with:
- External API integration (NewsAPI, YouTube, Reddit, Hacker News, CoinGecko)
- Real-time updates via Socket.io
- MongoDB storage with TTL indexes
- Redis caching for performance
- Automated cron jobs for data updates
- Universal search across all content types

## 🚀 Installation

### 1. Install Required Dependencies

```bash
npm install node-cron axios socket.io socket.io-client
```

### 2. Environment Variables

Create or update your `.env.local` file with the following variables:

```env
# ===== DATABASE =====
MONGODB_URI=your_mongodb_connection_string

# ===== REDIS (Optional but recommended) =====
REDIS_URL=your_redis_url
# Or
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# ===== EXTERNAL APIS =====

# NewsAPI (Free tier: 100 requests/day)
# Get your key from: https://newsapi.org/
NEWS_API_KEY=your_newsapi_key

# YouTube Data API (Free tier: 10,000 units/day)
# Get your key from: https://console.cloud.google.com/
YOUTUBE_API_KEY=your_youtube_api_key

# No API keys required for:
# - Reddit (uses public JSON API)
# - Hacker News (completely free)
# - CoinGecko (free tier: 10-50 calls/minute)

# ===== ADMIN =====
# For manually triggering trending updates
ADMIN_API_KEY=your_secret_admin_key

# ===== APP =====
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
```

## 📁 File Structure

```
src/
├── models/
│   ├── trending.model.ts         # Trending topics schema
│   ├── searchHistory.model.ts    # User search history
│   └── hashtagStats.model.ts     # Hashtag statistics
│
├── lib/
│   ├── external-apis/
│   │   ├── newsapi.ts            # NewsAPI integration
│   │   ├── youtube.ts            # YouTube Data API
│   │   ├── reddit.ts             # Reddit JSON API
│   │   ├── hackernews.ts         # Hacker News API
│   │   ├── coingecko.ts          # CoinGecko API
│   │   └── aggregator.ts         # Combines all sources
│   │
│   ├── cron/
│   │   ├── trending-updater.ts   # Trending data cron job
│   │   └── hashtag-reset.ts      # Hashtag counter resets
│   │
│   ├── socket/
│   │   └── trending-socket.ts    # Socket.io real-time updates
│   │
│   └── cache/
│       └── trending-cache.ts     # Redis caching layer
│
├── app/
│   ├── api/
│   │   ├── trending/route.ts     # GET /api/trending
│   │   ├── search/route.ts       # GET /api/search
│   │   ├── search/history/route.ts
│   │   ├── search/popular/route.ts
│   │   └── hashtags/trending/route.ts
│   │
│   └── (dashboard)/
│       └── trending/page.tsx     # Trending page UI
│
├── components/
│   └── trending/
│       ├── TrendingCard.tsx      # Individual trending card
│       ├── SearchBar.tsx         # Universal search bar
│       └── CategoryTabs.tsx      # Category filter tabs
│
└── hooks/
    └── useTrendingSocket.ts      # Socket.io React hook
```

## 🎯 API Endpoints

### Trending

```bash
# Get all trending topics
GET /api/trending

# Get trending by category
GET /api/trending?category=news
GET /api/trending?category=youtube
GET /api/trending?category=tech
GET /api/trending?category=crypto

# Pagination
GET /api/trending?category=news&page=1&limit=20

# Manually trigger update (requires ADMIN_API_KEY)
POST /api/trending
{
  "apiKey": "your_admin_key",
  "categories": ["news", "youtube", "tech", "crypto"]
}
```

### Search

```bash
# Universal search
GET /api/search?q=keyword

# Search by type
GET /api/search?q=keyword&type=users
GET /api/search?q=keyword&type=posts
GET /api/search?q=keyword&type=trending
GET /api/search?q=keyword&type=hashtags

# Clear search history
DELETE /api/search
```

### Search History

```bash
# Get user's recent searches
GET /api/search/history?limit=10

# Get popular searches
GET /api/search/popular?hours=24&limit=10
```

### Hashtags

```bash
# Get trending hashtags
GET /api/hashtags/trending?category=tech&limit=10
```

## ⚙️ Configuration

### Cron Jobs

The cron jobs are configured in `server.js` and run automatically in production:

1. **Trending Updater** - Runs every 30 minutes
   - Fetches data from all external APIs
   - Updates database with new trending topics
   - Emits Socket.io updates to connected clients

2. **Hashtag Daily Reset** - Runs at midnight UTC
   - Resets `todayCount` for all hashtags

3. **Hashtag Weekly Reset** - Runs every Monday at midnight UTC
   - Resets `weekCount` for all hashtags

### MongoDB Indexes

The models automatically create these indexes:
- `expiresAt` - TTL index for auto-deletion (24 hours)
- `category` + `rank` - Fast category filtering
- `category` + `score` - Sorting by score
- Full-text search on `title` and `description`

### Redis Caching

Cache TTLs:
- Trending data: 5 minutes
- Search results: 2 minutes
- Trending stats: 10 minutes

## 🧪 Testing

### 1. Test API Endpoints

```bash
# Test trending endpoint
curl http://localhost:3000/api/trending

# Test search endpoint
curl http://localhost:3000/api/search?q=javascript

# Test popular searches
curl http://localhost:3000/api/search/popular
```

### 2. Manual Trending Update

```bash
curl -X POST http://localhost:3000/api/trending \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_admin_key",
    "categories": ["news", "tech"]
  }'
```

### 3. Access the UI

Navigate to: `http://localhost:3000/trending`

## 🎨 UI Features

### Trending Page
- **Category Tabs**: Switch between All, News, YouTube, Tech, Crypto, etc.
- **Real-time Updates**: Auto-refreshes when new data is available
- **Responsive Grid**: Adapts to screen size (1/2/3 columns)
- **Search Integration**: Universal search bar at the top

### Trending Cards
- Displays rank, title, image, category badge
- Shows engagement metrics (views, likes, comments)
- Time ago indicator
- External link to source

### Search Bar
- Live search suggestions
- Recent searches (stored in localStorage)
- Popular/trending searches
- Searches across: users, posts, trending, hashtags

## 📊 Data Flow

```
1. Cron Job triggers (every 30 minutes)
   ↓
2. Aggregator fetches from external APIs
   ↓
3. Data saved to MongoDB with rankings
   ↓
4. Socket.io emits update event
   ↓
5. Connected clients receive update
   ↓
6. UI auto-refreshes with new data
```

## 🔒 Security

1. **Admin Endpoint**: POST /api/trending requires ADMIN_API_KEY
2. **Rate Limiting**: Implement rate limiting on search endpoints
3. **Authentication**: Search history requires user authentication
4. **CORS**: Socket.io configured with proper CORS settings

## 🐛 Troubleshooting

### Issue: Trending data not updating

**Solution:**
1. Check if cron jobs are running: Look for console logs
2. Verify API keys are set correctly
3. Check external API rate limits
4. Manually trigger update via POST /api/trending

### Issue: Search not working

**Solution:**
1. Ensure text indexes are created on models
2. Check MongoDB connection
3. Verify search query is at least 2 characters

### Issue: Socket.io not connecting

**Solution:**
1. Verify JWT token is valid
2. Check Socket.io CORS configuration
3. Ensure server.js is properly configured
4. Check browser console for connection errors

### Issue: Redis caching errors

**Solution:**
1. Make Redis optional (code handles errors gracefully)
2. Verify REDIS_URL or REDIS_HOST/PORT
3. Check Redis server is running
4. Disable caching temporarily by not calling cache functions

## 📈 Performance Tips

1. **Enable Redis**: Significantly reduces database queries
2. **Pagination**: Use page and limit parameters
3. **Category Filtering**: Fetch specific categories instead of all
4. **Debouncing**: Already implemented in SearchBar component
5. **CDN**: Serve images through CDN for faster loading

## 🚀 Deployment

### Production Checklist

- [ ] Set all environment variables
- [ ] Enable Redis for caching
- [ ] Set up MongoDB indexes
- [ ] Configure proper CORS
- [ ] Enable rate limiting
- [ ] Set up monitoring for cron jobs
- [ ] Test Socket.io connections
- [ ] Verify external API keys work
- [ ] Set reasonable cache TTLs
- [ ] Enable production logging

## 📝 Notes

- **Free Tier Limits**: Be aware of API rate limits
  - NewsAPI: 100 requests/day
  - YouTube: 10,000 units/day
  - Reddit: Rate limited per IP
  - Hacker News: No limits
  - CoinGecko: 10-50 calls/minute

- **Data Expiration**: Trending data auto-deletes after 24 hours

- **Cron Jobs**: Only run in production mode by default
  - To test locally, remove the `if (!dev)` check in server.js

- **Search History**: Auto-expires after 30 days

## 🎉 Success!

If everything is set up correctly, you should see:
- ✅ Trending page at `/trending`
- ✅ Data updating every 30 minutes
- ✅ Real-time Socket.io updates (if configured)
- ✅ Fast search with suggestions
- ✅ Redis caching working

Enjoy your Twitter/X-style trending feature! 🔥
