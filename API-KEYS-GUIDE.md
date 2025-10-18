# 🔑 FREE API Keys - Complete Step-by-Step Guide

## 📋 Overview

We'll get 2 API keys (both FREE forever):
1. ✅ **NewsAPI** - For world news, politics, business (2 minutes)
2. ✅ **YouTube Data API** - For trending videos, music (5 minutes)

**Plus 3 APIs that need NO KEYS:**
3. ✅ Reddit JSON API (instant, no signup!)
4. ✅ Hacker News API (instant, no signup!)
5. ✅ CoinGecko API (instant, no signup!)

**Total Time: 7 minutes**
**Total Cost: $0** ✅

---

## 🗞️ 1. NewsAPI (2 minutes)

### Step 1: Go to NewsAPI Website
```
Open browser and visit:
👉 https://newsapi.org/
```

### Step 2: Click "Get API Key"
```
On homepage, click the big orange button:
"Get API Key" or "Register"
```

### Step 3: Fill Registration Form
```
Email: your-email@gmail.com
Password: (create a strong password)
```
✅ No credit card needed!
✅ No phone number needed!

### Step 4: Verify Email
```
1. Check your email inbox
2. Click verification link
3. You'll be redirected to dashboard
```

### Step 5: Copy Your API Key
```
On dashboard, you'll see:

┌─────────────────────────────────────────┐
│ Your API Key:                           │
│ abc123def456ghi789jkl012mno345pqr678    │
│ [Copy]                                  │
└─────────────────────────────────────────┘
```

**Click [Copy] button** and save it!

### Step 6: Test Your Key
```bash
# Open browser and test:
https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_KEY_HERE

# You should see JSON response with news articles ✅
```

### Free Plan Limits:
```
✅ 100 requests per day
✅ Access to all endpoints
✅ 80+ countries
✅ News from 150,000+ sources
✅ Forever free!
```

**✅ DONE! NewsAPI key ready** 🎉

---

## 📺 2. YouTube Data API v3 (5 minutes)

### Step 1: Go to Google Cloud Console
```
Open browser and visit:
👉 https://console.cloud.google.com/
```

### Step 2: Sign In with Google
```
Use your Gmail account to sign in
(Same account you use for YouTube is fine!)
```

### Step 3: Accept Terms of Service
```
If first time:
- Check "I agree to Terms of Service"
- Click "Agree and Continue"
```

### Step 4: Create New Project
```
1. Click dropdown at top (says "Select a project")
2. Click "NEW PROJECT"
3. Enter project name: "my-todo-trending"
4. Leave Location as "No organization"
5. Click "CREATE"
6. Wait 10-20 seconds for project creation
```

### Step 5: Enable YouTube Data API v3
```
1. In search bar at top, type: "YouTube Data API v3"
2. Click on "YouTube Data API v3" in results
3. Click blue "ENABLE" button
4. Wait for API to enable (5-10 seconds)
```

### Step 6: Create API Credentials
```
After API is enabled:

1. Click "CREATE CREDENTIALS" button (top right)
2. It will ask "Which API are you using?"
   ✅ Select: YouTube Data API v3
   
3. "What data will you access?"
   ✅ Select: Public data
   
4. Click "NEXT"

5. Enter credential name: "Trending Feature"
6. Click "CREATE"
```

### Step 7: Copy Your API Key
```
You'll see a popup with your API key:

┌─────────────────────────────────────────┐
│ API key created                          │
│                                          │
│ Your API key:                            │
│ AIzaSyB1234567890abcdefGHIJKLMNOP       │
│                                          │
│ [Copy]  [Restrict Key]  [Close]         │
└─────────────────────────────────────────┘
```

**Click [Copy] button** and save it!

### Step 8: (Optional) Restrict Your Key
```
For security, restrict the key:

1. Click "Restrict Key"
2. Under "API restrictions":
   - Choose "Restrict key"
   - Select only "YouTube Data API v3"
3. Under "Application restrictions":
   - Choose "HTTP referrers"
   - Add your domain: localhost:3000, yourdomain.com
4. Click "SAVE"
```

### Step 9: Test Your Key
```bash
# Open browser and test:
https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=US&maxResults=1&key=YOUR_KEY_HERE

# You should see JSON response with trending video ✅
```

### Free Plan Limits:
```
✅ 10,000 quota units per day
✅ 1 video fetch = 1 unit
✅ 1 search = 100 units
✅ Trending videos = 1 unit
✅ About 100+ requests per day
✅ Forever free!
```

**✅ DONE! YouTube API key ready** 🎉

---

## 🎯 3. Reddit JSON API (NO KEY NEEDED!)

### No Signup Required! ✅

Just add `.json` to any Reddit URL:

```bash
# Trending posts from all of Reddit
https://www.reddit.com/r/all/hot.json

# Technology trending
https://www.reddit.com/r/technology/hot.json

# World news
https://www.reddit.com/r/worldnews/hot.json

# Gaming
https://www.reddit.com/r/gaming/hot.json

# Entertainment
https://www.reddit.com/r/entertainment/hot.json
```

### Test Right Now:
```
1. Open browser
2. Visit: https://www.reddit.com/r/all/hot.json
3. You'll see JSON data immediately ✅
```

### Limits:
```
✅ 60 requests per minute
✅ No authentication needed
✅ Completely free
✅ Instant access
```

**✅ DONE! Reddit ready to use** 🎉

---

## 💼 4. Hacker News API (NO KEY NEEDED!)

### No Signup Required! ✅

Firebase-hosted API:

```bash
# Top stories
https://hacker-news.firebaseio.com/v0/topstories.json

# New stories
https://hacker-news.firebaseio.com/v0/newstories.json

# Best stories
https://hacker-news.firebaseio.com/v0/beststories.json

# Get specific story details
https://hacker-news.firebaseio.com/v0/item/STORY_ID.json
```

### Test Right Now:
```
1. Open browser
2. Visit: https://hacker-news.firebaseio.com/v0/topstories.json
3. You'll see array of story IDs ✅
```

### Limits:
```
✅ Unlimited requests
✅ No authentication needed
✅ Completely free
✅ Instant access
```

**✅ DONE! Hacker News ready to use** 🎉

---

## 💰 5. CoinGecko API (NO KEY NEEDED!)

### No Signup Required! ✅

Public API for crypto data:

```bash
# Trending coins
https://api.coingecko.com/api/v3/search/trending

# Top coins by market cap
https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc

# Bitcoin price
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd
```

### Test Right Now:
```
1. Open browser
2. Visit: https://api.coingecko.com/api/v3/search/trending
3. You'll see trending crypto coins ✅
```

### Limits:
```
✅ 50 calls per minute
✅ No authentication needed
✅ Completely free
✅ Instant access
```

**✅ DONE! CoinGecko ready to use** 🎉

---

## 🔐 Add Keys to Your .env File

Once you have your keys, add them to `.env.local`:

```env
# ==========================================
# TRENDING FEATURE - FREE API KEYS
# ==========================================

# NewsAPI (100 requests/day)
NEWSAPI_KEY=abc123def456ghi789jkl012mno345pqr678

# YouTube Data API v3 (10,000 units/day)
YOUTUBE_API_KEY=AIzaSyB1234567890abcdefGHIJKLMNOP

# No keys needed for:
# - Reddit JSON API (unlimited, 60 req/min)
# - Hacker News API (unlimited)
# - CoinGecko API (50 calls/min)
```

**⚠️ IMPORTANT: Never commit .env.local to Git!**

Check your `.gitignore` includes:
```
.env.local
.env*.local
```

---

## ✅ Verification Checklist

Before continuing to code, verify all APIs work:

### Test NewsAPI:
```bash
# PowerShell
$apiKey = "YOUR_NEWSAPI_KEY"
$url = "https://newsapi.org/v2/top-headlines?country=us&apiKey=$apiKey"
Invoke-RestMethod -Uri $url
```

### Test YouTube API:
```bash
# PowerShell
$apiKey = "YOUR_YOUTUBE_KEY"
$url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=US&maxResults=1&key=$apiKey"
Invoke-RestMethod -Uri $url
```

### Test Reddit API:
```bash
# PowerShell
$url = "https://www.reddit.com/r/all/hot.json?limit=1"
Invoke-RestMethod -Uri $url
```

### Test Hacker News API:
```bash
# PowerShell
$url = "https://hacker-news.firebaseio.com/v0/topstories.json"
Invoke-RestMethod -Uri $url
```

### Test CoinGecko API:
```bash
# PowerShell
$url = "https://api.coingecko.com/api/v3/search/trending"
Invoke-RestMethod -Uri $url
```

**✅ All should return JSON data!**

---

## 📊 API Usage Summary

| API | Signup Needed? | Key Needed? | Free Limit | Best For |
|-----|----------------|-------------|------------|----------|
| NewsAPI | ✅ Yes (2 min) | ✅ Yes | 100 req/day | News, Politics |
| YouTube | ✅ Yes (5 min) | ✅ Yes | 10K units/day | Videos, Music |
| Reddit | ❌ No | ❌ No | 60 req/min | Tech, Gaming |
| Hacker News | ❌ No | ❌ No | Unlimited | Tech News |
| CoinGecko | ❌ No | ❌ No | 50 req/min | Crypto |

---

## 🚨 Common Issues & Solutions

### Issue 1: NewsAPI says "API key invalid"
```
Solution: 
- Double-check you copied the entire key
- Make sure no extra spaces
- Verify email was confirmed
- Try generating a new key from dashboard
```

### Issue 2: YouTube API says "API key not valid"
```
Solution:
- Check if API is enabled in Google Cloud Console
- Wait 5 minutes after creating key (propagation)
- Make sure project is selected
- Check API restrictions (should be unrestricted for testing)
```

### Issue 3: YouTube API says "Quota exceeded"
```
Solution:
- You've used 10,000 units today
- Wait until midnight PST for quota reset
- Optimize: Use trending endpoint (1 unit) not search (100 units)
```

### Issue 4: Reddit returns 429 "Too Many Requests"
```
Solution:
- You're hitting 60 req/min limit
- Add delay between requests (1 second)
- Use caching (Redis) to reduce calls
```

### Issue 5: CORS errors when testing in browser
```
Solution:
- These APIs must be called from backend/server-side
- NOT from frontend/client-side JavaScript
- Create Next.js API routes to proxy requests
```

---

## 🎯 What's Next?

Now that you have your API keys:

1. ✅ Add keys to `.env.local`
2. ✅ Test all APIs work
3. ⏭️ Create database schema for trending data
4. ⏭️ Create API routes to fetch from these APIs
5. ⏭️ Setup cron job for hourly updates
6. ⏭️ Create frontend trending page

---

## 📝 Quick Reference

### Your API Keys Location:
```
NewsAPI Dashboard:
👉 https://newsapi.org/account

YouTube API Console:
👉 https://console.cloud.google.com/apis/credentials

Reddit: No dashboard (no key needed)
Hacker News: No dashboard (no key needed)
CoinGecko: No dashboard (no key needed)
```

---

## 💡 Pro Tips

1. **Keep Keys Secret**: Never share API keys publicly
2. **Use Environment Variables**: Always use .env.local
3. **Monitor Usage**: Check dashboards weekly
4. **Rotate Keys**: Change keys every 3-6 months
5. **Restrict Keys**: Use API restrictions in production
6. **Cache Responses**: Reduce API calls with Redis
7. **Handle Errors**: Always have fallback if API fails

---

## 🎉 Congratulations!

You now have all the FREE API keys needed for the trending feature!

**Total Setup Time: 7 minutes** ⏱️
**Total Cost: $0** 💰
**APIs Ready: 5/5** ✅

Ready to start coding the implementation? 🚀

---

**Next Step: Shall I create the database schema and API integration code?** 😊
