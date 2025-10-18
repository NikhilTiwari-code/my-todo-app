# 🚀 Next Features, UI Improvements & Redux Toolkit Integration Guide

## Table of Contents
1. [Adding Upload/Delete to Reels](#1-adding-uploaddelete-to-reels)
2. [Next Feature Recommendations](#2-next-feature-recommendations)
3. [UI/UX Improvements](#3-uiux-improvements)
4. [Redux Toolkit Setup for Large Applications](#4-redux-toolkit-setup)
5. [Migration Strategy](#5-migration-strategy)

---

## 1. Adding Upload/Delete to Reels

### ✅ Fix 1: Add Upload Button to Reels Feed

```tsx
// Update: src/app/(dashboard)/reels/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ReelCard } from "@/components/reels/ReelCard";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ... existing interfaces ...

export default function ReelsPage() {
  const router = useRouter();
  // ... existing state ...

  return (
    <div className="relative">
      {/* Fixed Upload Button */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          onClick={() => router.push("/reels/upload")}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Reel
        </Button>
      </div>

      {/* Existing scroll container */}
      <div className="snap-y snap-mandatory h-screen overflow-y-scroll">
        {/* ... existing reels mapping ... */}
      </div>
    </div>
  );
}
```

### ✅ Fix 2: Add Delete Functionality to ReelCard

```tsx
// Update: src/components/reels/ReelCard.tsx

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  onLike: (reelId: string) => void;
  onComment: (reelId: string, text: string) => void;
  onShare: (reelId: string) => void;
  onDelete?: (reelId: string) => void; // Add this
  currentUserId?: string; // Add this to check ownership
  onVideoEnd?: () => void;
  onVideoStart?: () => void;
}

export function ReelCard({
  reel,
  isActive,
  onLike,
  onComment,
  onShare,
  onDelete,
  currentUserId,
  onVideoEnd,
  onVideoStart,
}: ReelCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const isOwner = currentUserId === reel.user._id;

  const handleDelete = async () => {
    if (!onDelete) return;
    
    const confirmed = window.confirm("Delete this reel? This cannot be undone.");
    if (confirmed) {
      onDelete(reel._id);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Player */}
      <ReelPlayer
        videoUrl={reel.videoUrl}
        thumbnailUrl={reel.thumbnailUrl}
        isActive={isActive}
        onVideoEnd={onVideoEnd}
        onVideoStart={onVideoStart}
      />

      {/* User Info Overlay */}
      <div className="absolute top-4 left-4 right-16 flex items-center space-x-3">
        <img
          src={reel.user.avatar || "/default-avatar.png"}
          alt={reel.user.name}
          className="w-10 h-10 rounded-full border-2 border-white"
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {reel.user.name}
          </p>
          <p className="text-white/70 text-xs truncate">
            @{reel.user.username}
          </p>
        </div>
        
        {/* Options Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {showOptions && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl py-2 min-w-[150px] z-50">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/reels/${reel._id}`);
                  setShowOptions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                Copy Link
              </button>
              
              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      // Navigate to edit page (create this later)
                      window.location.href = `/reels/${reel._id}/edit`;
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </>
              )}
              
              {!isOwner && (
                <button
                  onClick={() => {
                    setShowOptions(false);
                    alert("Report feature coming soon");
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rest of the component remains the same */}
      {/* ... */}
    </div>
  );
}
```

### ✅ Fix 3: Update Reels Page with Delete Handler

```tsx
// Update in: src/app/(dashboard)/reels/page.tsx

export default function ReelsPage() {
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  // ... other state ...

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData._id);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Handle delete action
  const handleDelete = async (reelId: string) => {
    try {
      const response = await fetch(`/api/reels/${reelId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reel");
      }

      // Remove from local state
      setReels(prev => prev.filter(reel => reel._id !== reelId));
      
      alert("Reel deleted successfully!");

    } catch (error) {
      console.error("Error deleting reel:", error);
      alert("Failed to delete reel. Please try again.");
    }
  };

  // ... rest of the code ...

  return (
    <div className="relative">
      {/* Upload Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => router.push("/reels/upload")}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Reel
        </Button>
      </div>

      <div className="snap-y snap-mandatory h-screen overflow-y-scroll">
        {reels.map((reel, index) => (
          <div
            key={reel._id}
            className="snap-start h-screen flex items-center justify-center"
          >
            <div className="w-full max-w-sm mx-auto h-full">
              <ReelCard
                reel={reel}
                isActive={index === currentIndex}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onDelete={handleDelete}
                currentUserId={currentUserId}
                onVideoEnd={index === currentIndex ? handleVideoEnd : undefined}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 2. Next Feature Recommendations

### 🎯 Priority 1: Essential Features (Implement First)

#### A. **Advanced Search & Discovery**
- **Hashtag Search**: Click hashtags to see all reels with that tag
- **User Search**: Find users by name/username
- **Trending Page**: Algorithm-based trending reels
- **Explore Grid**: Category-based discovery (comedy, dance, education, etc.)

**Implementation:**
```tsx
// Create: src/app/(dashboard)/explore/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, Hash } from "lucide-react";

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<"trending" | "hashtags" | "users">("trending");
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="sticky top-0 bg-white border-b p-4 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reels, users, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 p-4 border-b bg-white">
        <button
          onClick={() => setActiveTab("trending")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "trending"
              ? "bg-purple-100 text-purple-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Trending
        </button>
        <button
          onClick={() => setActiveTab("hashtags")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "hashtags"
              ? "bg-purple-100 text-purple-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Hash className="w-4 h-4 inline mr-2" />
          Hashtags
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "users"
              ? "bg-purple-100 text-purple-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Users
        </button>
      </div>

      {/* Content based on active tab */}
      {/* Implement grid layouts for each tab */}
    </div>
  );
}
```

#### B. **User Profiles with Reels Tab**
- Profile page showing user's reels in grid format
- Liked reels section (private)
- Saved/Bookmarked reels

**Create API:**
```typescript
// Create: src/app/api/users/[userId]/reels/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import Reel from "@/models/reel.models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connect();
    const { userId } = await params;

    const reels = await Reel.find({ 
      userId,
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name avatar username")
      .lean();

    return NextResponse.json({ 
      reels,
      total: reels.length 
    });

  } catch (error) {
    console.error("Error fetching user reels:", error);
    return NextResponse.json(
      { error: "Failed to fetch user reels" },
      { status: 500 }
    );
  }
}
```

#### C. **Notifications System**
- Real-time notifications for likes, comments, follows
- Notification bell with unread count
- In-app notification center

#### D. **Bookmarks/Saved Reels**
- Save reels to watch later
- Private collection
- Categories/playlists

### 🎯 Priority 2: Engagement Features

#### E. **Duets & Remixes**
- Split-screen video recording with original reel
- React to other users' reels
- Stitching videos together

#### F. **Live Streaming**
- Go live feature
- Live comments and reactions
- Save live streams as reels

#### G. **Challenges & Trends**
- Create challenges (hashtag-based)
- Join trending challenges
- Challenge leaderboards

#### H. **Advanced Video Features**
- Video filters and effects
- Speed control (slow-mo, time-lapse)
- Trim/crop video before posting
- Multi-clip recording
- Green screen effects

### 🎯 Priority 3: Social Features

#### I. **Direct Messaging Enhancement**
- Send reels in DMs
- Share to story from reels
- Collaborative reels

#### J. **Creator Analytics**
- View count analytics
- Engagement rate tracking
- Audience demographics
- Best posting times

#### K. **Monetization Features**
- Creator fund eligibility
- Tip jar / Donations
- Brand partnerships marketplace
- Premium content subscriptions

---

## 3. UI/UX Improvements

### 🎨 Visual Improvements

#### A. **Add Loading Skeletons**
```tsx
// Create: src/components/ui/ReelSkeleton.tsx
export function ReelSkeleton() {
  return (
    <div className="h-screen bg-gray-900 animate-pulse">
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-full max-w-sm">
          {/* Video placeholder */}
          <div className="aspect-[9/16] bg-gray-800 rounded-lg" />
          
          {/* User info skeleton */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="w-10 h-10 bg-gray-700 rounded-full" />
            <div className="space-y-2">
              <div className="w-24 h-3 bg-gray-700 rounded" />
              <div className="w-16 h-2 bg-gray-700 rounded" />
            </div>
          </div>
          
          {/* Action buttons skeleton */}
          <div className="absolute bottom-20 right-4 space-y-4">
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### B. **Smooth Transitions & Animations**
```tsx
// Update animations in ReelCard.tsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ duration: 0.3 }}
  className="relative w-full h-full bg-black"
>
  {/* Reel content */}
</motion.div>
```

Install Framer Motion:
```bash
npm install framer-motion
```

#### C. **Better Video Player Controls**
```tsx
// Enhanced controls in ReelPlayer.tsx
- Volume slider (not just mute)
- Playback speed options (0.5x, 1x, 1.5x, 2x)
- Picture-in-Picture mode
- Quality selector (Auto, 720p, 480p, 360p)
- Fullscreen toggle
```

#### D. **Improved Upload Experience**
```tsx
// Update ReelUpload.tsx with:
- Drag & drop support
- Video trimming UI
- Thumbnail selection from frames
- Add music/sounds library
- Add filters preview
- Batch upload multiple reels
```

#### E. **Dark/Light Mode Toggle**
```tsx
// Create: src/contexts/ThemeContext.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

#### F. **Toast Notifications Instead of Alerts**
```bash
npm install react-hot-toast
```

```tsx
// Update all alert() calls to use toast
import toast from "react-hot-toast";

// Instead of: alert("Comment added successfully!");
toast.success("Comment added successfully!");

// Instead of: alert("Failed to load reels");
toast.error("Failed to load reels");
```

#### G. **Infinite Scroll Optimization**
```tsx
// Use Intersection Observer for better performance
import { useInView } from "react-intersection-observer";

export default function ReelsPage() {
  const { ref, inView } = useInView({
    threshold: 0.8,
  });

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      fetchReels(nextCursor);
    }
  }, [inView, hasMore, isLoading]);

  // Attach ref to loading trigger element
}
```

Install:
```bash
npm install react-intersection-observer
```

### 🎯 UX Improvements

#### H. **Swipe Gestures (Mobile)**
```bash
npm install react-swipeable
```

```tsx
import { useSwipeable } from "react-swipeable";

const handlers = useSwipeable({
  onSwipedUp: () => nextReel(),
  onSwipedDown: () => previousReel(),
  preventDefaultTouchmoveEvent: true,
  trackMouse: true,
});

<div {...handlers}>
  {/* Reels content */}
</div>
```

#### I. **Keyboard Shortcuts**
```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        previousReel();
        break;
      case "ArrowDown":
        nextReel();
        break;
      case " ": // Spacebar
        togglePlayPause();
        break;
      case "l":
        handleLike();
        break;
      case "m":
        toggleMute();
        break;
    }
  };

  window.addEventListener("keydown", handleKeyPress);
  return () => window.removeEventListener("keydown", handleKeyPress);
}, []);
```

#### J. **Progressive Web App (PWA)**
```tsx
// Update next.config.ts
import withPWA from "next-pwa";

const config = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
});

export default config;
```

Install:
```bash
npm install next-pwa
```

#### K. **Error Boundaries**
```tsx
// Create: src/components/ErrorBoundary.tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 4. Redux Toolkit Setup for Large Applications

### ✅ YES, You Should Use Redux Toolkit!

**Why Redux Toolkit for Your App:**
- ✅ You have multiple features (Todos, Feed, Stories, Reels, Messages, Video Calls)
- ✅ Shared state across many components (user, notifications, socket connections)
- ✅ Complex async operations (API calls, real-time updates)
- ✅ Need for predictable state management
- ✅ Growing application complexity

### 📦 Installation

```bash
npm install @reduxjs/toolkit react-redux
```

### 🏗️ Redux Architecture for Your App

```
src/
├── store/
│   ├── index.ts                    # Store configuration
│   ├── hooks.ts                    # Typed hooks
│   └── slices/
│       ├── authSlice.ts           # User authentication state
│       ├── todosSlice.ts          # Todos state
│       ├── feedSlice.ts           # Feed posts state
│       ├── reelsSlice.ts          # Reels state
│       ├── storiesSlice.ts        # Stories state
│       ├── messagesSlice.ts       # Messages/Chat state
│       ├── notificationsSlice.ts  # Notifications state
│       ├── socketSlice.ts         # Socket connection state
│       └── uiSlice.ts             # UI state (modals, themes, etc.)
```

### 🔧 Step-by-Step Implementation

#### Step 1: Create Store Configuration

```typescript
// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "./slices/authSlice";
import todosReducer from "./slices/todosSlice";
import feedReducer from "./slices/feedSlice";
import reelsReducer from "./slices/reelsSlice";
import storiesReducer from "./slices/storiesSlice";
import messagesReducer from "./slices/messagesSlice";
import notificationsReducer from "./slices/notificationsSlice";
import socketReducer from "./slices/socketSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    todos: todosReducer,
    feed: feedReducer,
    reels: reelsReducer,
    stories: storiesReducer,
    messages: messagesReducer,
    notifications: notificationsReducer,
    socket: socketReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore socket instances in state
        ignoredActions: ["socket/setSocket"],
        ignoredPaths: ["socket.instance"],
      },
    }),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### Step 2: Create Typed Hooks

```typescript
// src/store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

#### Step 3: Create Auth Slice (Example)

```typescript
// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  username?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching current user
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/auth/me");
      
      if (!response.ok) {
        return rejectWithValue("Not authenticated");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Synchronous actions
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearAuth, updateUser } = authSlice.actions;
export default authSlice.reducer;
```

#### Step 4: Create Reels Slice

```typescript
// src/store/slices/reelsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface User {
  _id: string;
  name: string;
  avatar?: string;
  username?: string;
}

interface Reel {
  _id: string;
  user: User;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  duration: number;
  views: number;
  likes: User[];
  likesCount: number;
  comments: any[];
  commentsCount: number;
  hashtags: string[];
  music?: string;
  isLiked: boolean;
  createdAt: string;
}

interface ReelsState {
  reels: Reel[];
  currentIndex: number;
  isLoading: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  error: string | null;
  uploadProgress: number;
  isUploading: boolean;
}

const initialState: ReelsState = {
  reels: [],
  currentIndex: 0,
  isLoading: false,
  hasMore: true,
  nextCursor: null,
  error: null,
  uploadProgress: 0,
  isUploading: false,
};

// Async thunk for fetching reels
export const fetchReels = createAsyncThunk(
  "reels/fetchReels",
  async (cursor: string | undefined, { rejectWithValue }) => {
    try {
      const url = cursor
        ? `/api/reels?cursor=${cursor}&limit=5`
        : "/api/reels?limit=5";

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch reels");
      }

      const data = await response.json();
      return { data, cursor };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for liking/unliking reel
export const toggleLikeReel = createAsyncThunk(
  "reels/toggleLike",
  async (reelId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/reels/${reelId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to like reel");
      }

      const data = await response.json();
      return { reelId, ...data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for adding comment
export const addComment = createAsyncThunk(
  "reels/addComment",
  async ({ reelId, text }: { reelId: string; text: string }, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/reels/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reelId, text }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const data = await response.json();
      return { reelId, comment: data.comment };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting reel
export const deleteReel = createAsyncThunk(
  "reels/deleteReel",
  async (reelId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/reels/${reelId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reel");
      }

      return reelId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const reelsSlice = createSlice({
  name: "reels",
  initialState,
  reducers: {
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },
    incrementViews: (state, action: PayloadAction<string>) => {
      const reel = state.reels.find(r => r._id === action.payload);
      if (reel) {
        reel.views += 1;
      }
    },
    clearReels: (state) => {
      state.reels = [];
      state.currentIndex = 0;
      state.hasMore = true;
      state.nextCursor = null;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch reels
    builder
      .addCase(fetchReels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReels.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload.cursor) {
          // Append to existing reels
          state.reels = [...state.reels, ...action.payload.data.reels];
        } else {
          // Replace reels
          state.reels = action.payload.data.reels;
        }
        
        state.hasMore = action.payload.data.hasMore;
        state.nextCursor = action.payload.data.nextCursor;
      })
      .addCase(fetchReels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Toggle like
    builder
      .addCase(toggleLikeReel.fulfilled, (state, action) => {
        const reel = state.reels.find(r => r._id === action.payload.reelId);
        if (reel) {
          reel.isLiked = action.payload.liked;
          reel.likesCount = action.payload.likesCount;
        }
      });

    // Add comment
    builder
      .addCase(addComment.fulfilled, (state, action) => {
        const reel = state.reels.find(r => r._id === action.payload.reelId);
        if (reel) {
          reel.comments.push(action.payload.comment);
          reel.commentsCount += 1;
        }
      });

    // Delete reel
    builder
      .addCase(deleteReel.fulfilled, (state, action) => {
        state.reels = state.reels.filter(r => r._id !== action.payload);
      });
  },
});

export const { 
  setCurrentIndex, 
  incrementViews, 
  clearReels,
  setUploadProgress 
} = reelsSlice.actions;

export default reelsSlice.reducer;
```

#### Step 5: Create UI Slice (Theme, Modals, etc.)

```typescript
// src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  activeModal: string | null;
  notifications: Array<{
    id: string;
    type: "success" | "error" | "info" | "warning";
    message: string;
    duration?: number;
  }>;
}

const initialState: UIState = {
  theme: "light",
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  activeModal: null,
  notifications: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", state.theme);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    addNotification: (state, action: PayloadAction<Omit<UIState["notifications"][0], "id">>) => {
      const id = Date.now().toString();
      state.notifications.push({ id, ...action.payload });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  toggleSidebar,
  toggleMobileMenu,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
```

#### Step 6: Create Provider Component

```tsx
// src/components/providers/ReduxProvider.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/store";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

#### Step 7: Wrap App with Provider

```tsx
// src/app/layout.tsx
import { ReduxProvider } from "@/components/providers/ReduxProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
```

#### Step 8: Use Redux in Components

```tsx
// src/app/(dashboard)/reels/page.tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  fetchReels, 
  toggleLikeReel, 
  addComment, 
  deleteReel,
  setCurrentIndex 
} from "@/store/slices/reelsSlice";
import { ReelCard } from "@/components/reels/ReelCard";
import { ReelSkeleton } from "@/components/ui/ReelSkeleton";

export default function ReelsPage() {
  const dispatch = useAppDispatch();
  
  // Select state from Redux
  const { 
    reels, 
    currentIndex, 
    isLoading, 
    hasMore, 
    nextCursor 
  } = useAppSelector((state) => state.reels);
  
  const { user } = useAppSelector((state) => state.auth);

  // Initial load
  useEffect(() => {
    dispatch(fetchReels(undefined));
  }, [dispatch]);

  // Handle like
  const handleLike = (reelId: string) => {
    dispatch(toggleLikeReel(reelId));
  };

  // Handle comment
  const handleComment = (reelId: string, text: string) => {
    dispatch(addComment({ reelId, text }));
  };

  // Handle delete
  const handleDelete = (reelId: string) => {
    if (window.confirm("Delete this reel?")) {
      dispatch(deleteReel(reelId));
    }
  };

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      const reelHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const newIndex = Math.round(scrollY / reelHeight);
      dispatch(setCurrentIndex(Math.min(newIndex, reels.length - 1)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reels.length, dispatch]);

  // Load more reels
  useEffect(() => {
    if (currentIndex >= reels.length - 2 && hasMore && !isLoading && nextCursor) {
      dispatch(fetchReels(nextCursor));
    }
  }, [currentIndex, reels.length, hasMore, isLoading, nextCursor, dispatch]);

  if (isLoading && reels.length === 0) {
    return <ReelSkeleton />;
  }

  return (
    <div className="snap-y snap-mandatory h-screen overflow-y-scroll">
      {reels.map((reel, index) => (
        <div
          key={reel._id}
          className="snap-start h-screen flex items-center justify-center"
        >
          <div className="w-full max-w-sm mx-auto h-full">
            <ReelCard
              reel={reel}
              isActive={index === currentIndex}
              onLike={handleLike}
              onComment={handleComment}
              onDelete={handleDelete}
              currentUserId={user?._id}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 5. Migration Strategy

### 📋 Phased Migration Plan

#### **Phase 1: Setup (Week 1)**
- ✅ Install Redux Toolkit
- ✅ Create store structure
- ✅ Create typed hooks
- ✅ Add Redux Provider
- ✅ Create UI slice (low risk)

#### **Phase 2: Auth Migration (Week 2)**
- ✅ Migrate authentication state
- ✅ Update login/logout flows
- ✅ Test thoroughly
- ✅ Keep old code as backup

#### **Phase 3: Feature Migration (Weeks 3-5)**
- Week 3: Migrate Reels
- Week 4: Migrate Feed & Stories
- Week 5: Migrate Todos & Messages

#### **Phase 4: Real-time Integration (Week 6)**
- ✅ Create Socket slice
- ✅ Integrate with Redux
- ✅ Update real-time listeners

#### **Phase 5: Optimization (Week 7)**
- ✅ Add Redux DevTools
- ✅ Implement selectors (Reselect)
- ✅ Optimize re-renders
- ✅ Add persistence

### 🚀 Quick Wins with Redux

```typescript
// Persist Redux state to localStorage
npm install redux-persist

// src/store/index.ts (with persistence)
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui"], // Only persist these slices
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);
```

### 🎯 Best Practices

1. **Keep slices small and focused**
2. **Use createAsyncThunk for API calls**
3. **Normalize data when needed**
4. **Use Reselect for derived state**
5. **Avoid storing derived/computed values**
6. **Keep forms local (don't put in Redux unless needed)**
7. **Use Redux DevTools for debugging**

---

## 📊 Feature Priority Matrix

| Feature | Impact | Effort | Priority | Timeline |
|---------|--------|--------|----------|----------|
| Upload/Delete Reels | 🔥 Critical | Low | 1 | 1 day |
| Search & Discovery | High | Medium | 2 | 1 week |
| User Profiles | High | Low | 3 | 3 days |
| Notifications | High | Medium | 4 | 1 week |
| Bookmarks | Medium | Low | 5 | 2 days |
| Redux Setup | High | High | 6 | 2 weeks |
| Dark Mode | Medium | Low | 7 | 1 day |
| Toast Notifications | Medium | Low | 8 | 1 day |
| Analytics Dashboard | Medium | High | 9 | 2 weeks |
| Duets/Remixes | Low | High | 10 | 3 weeks |

---

## 🎓 Learning Resources

### Redux Toolkit
- Official Docs: https://redux-toolkit.js.org/
- Redux Essentials Tutorial: https://redux.js.org/tutorials/essentials/part-1-overview-concepts
- Best Practices: https://redux.js.org/style-guide/

### Performance
- React Re-renders: https://kentcdodds.com/blog/fix-the-slow-render-before-you-fix-the-re-render
- Redux Performance: https://redux.js.org/faq/performance

---

## 📝 Summary

### Immediate Actions:
1. ✅ Add Upload/Delete buttons to Reels (1 day)
2. ✅ Implement toast notifications (1 day)
3. ✅ Add loading skeletons (1 day)
4. ✅ Create Search/Explore page (1 week)

### Medium-term Actions:
5. ✅ Set up Redux Toolkit (2 weeks)
6. ✅ Migrate state management gradually
7. ✅ Add user profiles with reels grid
8. ✅ Implement notifications system

### Long-term Actions:
9. ✅ Advanced video features (filters, effects)
10. ✅ Creator analytics dashboard
11. ✅ Monetization features
12. ✅ Live streaming

---

**Need help implementing any of these features? Let me know which one you'd like to start with!** 🚀
