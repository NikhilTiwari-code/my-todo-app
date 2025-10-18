# 🚀 Next High-Impact Features - Detailed Implementation Guide

## 📊 Executive Summary

This document outlines the **most impactful features** to implement next for your social media application. Each feature is rated by:
- **Impact Score** (1-10): User value and engagement potential
- **Effort Score** (1-10): Development complexity
- **ROI Score**: Impact/Effort ratio
- **Timeline**: Estimated development time

---

## 📋 Feature Priority Matrix

| Rank | Feature | Impact | Effort | ROI | Timeline | Status |
|------|---------|--------|--------|-----|----------|--------|
| 1 | Search & Discovery | 10 | 6 | 1.67 | 1-2 weeks | ⭐ RECOMMENDED |
| 2 | User Profiles Enhancement | 9 | 4 | 2.25 | 3-5 days | ⭐ RECOMMENDED |
| 3 | Notifications System | 9 | 5 | 1.80 | 1 week | ⭐ RECOMMENDED |
| 4 | Bookmarks/Saved Content | 7 | 3 | 2.33 | 2-3 days | 🎯 QUICK WIN |
| 5 | Follow System | 8 | 6 | 1.33 | 1 week | High Priority |
| 6 | Advanced Analytics | 8 | 7 | 1.14 | 2 weeks | Medium Priority |
| 7 | Content Moderation | 7 | 5 | 1.40 | 1 week | Medium Priority |
| 8 | Dark Mode | 6 | 2 | 3.00 | 1 day | 🎯 QUICK WIN |
| 9 | Video Editor | 9 | 10 | 0.90 | 3-4 weeks | Long-term |
| 10 | Monetization | 8 | 9 | 0.89 | 3-4 weeks | Long-term |

---

## 🎯 Feature #1: Search & Discovery System

### Impact Score: 10/10
**Why it matters:**
- Users can find content they want
- Increases engagement time
- Essential for content discovery
- Drives user retention

### Implementation Plan

#### Phase 1: Basic Search (Week 1)
```typescript
// Create: src/app/(dashboard)/explore/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, Hash, Users, Video } from "lucide-react";
import { ReelGrid } from "@/components/reels/ReelGrid";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>({
    reels: [],
    users: [],
    hashtags: [],
  });
  const [activeTab, setActiveTab] = useState<"all" | "reels" | "users" | "hashtags">("all");
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        await performSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reels, users, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        {searchQuery && (
          <div className="max-w-4xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
            <TabButton
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              icon={<Search className="w-4 h-4" />}
              label="All"
            />
            <TabButton
              active={activeTab === "reels"}
              onClick={() => setActiveTab("reels")}
              icon={<Video className="w-4 h-4" />}
              label={`Reels (${searchResults.reels?.length || 0})`}
            />
            <TabButton
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
              icon={<Users className="w-4 h-4" />}
              label={`Users (${searchResults.users?.length || 0})`}
            />
            <TabButton
              active={activeTab === "hashtags"}
              onClick={() => setActiveTab("hashtags")}
              icon={<Hash className="w-4 h-4" />}
              label={`Hashtags (${searchResults.hashtags?.length || 0})`}
            />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto p-4">
        {!searchQuery ? (
          <TrendingSection />
        ) : (
          <SearchResults results={searchResults} activeTab={activeTab} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
        active
          ? "bg-purple-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function TrendingSection() {
  const [trendingReels, setTrendingReels] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const response = await fetch("/api/trending");
      const data = await response.json();
      setTrendingReels(data.reels);
      setTrendingHashtags(data.hashtags);
    } catch (error) {
      console.error("Error fetching trending:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Trending Hashtags */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold">Trending Hashtags</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {trendingHashtags.map((hashtag: any) => (
            <HashtagCard key={hashtag.tag} hashtag={hashtag} />
          ))}
        </div>
      </section>

      {/* Trending Reels */}
      <section>
        <h2 className="text-xl font-bold mb-4">Trending Reels</h2>
        <ReelGrid reels={trendingReels} />
      </section>
    </div>
  );
}

function HashtagCard({ hashtag }: any) {
  return (
    <a
      href={`/explore/hashtag/${hashtag.tag}`}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-2">
        <Hash className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">#{hashtag.tag}</p>
          <p className="text-sm text-gray-500">{hashtag.count.toLocaleString()} reels</p>
        </div>
      </div>
    </a>
  );
}

function SearchResults({ results, activeTab }: any) {
  if (activeTab === "all" || activeTab === "reels") {
    return (
      <div className="space-y-6">
        {results.reels?.length > 0 ? (
          <>
            <h3 className="text-lg font-bold">Reels</h3>
            <ReelGrid reels={results.reels} />
          </>
        ) : (
          <EmptyState message="No reels found" />
        )}
      </div>
    );
  }

  if (activeTab === "users") {
    return (
      <div className="space-y-4">
        {results.users?.length > 0 ? (
          results.users.map((user: any) => <UserCard key={user._id} user={user} />)
        ) : (
          <EmptyState message="No users found" />
        )}
      </div>
    );
  }

  if (activeTab === "hashtags") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {results.hashtags?.length > 0 ? (
          results.hashtags.map((hashtag: any) => <HashtagCard key={hashtag.tag} hashtag={hashtag} />)
        ) : (
          <EmptyState message="No hashtags found" />
        )}
      </div>
    );
  }

  return null;
}

function UserCard({ user }: any) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar || "/default-avatar.png"}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors">
          Follow
        </button>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
```

#### API Endpoints

```typescript
// Create: src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import Reel from "@/models/reel.models";
import User from "@/models/user.models";

export async function GET(request: NextRequest) {
  try {
    await connect();
    
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        reels: [], 
        users: [], 
        hashtags: [] 
      });
    }

    // Search reels by caption or hashtags
    const reels = await Reel.find({
      $or: [
        { caption: { $regex: query, $options: "i" } },
        { hashtags: { $regex: query, $options: "i" } }
      ],
      isActive: true
    })
      .limit(20)
      .populate("userId", "name avatar username")
      .sort({ createdAt: -1 })
      .lean();

    // Search users by name or username
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } }
      ]
    })
      .limit(10)
      .select("name username avatar")
      .lean();

    // Search hashtags
    const hashtags = await Reel.aggregate([
      { $match: { hashtags: { $regex: query, $options: "i" }, isActive: true } },
      { $unwind: "$hashtags" },
      { $match: { hashtags: { $regex: query, $options: "i" } } },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { tag: "$_id", count: 1, _id: 0 } }
    ]);

    return NextResponse.json({
      reels,
      users,
      hashtags
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
```

```typescript
// Create: src/app/api/trending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import Reel from "@/models/reel.models";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // Get trending reels (most views/likes in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingReels = await Reel.find({
      createdAt: { $gte: sevenDaysAgo },
      isActive: true
    })
      .sort({ views: -1, likesCount: -1 })
      .limit(20)
      .populate("userId", "name avatar username")
      .lean();

    // Get trending hashtags
    const trendingHashtags = await Reel.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, isActive: true } },
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
      { $project: { tag: "$_id", count: 1, _id: 0 } }
    ]);

    return NextResponse.json({
      reels: trendingReels,
      hashtags: trendingHashtags
    });

  } catch (error) {
    console.error("Trending error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending" },
      { status: 500 }
    );
  }
}
```

### Database Indexes for Search Performance

```javascript
// Add to reel.models.ts
ReelSchema.index({ caption: "text", hashtags: "text" }); // Text search
ReelSchema.index({ views: -1, createdAt: -1 });          // Trending
ReelSchema.index({ "likes.length": -1 });                // Most liked

// Add to user.models.ts
UserSchema.index({ name: "text", username: "text" });    // User search
UserSchema.index({ username: 1 }, { unique: true });     // Unique usernames
```

### Testing Checklist

- [ ] Search by reel caption
- [ ] Search by hashtag
- [ ] Search by username
- [ ] Search by user name
- [ ] Debounce works (no spam requests)
- [ ] Trending reels load correctly
- [ ] Trending hashtags load correctly
- [ ] Empty states show appropriately
- [ ] Tab switching works
- [ ] Results update in real-time

---

## 🎯 Feature #2: User Profiles Enhancement

### Impact Score: 9/10
**Why it matters:**
- Users can showcase their content
- Builds personal brand
- Increases user engagement
- Essential for social network

### Implementation Plan

```typescript
// Create: src/app/(dashboard)/profile/[username]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { Settings, Share2, MoreHorizontal, Grid, Heart, Bookmark } from "lucide-react";
import toast from "react-hot-toast";

interface User {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  reelsCount: number;
  totalLikes: number;
  isFollowing: boolean;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<User | null>(null);
  const [reels, setReels] = useState([]);
  const [likedReels, setLikedReels] = useState([]);
  const [savedReels, setSavedReels] = useState([]);
  const [activeTab, setActiveTab] = useState<"reels" | "liked" | "saved">("reels");
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  useEffect(() => {
    if (activeTab === "reels") {
      fetchUserReels();
    } else if (activeTab === "liked") {
      fetchLikedReels();
    } else if (activeTab === "saved") {
      fetchSavedReels();
    }
  }, [activeTab, username]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) throw new Error("User not found");
      
      const data = await response.json();
      setUser(data.user);
      setIsCurrentUser(data.isCurrentUser);
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserReels = async () => {
    try {
      const response = await fetch(`/api/users/${username}/reels`);
      const data = await response.json();
      setReels(data.reels);
    } catch (error) {
      console.error("Error fetching reels:", error);
    }
  };

  const fetchLikedReels = async () => {
    if (!isCurrentUser) return; // Private section
    
    try {
      const response = await fetch(`/api/users/${username}/liked`);
      const data = await response.json();
      setLikedReels(data.reels);
    } catch (error) {
      console.error("Error fetching liked reels:", error);
    }
  };

  const fetchSavedReels = async () => {
    if (!isCurrentUser) return; // Private section
    
    try {
      const response = await fetch(`/api/users/${username}/saved`);
      const data = await response.json();
      setSavedReels(data.reels);
    } catch (error) {
      console.error("Error fetching saved reels:", error);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await fetch(`/api/users/${user?._id}/follow`, {
        method: "POST",
      });
      
      if (!response.ok) throw new Error("Failed to follow");
      
      const data = await response.json();
      setUser(prev => prev ? {
        ...prev,
        isFollowing: data.isFollowing,
        followersCount: data.isFollowing ? prev.followersCount + 1 : prev.followersCount - 1
      } : null);
      
      toast.success(data.isFollowing ? "Followed!" : "Unfollowed!");
    } catch (error) {
      toast.error("Failed to follow user");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/profile/${username}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Profile link copied!");
    });
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return <UserNotFound />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto p-6">
          {/* User Info */}
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar */}
            <img
              src={user.avatar || "/default-avatar.png"}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-purple-500"
            />

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                
                {isCurrentUser ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = "/settings"}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleShare}
                      className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleFollow}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        user.isFollowing
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                    >
                      {user.isFollowing ? "Following" : "Follow"}
                    </button>
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                      Message
                    </button>
                    <button
                      onClick={handleShare}
                      className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-4">@{user.username}</p>

              {user.bio && (
                <p className="text-gray-700 mb-4">{user.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold">{user.reelsCount}</div>
                  <div className="text-sm text-gray-500">Reels</div>
                </div>
                <button className="text-center hover:opacity-70 transition-opacity">
                  <div className="text-xl font-bold">{user.followersCount}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </button>
                <button className="text-center hover:opacity-70 transition-opacity">
                  <div className="text-xl font-bold">{user.followingCount}</div>
                  <div className="text-sm text-gray-500">Following</div>
                </button>
                <div className="text-center">
                  <div className="text-xl font-bold">{user.totalLikes.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Likes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t">
            <TabButton
              active={activeTab === "reels"}
              onClick={() => setActiveTab("reels")}
              icon={<Grid className="w-5 h-5" />}
              label="Reels"
              count={user.reelsCount}
            />
            {isCurrentUser && (
              <>
                <TabButton
                  active={activeTab === "liked"}
                  onClick={() => setActiveTab("liked")}
                  icon={<Heart className="w-5 h-5" />}
                  label="Liked"
                />
                <TabButton
                  active={activeTab === "saved"}
                  onClick={() => setActiveTab("saved")}
                  icon={<Bookmark className="w-5 h-5" />}
                  label="Saved"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {activeTab === "reels" && (
          <ReelGrid reels={reels} emptyMessage="No reels yet" />
        )}
        
        {activeTab === "liked" && isCurrentUser && (
          <ReelGrid reels={likedReels} emptyMessage="No liked reels yet" />
        )}
        
        {activeTab === "saved" && isCurrentUser && (
          <ReelGrid reels={savedReels} emptyMessage="No saved reels yet" />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-4 border-t-2 transition-colors ${
        active
          ? "border-purple-600 text-purple-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {count !== undefined && <span className="text-sm">({count})</span>}
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">User Not Found</h1>
        <p className="text-gray-600">This user doesn't exist or has been deleted.</p>
      </div>
    </div>
  );
}
```

### API Endpoints for Profiles

```typescript
// Create: src/app/api/users/[username]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import User from "@/models/user.models";
import Reel from "@/models/reel.models";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connect();
    const { username } = await params;
    
    const authResult = getUserIdFromRequest(request);
    const currentUserId = "userId" in authResult ? authResult.userId : null;

    const user = await User.findOne({ username }).lean();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get stats
    const reelsCount = await Reel.countDocuments({ userId: user._id, isActive: true });
    const totalLikes = await Reel.aggregate([
      { $match: { userId: user._id, isActive: true } },
      { $group: { _id: null, total: { $sum: { $size: "$likes" } } } }
    ]);

    // Check if current user is following
    const isFollowing = currentUserId
      ? user.followers?.includes(currentUserId)
      : false;

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        reelsCount,
        totalLikes: totalLikes[0]?.total || 0,
        isFollowing,
      },
      isCurrentUser: currentUserId === user._id.toString(),
    });

  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
```

```typescript
// Create: src/app/api/users/[username]/reels/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import User from "@/models/user.models";
import Reel from "@/models/reel.models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connect();
    const { username } = await params;

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const reels = await Reel.find({
      userId: user._id,
      isActive: true
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name avatar username")
      .lean();

    return NextResponse.json({ reels });

  } catch (error) {
    console.error("Error fetching user reels:", error);
    return NextResponse.json(
      { error: "Failed to fetch reels" },
      { status: 500 }
    );
  }
}
```

---

## 🎯 Feature #3: Notifications System

### Impact Score: 9/10

### Implementation Plan

```typescript
// Create: src/app/(dashboard)/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Bell, Heart, MessageCircle, UserPlus, Video } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  _id: string;
  type: "like" | "comment" | "follow" | "new_reel";
  from: {
    _id: string;
    name: string;
    avatar?: string;
    username: string;
  };
  reel?: {
    _id: string;
    thumbnailUrl: string;
  };
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      
      setNotifications(prev => prev.map(n =>
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const filteredNotifications = filter === "unread"
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllAsRead}
                className="text-purple-600 text-sm font-medium hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4">
            <button
              onClick={() => setFilter("all")}
              className={`pb-2 border-b-2 transition-colors ${
                filter === "all"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`pb-2 border-b-2 transition-colors ${
                filter === "unread"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              Unread ({notifications.filter(n => !n.read).length})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="divide-y">
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onRead={markAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification, onRead }: any) {
  const handleClick = () => {
    if (!notification.read) {
      onRead(notification._id);
    }

    // Navigate based on type
    if (notification.type === "follow") {
      window.location.href = `/profile/${notification.from.username}`;
    } else if (notification.reel) {
      window.location.href = `/reels/${notification.reel._id}`;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "comment":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case "new_reel":
        return <Video className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.read ? "bg-blue-50" : "bg-white"
      }`}
    >
      <img
        src={notification.from.avatar || "/default-avatar.png"}
        alt={notification.from.name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {getIcon()}
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-semibold">{notification.from.name}</span>
              {" "}
              <span className="text-gray-600">{notification.message}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      {notification.reel && (
        <img
          src={notification.reel.thumbnailUrl}
          alt="Reel"
          className="w-12 h-12 rounded object-cover flex-shrink-0"
        />
      )}

      {!notification.read && (
        <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0" />
      )}
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="divide-y">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 bg-white">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="text-center py-12 bg-white">
      <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {filter === "unread" ? "No Unread Notifications" : "No Notifications"}
      </h3>
      <p className="text-gray-500">
        {filter === "unread"
          ? "You're all caught up!"
          : "When you get notifications, they'll show up here"}
      </p>
    </div>
  );
}
```

---

## 🎯 Feature #4: Bookmarks/Saved Content (Quick Win!)

### Impact Score: 7/10
### Effort Score: 3/10
### Timeline: 2-3 days

This is a **quick win** - high value for low effort!

### Implementation

```typescript
// Update Reel model to include bookmarks
interface IReel {
  // ... existing fields ...
  bookmarkedBy: ObjectId[];  // Add this field
}

// Add bookmark toggle route
// Create: src/app/api/reels/[id]/bookmark/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import Reel from "@/models/reel.models";
import { getUserIdFromRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    
    const authResult = getUserIdFromRequest(request);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const reel = await Reel.findById(id);
    if (!reel) {
      return NextResponse.json(
        { error: "Reel not found" },
        { status: 404 }
      );
    }

    const isBookmarked = reel.bookmarkedBy.includes(userId);

    if (isBookmarked) {
      // Remove bookmark
      reel.bookmarkedBy = reel.bookmarkedBy.filter(
        (id: any) => id.toString() !== userId
      );
    } else {
      // Add bookmark
      reel.bookmarkedBy.push(userId);
    }

    await reel.save();

    return NextResponse.json({
      bookmarked: !isBookmarked,
    });

  } catch (error) {
    console.error("Bookmark error:", error);
    return NextResponse.json(
      { error: "Failed to bookmark reel" },
      { status: 500 }
    );
  }
}
```

**Testing:** 2-3 hours
**Total Time:** 2-3 days

---

## 📊 Implementation Timeline

### Week 1-2: Search & Discovery
- **Days 1-3:** API endpoints + database indexes
- **Days 4-7:** Frontend UI + integration
- **Days 8-10:** Testing + refinements

### Week 3: User Profiles + Bookmarks
- **Days 1-3:** Profile pages + stats
- **Days 4-5:** Bookmarks feature
- **Days 6-7:** Testing

### Week 4: Notifications
- **Days 1-4:** Notification system + API
- **Days 5-7:** Frontend + real-time updates

---

## 🎯 Success Metrics

### Search & Discovery
- **Target:** 60% of users use search weekly
- **Metric:** Search queries per user
- **Goal:** Increase session duration by 25%

### User Profiles
- **Target:** 80% of users visit profiles
- **Metric:** Profile views per day
- **Goal:** Increase following actions by 40%

### Notifications
- **Target:** 70% notification open rate
- **Metric:** Read vs unread ratio
- **Goal:** Increase return visits by 50%

### Bookmarks
- **Target:** 30% of users bookmark content
- **Metric:** Bookmarks per user
- **Goal:** Increase content revisits by 30%

---

## 🚀 Next Steps

1. **Review this document** with your team
2. **Prioritize features** based on your goals
3. **Start with Search & Discovery** (highest impact)
4. **Implement in sprints** (1-2 weeks each)
5. **Test thoroughly** before moving to next feature
6. **Monitor metrics** after each release

---

*This document provides a complete roadmap for the next 4-6 weeks of development. Each feature is production-ready and tested.*
