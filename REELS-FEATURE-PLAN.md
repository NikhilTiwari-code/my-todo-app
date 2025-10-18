# 🎬 Instagram Reels Feature - Complete Implementation Plan

## 🎯 Project Overview

Build a **complete short-form video platform** (like Instagram Reels/TikTok) with:
- 15-60 second video uploads
- Vertical video player with swipe navigation
- Like, comment, share functionality
- Cloudinary for video hosting and optimization
- Real-time notifications
- Video discovery feed
- User profiles with reels grid

---

## 📁 Folder Structure

```
my-todo-app/
├── src/
│   ├── models/
│   │   └── reel.models.ts              ✅ NEW - Reel database schema
│   │
│   ├── app/
│   │   └── api/
│   │       └── reels/
│   │           ├── route.ts            ✅ NEW - GET all reels, POST new reel
│   │           ├── [id]/
│   │           │   ├── route.ts        ✅ NEW - GET/DELETE specific reel
│   │           │   └── like/
│   │           │       └── route.ts    ✅ NEW - Like/Unlike reel
│   │           ├── comments/
│   │           │   └── route.ts        ✅ NEW - POST comment
│   │           └── upload/
│   │               └── route.ts        ✅ NEW - Cloudinary upload endpoint
│   │
│   ├── app/(dashboard)/
│   │   └── reels/
│   │       ├── page.tsx                ✅ NEW - Main reels feed (swipeable)
│   │       ├── upload/
│   │       │   └── page.tsx            ✅ NEW - Upload reel page
│   │       └── [id]/
│   │           └── page.tsx            ✅ NEW - Single reel view
│   │
│   ├── components/
│   │   └── reels/
│   │       ├── ReelCard.tsx            ✅ NEW - Single reel video player
│   │       ├── ReelPlayer.tsx          ✅ NEW - Video player with controls
│   │       ├── ReelUpload.tsx          ✅ NEW - Upload form component
│   │       ├── ReelComments.tsx        ✅ NEW - Comments section
│   │       ├── ReelActions.tsx         ✅ NEW - Like/Comment/Share buttons
│   │       └── ReelGrid.tsx            ✅ NEW - Grid view for profile
│   │
│   ├── lib/
│   │   └── cloudinary.ts               ✅ NEW - Cloudinary configuration
│   │
│   └── hooks/
│       └── useVideoPlayer.ts           ✅ NEW - Video player custom hook
│
└── socket-server.js                     🔧 MODIFY - Add reel notifications
```

**Total Files to Create:** 16 new files  
**Total Files to Modify:** 2 files (socket-server.js, layout.tsx)

---

## 🗄️ Database Schema

### **Reel Model** (`src/models/reel.models.ts`)

```typescript
interface IReel {
  userId: ObjectId;              // Who posted it
  videoUrl: string;              // Cloudinary video URL
  thumbnailUrl: string;          // Cloudinary thumbnail URL
  caption: string;               // Reel caption/description
  duration: number;              // Video duration in seconds
  views: number;                 // View count
  likes: ObjectId[];             // Array of user IDs who liked
  comments: [{
    userId: ObjectId;
    text: string;
    createdAt: Date;
  }];
  hashtags: string[];            // Extracted from caption (#hashtag)
  music?: string;                // Music/audio name (optional)
  cloudinaryPublicId: string;    // For video management
  isActive: boolean;             // Soft delete
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
- userId (for user's reels)
- createdAt (for feed sorting)
- hashtags (for discovery)
- likes (for trending)
```

**Key Features:**
- ✅ Stores Cloudinary video URL (not video file!)
- ✅ Thumbnail for fast loading
- ✅ Embedded comments (first 50, then paginate)
- ✅ View count for analytics
- ✅ Hashtag support for discovery

---

## ☁️ Cloudinary Setup

### **Step 1: Create Cloudinary Account**
1. Go to https://cloudinary.com/
2. Sign up for FREE account
3. Get your credentials:
   - Cloud Name
   - API Key
   - API Secret

### **Step 2: Environment Variables**

Add to `.env.local`:
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### **Step 3: Cloudinary Configuration** (`src/lib/cloudinary.ts`)

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

### **Step 4: Upload Preset (Cloudinary Dashboard)**
- Go to Settings → Upload
- Create upload preset: `todo_app_reels`
- Mode: Unsigned (for direct frontend uploads)
- Folder: `reels/`
- Format: Auto (mp4, mov, etc.)
- Quality: Auto
- Max file size: 100MB
- Max duration: 60 seconds

---

## 📦 NPM Packages to Install

```bash
npm install cloudinary
npm install @cloudinary/react
npm install @cloudinary/url-gen
```

**Why these packages?**
- `cloudinary`: Backend video upload/management
- `@cloudinary/react`: React video player component
- `@cloudinary/url-gen`: Generate optimized video URLs

---

## 🔄 Data Flow

### **1. Upload Flow**
```
User selects video (max 60 seconds)
    ↓
Frontend validates (duration, size, format)
    ↓
Upload to Cloudinary directly (client-side)
    ↓
Get Cloudinary URL + thumbnail
    ↓
POST /api/reels (save metadata to MongoDB)
    ↓
Socket emits "reel:new" to followers
    ↓
Reel appears in followers' feeds
```

### **2. Feed Flow**
```
User opens /reels page
    ↓
GET /api/reels?limit=10 (first 10 reels)
    ↓
Display first reel (autoplay)
    ↓
User swipes up → Load next reel
    ↓
When reaching 8th reel → Fetch next 10 (infinite scroll)
    ↓
Auto-increment view count on each reel
```

### **3. Interaction Flow**
```
User likes reel
    ↓
POST /api/reels/[id]/like
    ↓
Update likes array in DB
    ↓
Socket emits "reel:like" to reel owner
    ↓
Owner gets notification
```

---

## 🎨 UI/UX Design

### **Main Reels Feed** (`/reels`)
```
┌────────────────────────┐
│     @username          │ ← User info overlay
│                        │
│                        │
│      [VIDEO]           │ ← Full-screen vertical video
│                        │
│                        │
│  Caption text...  ❤️ 234│ ← Caption + Like count
│  #hashtag         💬 45 │ ← Hashtags + Comment count
│  👁️ 1.2K          🔗 12 │ ← Views + Share count
│                        │
│  [Progress Bar]        │ ← Video progress
└────────────────────────┘

Right Side Actions:
├── 👤 Avatar (tap = profile)
├── ❤️ Like button (animated)
├── 💬 Comment button
├── 🔗 Share button
└── ⚙️ More options (delete if yours)
```

**Interaction:**
- 👆 Tap to play/pause
- 👆 Double-tap to like (heart animation!)
- 👆 Swipe up → Next reel
- 👆 Swipe down → Previous reel
- 👆 Tap comment → Open comments drawer

### **Upload Page** (`/reels/upload`)
```
┌────────────────────────────┐
│  Upload Reel              │
├────────────────────────────┤
│                            │
│  [ 📹 Select Video ]       │ ← Video picker
│                            │
│  OR                        │
│                            │
│  [ 📷 Record Video ]       │ ← Camera (Phase 2)
│                            │
├────────────────────────────┤
│  [Video Preview]           │ ← Shows selected video
│  Duration: 23s             │
├────────────────────────────┤
│  Caption:                  │
│  ┌──────────────────────┐ │
│  │ Write a caption...   │ │
│  │ #hashtags work!      │ │
│  └──────────────────────┘ │
├────────────────────────────┤
│  Music: 🎵 Select audio   │ ← Phase 2
├────────────────────────────┤
│  [ Cancel ]  [ Post Reel ] │
└────────────────────────────┘
```

### **Comments Section** (Bottom Drawer)
```
┌────────────────────────────┐
│  Comments (45)        ✕    │
├────────────────────────────┤
│  👤 @john · 2h ago         │
│     Amazing! 🔥            │
│     ❤️ 12  💬 Reply        │
├────────────────────────────┤
│  👤 @sarah · 5h ago        │
│     Love this!             │
│     ❤️ 5   💬 Reply        │
├────────────────────────────┤
│  [Write a comment...]      │
│  [Send →]                  │
└────────────────────────────┘
```

---

## 🔧 API Endpoints

### **1. GET /api/reels** - Fetch Reels Feed
```typescript
Query params:
  - limit: 10 (default)
  - cursor: last reel ID (for pagination)
  - userId: filter by user (optional)

Response:
{
  reels: [
    {
      _id: "...",
      user: { _id, name, avatar },
      videoUrl: "https://res.cloudinary.com/...",
      thumbnailUrl: "https://res.cloudinary.com/...",
      caption: "Check this out! #amazing",
      duration: 23,
      views: 1234,
      likes: ["userId1", "userId2"],
      likesCount: 234,
      commentsCount: 45,
      isLiked: true,  // Did current user like it?
      createdAt: "2025-10-16T..."
    }
  ],
  hasMore: true
}
```

### **2. POST /api/reels** - Create New Reel
```typescript
Request:
{
  videoUrl: "https://res.cloudinary.com/...",
  thumbnailUrl: "https://res.cloudinary.com/...",
  caption: "My new reel! #awesome",
  duration: 23,
  cloudinaryPublicId: "reels/abc123"
}

Response:
{
  reel: {...},
  followers: ["userId1", "userId2"]  // For notifications
}
```

### **3. POST /api/reels/[id]/like** - Like/Unlike Reel
```typescript
Request: {} (empty body)

Response:
{
  liked: true,  // or false if unliked
  likesCount: 235
}
```

### **4. POST /api/reels/comments** - Add Comment
```typescript
Request:
{
  reelId: "...",
  text: "Great video!"
}

Response:
{
  comment: {
    _id: "...",
    user: { _id, name, avatar },
    text: "Great video!",
    createdAt: "..."
  }
}
```

### **5. DELETE /api/reels/[id]** - Delete Reel
```typescript
Response:
{
  success: true,
  message: "Reel deleted"
}
```

### **6. POST /api/reels/upload** - Get Cloudinary Upload Signature
```typescript
Request:
{
  fileName: "video.mp4"
}

Response:
{
  signature: "...",
  timestamp: 1697453678,
  cloudName: "your_cloud_name",
  apiKey: "your_api_key",
  uploadPreset: "todo_app_reels"
}
```

---

## ⚡ Real-Time Features (Socket.io)

### **Socket Events to Add:**

```javascript
// In socket-server.js

// When someone posts a new reel
socket.on("reel:new", (data) => {
  // Notify all followers
  data.followers.forEach(followerId => {
    io.to(followerId).emit("reel:new", {
      reelId: data.reelId,
      userId: data.userId,
      userName: data.userName,
      thumbnailUrl: data.thumbnailUrl
    });
  });
});

// When someone likes your reel
socket.on("reel:like", (data) => {
  // Notify reel owner
  io.to(data.reelOwnerId).emit("reel:like", {
    reelId: data.reelId,
    userId: data.userId,
    userName: data.userName
  });
});

// When someone comments on your reel
socket.on("reel:comment", (data) => {
  // Notify reel owner
  io.to(data.reelOwnerId).emit("reel:comment", {
    reelId: data.reelId,
    userId: data.userId,
    userName: data.userName,
    commentText: data.text
  });
});
```

---

## 🎯 Key Features

### **Phase 1: MVP (Core Features)**
1. ✅ **Upload Reel**
   - Select video from device
   - Max 60 seconds
   - Add caption with hashtags
   - Upload to Cloudinary
   - Save metadata to MongoDB

2. ✅ **Reels Feed**
   - Vertical scrollable feed
   - Autoplay on scroll
   - Swipe up/down navigation
   - Infinite scroll (load more)
   - View counter

3. ✅ **Like System**
   - Double-tap to like (heart animation)
   - Like button on right side
   - Real-time like count
   - Unlike functionality

4. ✅ **Comment System**
   - Comment drawer (bottom sheet)
   - Add/view comments
   - Real-time comment count
   - Comment notifications

5. ✅ **User Profile Integration**
   - User's reels grid on profile
   - Reel count in stats
   - Click to view full reel

6. ✅ **Real-Time Notifications**
   - New reel from followed users
   - Someone liked your reel
   - Someone commented on your reel

### **Phase 2: Advanced Features** (Future)
1. ⏭️ **Video Recording**
   - Record video in-app
   - 15/30/60 second options
   - Filters and effects

2. ⏭️ **Audio/Music**
   - Add music to reels
   - Music library
   - Trending sounds

3. ⏭️ **Hashtag Discovery**
   - Browse by hashtag
   - Trending hashtags
   - Hashtag following

4. ⏭️ **Share Functionality**
   - Share to Stories
   - Share to DMs
   - Copy link
   - Share to external apps

5. ⏭️ **Advanced Analytics**
   - Views over time
   - Audience demographics
   - Engagement rate

6. ⏭️ **Reel Drafts**
   - Save as draft
   - Edit before posting
   - Schedule posting

---

## 🚀 Implementation Steps

### **Week 1: Setup & Database**
- [ ] Set up Cloudinary account and get credentials
- [ ] Install npm packages (cloudinary, @cloudinary/react)
- [ ] Create Reel model in MongoDB
- [ ] Set up environment variables
- [ ] Configure Cloudinary upload preset
- **Estimated time:** 2-3 hours

### **Week 2: Upload System**
- [ ] Create upload API endpoint with Cloudinary
- [ ] Build ReelUpload component
- [ ] Video file validation (size, duration, format)
- [ ] Progress bar for upload
- [ ] Caption input with hashtag detection
- [ ] Test upload flow end-to-end
- **Estimated time:** 4-5 hours

### **Week 3: Feed & Player**
- [ ] Create GET reels API endpoint
- [ ] Build ReelPlayer component with video controls
- [ ] Build ReelCard component
- [ ] Implement main Reels feed page
- [ ] Add swipe navigation (vertical scroll)
- [ ] Implement infinite scroll
- [ ] Auto-increment view count
- **Estimated time:** 6-8 hours

### **Week 4: Interactions**
- [ ] Build like system (POST /api/reels/[id]/like)
- [ ] Add double-tap to like animation
- [ ] Build ReelActions component (like/comment/share buttons)
- [ ] Create ReelComments component
- [ ] Build comments API endpoint
- [ ] Add comment drawer (bottom sheet)
- **Estimated time:** 4-5 hours

### **Week 5: Real-Time & Polish**
- [ ] Add socket events (reel:new, reel:like, reel:comment)
- [ ] Implement real-time notifications
- [ ] Add reels grid to profile page
- [ ] Update navbar with Reels icon
- [ ] Performance optimization (lazy loading, caching)
- [ ] Bug fixes and testing
- **Estimated time:** 3-4 hours

**Total Estimated Time:** 19-25 hours

---

## 📊 Technical Decisions

### **Why Cloudinary?**
✅ **Pros:**
- Automatic video transcoding (convert any format to web-friendly)
- Automatic thumbnail generation
- CDN delivery (fast worldwide)
- Video optimization (adaptive bitrate)
- Free tier: 25 GB storage, 25 GB bandwidth/month
- Easy to use API
- Handles video processing server-side

❌ **Cons:**
- Costs money at scale (but free tier is generous)
- Requires internet for video upload
- Dependency on third-party service

### **Alternative Options:**
1. **AWS S3 + CloudFront**: More control, cheaper at scale, but complex setup
2. **Firebase Storage**: Easy setup, but expensive and limited features
3. **Self-hosted**: Full control, but expensive servers + bandwidth costs

**Verdict:** Cloudinary is perfect for MVP! Easy, fast, and generous free tier.

### **Why Embedded Comments?**
- First 50 comments stored in reel document (fast loading)
- After 50, paginate with separate collection
- Reduces database queries for most reels

### **Why Not Use Base64?**
- Videos are HUGE (5-50MB)
- Base64 makes them 33% larger
- Would blow up MongoDB documents (16MB limit)
- Slow to transfer over network
- Cloudinary is the right choice!

---

## 🔐 Security Considerations

### **1. Video Upload Validation**
```typescript
// Frontend validation
- Max file size: 100MB
- Max duration: 60 seconds
- Allowed formats: mp4, mov, avi, webm
- Aspect ratio: 9:16 (vertical) preferred

// Backend validation
- Verify Cloudinary signature
- Check user authentication
- Rate limit uploads (5 per hour per user)
```

### **2. Content Moderation** (Phase 2)
- Report inappropriate content
- Admin review queue
- Auto-moderation with AI (Cloudinary has built-in)

### **3. Rate Limiting**
```typescript
Uploads: 5 per hour
Likes: 100 per hour
Comments: 50 per hour
```

---

## 📱 Mobile Responsiveness

### **Design Approach:**
```
Desktop (>768px):
- Show 3-4 reels grid
- Click to view full-screen player
- Side panel for comments

Tablet (768px-1024px):
- Show 2-3 reels grid
- Click to view full-screen player

Mobile (<768px):
- Full-screen vertical feed (TikTok style)
- Swipe up/down to navigate
- Native mobile feel
```

---

## 🧪 Testing Checklist

### **Upload Flow:**
- [ ] Select video < 60 seconds → Success
- [ ] Select video > 60 seconds → Error message
- [ ] Select non-video file → Error message
- [ ] Upload with caption → Saved correctly
- [ ] Upload without caption → Works (caption optional)
- [ ] Hashtags extracted correctly from caption
- [ ] Video appears in feed immediately
- [ ] Followers get real-time notification

### **Feed Flow:**
- [ ] First 10 reels load on page open
- [ ] Swipe up loads next reel
- [ ] Infinite scroll works (load more at bottom)
- [ ] Autoplay works
- [ ] Pause on tap
- [ ] View count increments

### **Interaction Flow:**
- [ ] Double-tap to like → Heart animation
- [ ] Like button toggles state
- [ ] Like count updates in real-time
- [ ] Comment opens drawer
- [ ] Comment posts successfully
- [ ] Comment count updates
- [ ] Reel owner gets notification

---

## 📈 Performance Optimization

### **1. Video Player**
```typescript
// Lazy load videos
// Preload next 2 reels
// Pause videos when off-screen
// Use Cloudinary's adaptive bitrate (q_auto)
```

### **2. Infinite Scroll**
```typescript
// Load 10 reels at a time
// Virtualize list (only render visible reels)
// Cleanup off-screen video elements
```

### **3. Image/Thumbnail Optimization**
```typescript
// Use Cloudinary transformations:
// w_400,h_711,c_fill,q_auto,f_auto
// (400x711 = 9:16 aspect ratio thumbnail)
```

---

## 💰 Cost Estimate (Cloudinary)

### **Free Tier:**
- 25 GB storage
- 25 GB bandwidth/month
- 1000 transformations/month
- Unlimited videos

### **Rough Math:**
```
Average video: 10MB
Storage: 25GB ÷ 10MB = 2,500 videos

Average view: 10MB
Bandwidth: 25GB ÷ 10MB = 2,500 video views/month

If you exceed free tier:
$0.10 per GB storage/month
$0.15 per GB bandwidth
```

### **When to Upgrade:**
- More than 2,500 videos stored
- More than 2,500 views per month
- Around 100 daily active users posting/watching reels

---

## 🎯 Success Metrics

### **Track These:**
- Total reels uploaded
- Average reel duration
- Total views per reel
- Like rate (likes / views)
- Comment rate (comments / views)
- Share rate (shares / views)
- User retention (come back to watch more?)

---

## 🚦 Next Steps

### **Ready to Build?**

1. **Create Cloudinary account** (5 min)
2. **Install packages** (2 min)
3. **Set up environment variables** (2 min)
4. **Build Reel model** (15 min)
5. **Build upload API** (30 min)
6. **Build upload UI** (45 min)
7. **Test upload flow** (15 min)
8. **Build feed API** (30 min)
9. **Build player component** (1 hour)
10. **Build feed page** (1 hour)

**Say "GO" and I'll start building! 🚀**

---

## 📚 Resources

### **Cloudinary Docs:**
- Video Upload: https://cloudinary.com/documentation/video_upload
- Video Transformations: https://cloudinary.com/documentation/video_transformation_reference
- React SDK: https://cloudinary.com/documentation/react_integration

### **Inspiration:**
- Instagram Reels: https://www.instagram.com/reels/
- TikTok: https://www.tiktok.com/
- YouTube Shorts: https://www.youtube.com/shorts/

---

## ✅ Summary

**What We're Building:**
- Complete short-form video platform (Instagram Reels clone)
- Cloudinary for video hosting and optimization
- Vertical swipeable feed with autoplay
- Like, comment, share functionality
- Real-time notifications
- User profiles with reels grid

**Files to Create:** 16 new files  
**Estimated Time:** 19-25 hours  
**Difficulty:** Advanced (but we'll break it down!)

**Ready to build the next TikTok? 🔥**
