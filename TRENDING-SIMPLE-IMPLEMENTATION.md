# 🚀 Simple Trending Feature - FREE APIs Implementation

## 🎯 Goal: Simple Global Trending with Free Real Data

- **Update Frequency:** Every 1 hour
- **Scope:** Global trends
- **Algorithm:** Simple post count based
- **Timeline:** Quick implementation

---

## 🆓 FREE API Options (Real Data Sources)

### 1. **NewsAPI.org** ✅ RECOMMENDED
```
URL: https://newsapi.org/
Free Tier: 100 requests/day
Features: 
  - Top headlines
  - Everything search
  - 80+ countries
  - 50+ languages
  - News from 150,000+ sources

Perfect For: Politics, World News, Business, Sports
```

**How to Get:**
1. Go to: https://newsapi.org/register
2. Sign up (email only)
3. Get instant API key
4. Free forever (100 requests/day)

**Example Request:**
```bash
GET https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_API_KEY
```

**Example Response:**
```json
{
  "status": "ok",
  "totalResults": 38,
  "articles": [
    {
      "source": { "id": "cnn", "name": "CNN" },
      "author": "John Doe",
      "title": "Breaking: Election Results",
      "description": "Major update in elections...",
      "url": "https://cnn.com/article",
      "urlToImage": "https://image.jpg",
      "publishedAt": "2025-10-18T10:30:00Z"
    }
  ]
}
```

---

### 2. **YouTube Data API v3** ✅ RECOMMENDED
```
URL: https://console.cloud.google.com/
Free Tier: 10,000 units/day (≈100 requests)
Features:
  - Trending videos
  - Search videos
  - Video statistics
  - Categories

Perfect For: Music, Entertainment, YouTube Trending
```

**How to Get:**
1. Go to: https://console.cloud.google.com/
2. Create new project
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy API key

**Example Request:**
```bash
GET https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=10&key=YOUR_API_KEY
```

**Example Response:**
```json
{
  "items": [
    {
      "id": "dQw4w9WgXcQ",
      "snippet": {
        "title": "Trending Music Video",
        "description": "Latest hit song...",
        "thumbnails": { "high": { "url": "https://..." } },
        "categoryId": "10"
      },
      "statistics": {
        "viewCount": "1000000",
        "likeCount": "50000",
        "commentCount": "2000"
      }
    }
  ]
}
```

---

### 3. **Reddit JSON API** ✅ NO API KEY NEEDED!
```
URL: https://www.reddit.com/
Free Tier: UNLIMITED (rate limited to 60 req/min)
Features:
  - Trending posts
  - Subreddit data
  - Comments
  - No authentication needed!

Perfect For: Tech, Gaming, Entertainment, Memes
```

**How to Use:**
Just add `.json` to any Reddit URL!

**Example Request:**
```bash
GET https://www.reddit.com/r/all/hot.json?limit=25
GET https://www.reddit.com/r/worldnews/top.json?limit=25
GET https://www.reddit.com/r/technology/hot.json
```

**Example Response:**
```json
{
  "data": {
    "children": [
      {
        "data": {
          "title": "Breaking: New AI Technology",
          "author": "username",
          "score": 45000,
          "num_comments": 1200,
          "url": "https://...",
          "thumbnail": "https://..."
        }
      }
    ]
  }
}
```

---

### 4. **The Guardian API** ✅ FREE
```
URL: https://open-platform.theguardian.com/
Free Tier: 500 requests/day
Features:
  - News articles
  - Search
  - Tags/categories
  - High quality journalism

Perfect For: World News, Politics, Culture
```

**How to Get:**
1. Go to: https://bonobo.capi.gutools.co.uk/register/developer
2. Register (free)
3. Get API key instantly

**Example Request:**
```bash
GET https://content.guardianapis.com/search?api-key=YOUR_KEY&show-fields=thumbnail,headline,body
```

---

### 5. **MediaStack API** ✅ FREE
```
URL: https://mediastack.com/
Free Tier: 500 requests/month
Features:
  - Live news
  - 50+ countries
  - 13 languages
  - Simple JSON

Perfect For: World News, Business
```

**How to Get:**
1. Go to: https://mediastack.com/product
2. Sign up (Free Plan)
3. Get API key

---

### 6. **Hacker News API** ✅ NO KEY NEEDED!
```
URL: https://hacker-news.firebaseio.com/v0/
Free Tier: UNLIMITED
Features:
  - Top stories
  - New stories
  - Best stories
  - No auth needed!

Perfect For: Tech News, Startups
```

**Example Request:**
```bash
GET https://hacker-news.firebaseio.com/v0/topstories.json
GET https://hacker-news.firebaseio.com/v0/item/ITEM_ID.json
```

---

### 7. **CoinGecko API** ✅ NO KEY NEEDED!
```
URL: https://www.coingecko.com/en/api
Free Tier: 50 calls/min (UNLIMITED)
Features:
  - Crypto prices
  - Trending coins
  - Market data
  - No authentication!

Perfect For: Crypto/Finance Trends
```

**Example Request:**
```bash
GET https://api.coingecko.com/api/v3/search/trending
GET https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd
```

---

## 🎯 MY RECOMMENDED SETUP (All FREE!)

### Core APIs to Use:

1. **NewsAPI** - Politics, World News, Business
   - 100 requests/day
   - Update every 1 hour = 24 requests/day ✅

2. **YouTube API** - Music, Entertainment, Trending Videos
   - 10,000 units/day
   - Update every 1 hour = 24 units/day ✅

3. **Reddit JSON** - Tech, Gaming, Memes (NO KEY!)
   - Unlimited
   - Update every 1 hour ✅

4. **Hacker News** - Tech News, Startups (NO KEY!)
   - Unlimited
   - Update every 1 hour ✅

5. **CoinGecko** - Crypto Trends (NO KEY!)
   - Unlimited
   - Update every 1 hour ✅

**Total Cost: $0** ✅
**Total Setup Time: 15 minutes** ✅

---

## 📊 Simple Categories

```javascript
const categories = [
  {
    id: 'news',
    name: '📰 World News',
    source: 'NewsAPI',
    endpoint: '/v2/top-headlines?country=us'
  },
  {
    id: 'youtube',
    name: '📺 Trending Videos',
    source: 'YouTube',
    endpoint: '/videos?chart=mostPopular'
  },
  {
    id: 'tech',
    name: '💻 Technology',
    source: 'Reddit + HackerNews',
    endpoint: '/r/technology/hot.json'
  },
  {
    id: 'crypto',
    name: '💰 Crypto',
    source: 'CoinGecko',
    endpoint: '/search/trending'
  },
  {
    id: 'entertainment',
    name: '🎬 Entertainment',
    source: 'Reddit',
    endpoint: '/r/entertainment/hot.json'
  }
];
```

---

## 🔧 Simple Implementation Steps

### Step 1: Get API Keys (5 minutes)

```bash
1. NewsAPI:
   → https://newsapi.org/register
   → Copy API key
   
2. YouTube:
   → https://console.cloud.google.com/
   → Create project → Enable YouTube API → Get key
   
3. Others: No keys needed! 🎉
```

### Step 2: Add to .env

```env
# Free API Keys
NEWSAPI_KEY=your_newsapi_key_here
YOUTUBE_API_KEY=your_youtube_key_here

# No keys needed for:
# - Reddit
# - Hacker News
# - CoinGecko
```

### Step 3: Database Schema (Simple)

```javascript
// Trending Collection
{
  _id: ObjectId,
  title: String,              // "Breaking News: ..."
  category: String,           // "news", "tech", "crypto"
  source: String,             // "NewsAPI", "Reddit"
  url: String,                // Link to article
  imageUrl: String,           // Thumbnail
  score: Number,              // Engagement score
  rank: Number,               // 1-50
  publishedAt: Date,
  fetchedAt: Date,
  expiresAt: Date             // Auto-delete after 24h
}
```

### Step 4: Create API Route

```javascript
// /api/trending/fetch (Cron job calls this every 1 hour)

1. Fetch from NewsAPI
2. Fetch from YouTube
3. Fetch from Reddit
4. Fetch from Hacker News
5. Fetch from CoinGecko
6. Combine all results
7. Calculate simple score: viewCount + comments + likes
8. Sort by score
9. Assign ranks 1-50
10. Save to database
```

### Step 5: Frontend Component

```javascript
// /trending page

1. Fetch /api/trending
2. Group by category
3. Display in cards
4. Auto-refresh every 5 minutes (client-side)
```

---

## 🔄 Simple Update Logic (Every 1 Hour)

```javascript
// Cron job: 0 * * * * (every hour)

async function updateTrending() {
  // 1. Fetch News (NewsAPI)
  const news = await fetchNewsAPI();
  
  // 2. Fetch YouTube (YouTube API)
  const videos = await fetchYouTube();
  
  // 3. Fetch Reddit (No key!)
  const reddit = await fetchReddit();
  
  // 4. Fetch Hacker News (No key!)
  const hn = await fetchHackerNews();
  
  // 5. Fetch Crypto (No key!)
  const crypto = await fetchCoinGecko();
  
  // 6. Combine and rank
  const all = [...news, ...videos, ...reddit, ...hn, ...crypto];
  
  // 7. Simple score
  all.forEach(item => {
    item.score = (item.views || 0) + 
                 (item.likes || 0) + 
                 (item.comments || 0);
  });
  
  // 8. Sort and rank
  all.sort((a, b) => b.score - a.score);
  all.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  // 9. Save top 50
  await Trending.deleteMany({});
  await Trending.insertMany(all.slice(0, 50));
}
```

---

## 📝 API Request Examples

### NewsAPI
```javascript
const response = await fetch(
  `https://newsapi.org/v2/top-headlines?country=us&pageSize=20&apiKey=${process.env.NEWSAPI_KEY}`
);
const data = await response.json();

const trends = data.articles.map(article => ({
  title: article.title,
  category: 'news',
  source: 'NewsAPI',
  url: article.url,
  imageUrl: article.urlToImage,
  score: 0, // Will calculate
  publishedAt: article.publishedAt
}));
```

### YouTube
```javascript
const response = await fetch(
  `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=20&key=${process.env.YOUTUBE_API_KEY}`
);
const data = await response.json();

const trends = data.items.map(video => ({
  title: video.snippet.title,
  category: 'youtube',
  source: 'YouTube',
  url: `https://youtube.com/watch?v=${video.id}`,
  imageUrl: video.snippet.thumbnails.high.url,
  score: parseInt(video.statistics.viewCount),
  publishedAt: video.snippet.publishedAt
}));
```

### Reddit (NO KEY!)
```javascript
const response = await fetch(
  'https://www.reddit.com/r/all/hot.json?limit=20'
);
const data = await response.json();

const trends = data.data.children.map(post => ({
  title: post.data.title,
  category: 'tech',
  source: 'Reddit',
  url: post.data.url,
  imageUrl: post.data.thumbnail,
  score: post.data.score + post.data.num_comments,
  publishedAt: new Date(post.data.created_utc * 1000)
}));
```

---

## ⚡ Performance Tips

1. **Cache Results**
   ```javascript
   // Cache for 5 minutes
   redis.setex('trending:all', 300, JSON.stringify(trends));
   ```

2. **Parallel API Calls**
   ```javascript
   const [news, videos, reddit] = await Promise.all([
     fetchNewsAPI(),
     fetchYouTube(),
     fetchReddit()
   ]);
   ```

3. **Error Handling**
   ```javascript
   try {
     const news = await fetchNewsAPI();
   } catch (error) {
     console.error('NewsAPI failed:', error);
     // Continue with other sources
   }
   ```

---

## 🎯 Quick Implementation Checklist

- [ ] Register for NewsAPI (2 min)
- [ ] Get YouTube API key (3 min)
- [ ] Add keys to .env
- [ ] Create Trending schema in MongoDB
- [ ] Create `/api/trending/fetch` route
- [ ] Create `/api/trending` GET route
- [ ] Setup cron job (every 1 hour)
- [ ] Create `/trending` page
- [ ] Create TrendingCard component
- [ ] Test all APIs
- [ ] Deploy!

**Total Time: 2-3 hours** ⏱️

---

## 🚀 Next Steps After This Discussion

Once you confirm, I'll create:
1. ✅ Exact API integration code for each service
2. ✅ Database schema with Mongoose models
3. ✅ Cron job setup for hourly updates
4. ✅ API routes for fetching trending data
5. ✅ Frontend components for display
6. ✅ Complete working example

---

## 💡 Summary

**Free APIs We'll Use:**
- ✅ NewsAPI (100 req/day) - News
- ✅ YouTube API (10K units/day) - Videos
- ✅ Reddit JSON (unlimited, no key!) - Tech/Gaming
- ✅ Hacker News (unlimited, no key!) - Tech News
- ✅ CoinGecko (unlimited, no key!) - Crypto

**Update:** Every 1 hour
**Scope:** Global trends
**Algorithm:** Simple score-based
**Cost:** $0 (completely free!)

---

**Chalein? Shall I start with the actual implementation code?** 🚀
