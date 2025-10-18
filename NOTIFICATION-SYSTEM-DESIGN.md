# 🔔 Notification System - Complete Architecture

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Real-time Flow](#real-time-flow)
5. [Redis Integration](#redis-integration)
6. [Frontend Components](#frontend-components)
7. [Implementation Steps](#implementation-steps)

---

## 🏗️ System Overview

### Architecture Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTION                               │
│  (Like Post, Comment, Follow, Mention)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API ROUTE HANDLER                             │
│  (e.g., /api/feed/like, /api/feed/comment)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CREATE NOTIFICATION                             │
│  - Save to MongoDB (notifications collection)                   │
│  - Add to Redis queue (unread count)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ├──────────────┬─────────────────┐
                            ▼              ▼                 ▼
                    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
                    │ Socket.io    │  │  Redis   │  │ Browser Push │
                    │ Real-time    │  │  Cache   │  │ (optional)   │
                    │ Notification │  │  Counter │  │              │
                    └──────────────┘  └──────────┘  └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Frontend   │
                    │  Notification│
                    │   Dropdown   │
                    └──────────────┘
```

---

## 📊 Database Schema

### Notification Model:

```typescript
// src/models/notification.model.ts

import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // User receiving notification
  sender: mongoose.Types.ObjectId;    // User who triggered action
  type: "LIKE" | "COMMENT" | "FOLLOW" | "MENTION" | "REPLY" | "STORY_VIEW" | "POST_TAG";
  
  // Related content (optional, depends on type)
  post?: mongoose.Types.ObjectId;
  reel?: mongoose.Types.ObjectId;
  story?: mongoose.Types.ObjectId;
  comment?: mongoose.Types.ObjectId;
  
  // Message preview (for comments/replies)
  message?: string;
  
  // Status
  isRead: boolean;
  readAt?: Date;
  
  // Timestamps
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Fast lookup by recipient
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["LIKE", "COMMENT", "FOLLOW", "MENTION", "REPLY", "STORY_VIEW", "POST_TAG"],
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    reel: {
      type: Schema.Types.ObjectId,
      ref: "Reel",
    },
    story: {
      type: Schema.Types.ObjectId,
      ref: "Story",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    message: {
      type: String,
      maxlength: 200, // Preview text
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Fast filtering of unread
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-delete old read notifications (after 30 days)
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { isRead: true } }
);

export default mongoose.models.Notification || 
  mongoose.model<INotification>("Notification", notificationSchema);
```

---

## 🔌 API Endpoints

### 1. **GET /api/notifications** - Fetch notifications

```typescript
// src/app/api/notifications/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Notification from "@/models/notification.model";
import { getServerSession } from "@/utils/auth";
import { readRateLimiter } from "@/lib/rate-limiter";
import { withRateLimit } from "@/middleware/rate-limit";

async function getNotificationsHandler(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  await connectToDb();

  const query: any = { recipient: session.user.id };
  if (unreadOnly) {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .populate("sender", "name avatar isVerified") // Get sender details
    .populate("post", "imageUrl caption")
    .populate("reel", "videoUrl thumbnail")
    .sort({ createdAt: -1 }) // Newest first
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    recipient: session.user.id,
    isRead: false,
  });

  return NextResponse.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    },
  });
}

export const GET = withRateLimit(getNotificationsHandler, {
  limiter: readRateLimiter,
});
```

---

### 2. **POST /api/notifications/mark-read** - Mark as read

```typescript
// src/app/api/notifications/mark-read/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Notification from "@/models/notification.model";
import { getServerSession } from "@/utils/auth";
import { mutationRateLimiter } from "@/lib/rate-limiter";
import { withRateLimit } from "@/middleware/rate-limit";
import { cache, cacheKeys } from "@/lib/redis";

async function markReadHandler(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { notificationId, markAllRead } = body;

  await connectToDb();

  if (markAllRead) {
    // Mark all notifications as read
    await Notification.updateMany(
      { recipient: session.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  } else {
    // Mark single notification as read
    await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: session.user.id },
      { isRead: true, readAt: new Date() }
    );
  }

  // Invalidate Redis cache
  await cache.del(cacheKeys.notifications(session.user.id));

  return NextResponse.json({ success: true });
}

export const POST = withRateLimit(markReadHandler, {
  limiter: mutationRateLimiter,
});
```

---

### 3. **Helper Function** - Create notification

```typescript
// src/utils/notifications.ts

import Notification from "@/models/notification.model";
import { cache, cacheKeys } from "@/lib/redis";
import { io } from "@/socket-server"; // Socket.io instance

interface CreateNotificationParams {
  recipientId: string;
  senderId: string;
  type: "LIKE" | "COMMENT" | "FOLLOW" | "MENTION" | "REPLY" | "STORY_VIEW" | "POST_TAG";
  postId?: string;
  reelId?: string;
  storyId?: string;
  commentId?: string;
  message?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const { recipientId, senderId, type, postId, reelId, storyId, commentId, message } = params;

  // Don't notify yourself
  if (recipientId === senderId) return;

  try {
    // 1. Create notification in database
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId,
      reel: reelId,
      story: storyId,
      comment: commentId,
      message,
      isRead: false,
    });

    // 2. Populate sender details for real-time push
    await notification.populate("sender", "name avatar isVerified");

    // 3. Increment unread count in Redis
    const redisKey = cacheKeys.notificationCount(recipientId);
    await cache.set(redisKey, await getUnreadCount(recipientId), 300); // 5min cache

    // 4. Send real-time notification via Socket.io
    io.to(recipientId).emit("notification", {
      id: notification._id,
      type: notification.type,
      sender: notification.sender,
      message: notification.message,
      createdAt: notification.createdAt,
      post: notification.post,
      reel: notification.reel,
    });

    // 5. Send unread count update
    const unreadCount = await getUnreadCount(recipientId);
    io.to(recipientId).emit("notification:count", unreadCount);

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

async function getUnreadCount(userId: string): Promise<number> {
  return await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
}
```

---

## ⚡ Real-time Flow (Socket.io)

### Socket Events:

```typescript
// socket-server.js (enhancement)

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins their personal room (for notifications)
  socket.on("join:user", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  });

  // Emit notification to specific user
  // io.to(userId).emit("notification", notificationData);

  // Emit unread count update
  // io.to(userId).emit("notification:count", 5);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
```

---

## 🔴 Redis Integration

### Cache Keys:

```typescript
// src/lib/redis.ts (enhancement)

export const cacheKeys = {
  // ... existing keys ...
  
  // Notifications
  notifications: (userId: string) => `notifications:${userId}`,
  notificationCount: (userId: string) => `notifications:count:${userId}`,
};
```

### Usage:

```typescript
// Cache unread count (5min TTL)
const unreadCount = await cache.get<number>(cacheKeys.notificationCount(userId));
if (!unreadCount) {
  const count = await Notification.countDocuments({ recipient: userId, isRead: false });
  await cache.set(cacheKeys.notificationCount(userId), count, 300);
}

// Invalidate on mark read
await cache.del(cacheKeys.notificationCount(userId));
```

---

## 🎨 Frontend Components

### 1. **NotificationBell** (Header component)

```typescript
// src/components/notifications/NotificationBell.tsx

"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount();

    // Listen for real-time count updates
    socket?.on("notification:count", (count: number) => {
      setUnreadCount(count);
    });

    return () => {
      socket?.off("notification:count");
    };
  }, [socket]);

  const fetchUnreadCount = async () => {
    const res = await fetch("/api/notifications?unreadOnly=true");
    if (res.ok) {
      const data = await res.json();
      setUnreadCount(data.data.unreadCount);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          onMarkAllRead={() => setUnreadCount(0)}
        />
      )}
    </div>
  );
}
```

---

### 2. **NotificationDropdown**

```typescript
// src/components/notifications/NotificationDropdown.tsx

"use client";

import { useState, useEffect } from "react";
import { NotificationItem } from "./NotificationItem";
import { useSocket } from "@/contexts/SocketContext";

export function NotificationDropdown({ onClose, onMarkAllRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();

    // Listen for new notifications
    socket?.on("notification", (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      socket?.off("notification");
    };
  }, [socket]);

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications?limit=10");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.data.notifications);
    }
    setLoading(false);
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    onMarkAllRead();
  };

  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border z-50">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-bold text-lg">Notifications</h3>
        <button onClick={handleMarkAllRead} className="text-blue-500 text-sm">
          Mark all read
        </button>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onRead={() => {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n._id === notification._id ? { ...n, isRead: true } : n
                  )
                );
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

---

### 3. **NotificationItem**

```typescript
// src/components/notifications/NotificationItem.tsx

"use client";

import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, UserPlus, AtSign } from "lucide-react";

const ICONS = {
  LIKE: <Heart className="text-red-500" size={20} />,
  COMMENT: <MessageCircle className="text-blue-500" size={20} />,
  FOLLOW: <UserPlus className="text-green-500" size={20} />,
  MENTION: <AtSign className="text-purple-500" size={20} />,
};

export function NotificationItem({ notification, onRead }) {
  const handleClick = async () => {
    // Mark as read
    if (!notification.isRead) {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification._id }),
      });
      onRead();
    }

    // Navigate to content (optional)
    // router.push(`/feed?postId=${notification.post._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 hover:bg-gray-50 cursor-pointer border-b ${
        !notification.isRead ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">{ICONS[notification.type]}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-semibold">{notification.sender.name}</span>{" "}
            {getNotificationText(notification.type)}
          </p>
          {notification.message && (
            <p className="text-sm text-gray-600 truncate">{notification.message}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

function getNotificationText(type: string) {
  switch (type) {
    case "LIKE":
      return "liked your post";
    case "COMMENT":
      return "commented on your post";
    case "FOLLOW":
      return "started following you";
    case "MENTION":
      return "mentioned you";
    default:
      return "";
  }
}
```

---

## 🚀 Implementation Steps

### **Step 1: Database Model** (15 min)
```bash
✅ Create src/models/notification.model.ts
✅ Add indexes for performance
✅ Add TTL for auto-cleanup
```

### **Step 2: Helper Functions** (20 min)
```bash
✅ Create src/utils/notifications.ts
✅ Add createNotification() function
✅ Integrate Socket.io emission
```

### **Step 3: API Routes** (30 min)
```bash
✅ GET /api/notifications (fetch)
✅ POST /api/notifications/mark-read
✅ Add Redis caching
```

### **Step 4: Socket.io Integration** (15 min)
```bash
✅ Update socket-server.js
✅ Add notification events
✅ Test real-time push
```

### **Step 5: Frontend Components** (45 min)
```bash
✅ NotificationBell.tsx
✅ NotificationDropdown.tsx
✅ NotificationItem.tsx
✅ Add to header/navbar
```

### **Step 6: Integration** (30 min)
```bash
✅ Call createNotification() in:
   - Like API (when someone likes)
   - Comment API (when someone comments)
   - Follow API (when someone follows)
   - Mention detection (in comments)
```

### **Step 7: Testing** (20 min)
```bash
✅ Test real-time notifications
✅ Test mark as read
✅ Test unread count
✅ Test Redis caching
```

---

## ⏱️ Total Time Estimate: **2-3 hours** for full implementation!

---

## 🎯 Features Included:

✅ Real-time notifications (Socket.io)  
✅ Unread badge counter  
✅ Mark as read (single/all)  
✅ 7 notification types  
✅ Redis caching (unread count)  
✅ Auto-cleanup (30 days)  
✅ Database indexes (performance)  
✅ Rate limiting  
✅ Beautiful UI (dropdown)  

---

**Kya implement karna hai? Let's start! 🚀**
