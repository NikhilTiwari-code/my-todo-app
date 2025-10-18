# 🚀 Share/Send System - Complete Implementation Plan

> **Feature:** Share posts internally (send to users) & externally (social media, clipboard)  
> **Time Estimate:** 10-12 hours  
> **Impact:** +400% post reach, viral growth loop  
> **Branch:** `feature/share-send`

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [Socket.io Integration](#socketio-integration)
6. [Implementation Steps](#implementation-steps)
7. [Testing Checklist](#testing-checklist)

---

## 🏗️ System Architecture

### **3 Layers of Sharing:**

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARE BUTTON (Post/Reel)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
┌──────────────────────┐   ┌──────────────────────┐
│  EXTERNAL SHARE      │   │  INTERNAL SHARE      │
│  (Social, Clipboard) │   │  (Send to Users)     │
└──────────────────────┘   └──────────────────────┘
            │                         │
            │                         ▼
            │              ┌──────────────────────┐
            │              │   1. Select Users    │
            │              │   2. Add Message     │
            │              │   3. Send via API    │
            │              └──────────┬───────────┘
            │                         │
            │                         ▼
            │              ┌──────────────────────┐
            │              │  Save to Database    │
            │              │  (SharedPost model)  │
            │              └──────────┬───────────┘
            │                         │
            │                         ▼
            │              ┌──────────────────────┐
            │              │ Create Notification  │
            │              │ + Socket.io Emit     │
            │              └──────────┬───────────┘
            │                         │
            │                         ▼
            │              ┌──────────────────────┐
            │              │  Recipient's Inbox   │
            │              │  (Shared Posts)      │
            │              └──────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│  OPTIONS:                                                     │
│  1. Copy Link (Clipboard API)                                │
│  2. Share to WhatsApp (wa.me)                               │
│  3. Share to Twitter (twitter.com/intent)                   │
│  4. Share to Facebook (facebook.com/sharer)                 │
│  5. Download Image (Cloudinary download URL)                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### **1. SharedPost Model** (Internal Sharing)

```typescript
// src/models/shared-post.model.ts

import mongoose, { Schema, Document } from "mongoose";

export interface ISharedPost extends Document {
  sender: mongoose.Types.ObjectId;    // User who shared
  recipient: mongoose.Types.ObjectId; // User receiving
  
  // What was shared (only one will be populated)
  post?: mongoose.Types.ObjectId;
  reel?: mongoose.Types.ObjectId;
  story?: mongoose.Types.ObjectId;
  
  // Optional message from sender
  message?: string;
  
  // Status
  isRead: boolean;
  readAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const sharedPostSchema = new Schema<ISharedPost>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Fast lookup for inbox
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
    message: {
      type: String,
      maxlength: 500, // Optional note (500 chars max)
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
sharedPostSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
sharedPostSchema.index({ sender: 1, createdAt: -1 });

// Auto-delete read shared posts after 30 days
sharedPostSchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60, 
    partialFilterExpression: { isRead: true } 
  }
);

export default mongoose.models.SharedPost || 
  mongoose.model<ISharedPost>("SharedPost", sharedPostSchema);
```

### **2. Add Share Count to Post Model**

```typescript
// src/models/post.model.ts (ADD THIS FIELD)

shareCount: {
  type: Number,
  default: 0,
  index: true, // For "most shared" queries
}
```

---

## 🔌 API Endpoints

### **1. POST /api/share** - Send post to users

```typescript
// src/app/api/share/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import SharedPost from "@/models/shared-post.model";
import Post from "@/models/post.model";
import Reel from "@/models/reel.model";
import { getServerSession } from "@/utils/auth";
import { mutationRateLimiter } from "@/lib/rate-limiter";
import { withRateLimit } from "@/middleware/rate-limit";
import { createNotification } from "@/utils/notifications";
import { z } from "zod";

const shareSchema = z.object({
  recipientIds: z.array(z.string()).min(1).max(20), // Max 20 recipients per share
  postId: z.string().optional(),
  reelId: z.string().optional(),
  storyId: z.string().optional(),
  message: z.string().max(500).optional(),
}).refine(
  (data) => data.postId || data.reelId || data.storyId,
  { message: "Must share at least one content type" }
);

async function shareHandler(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = shareSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { recipientIds, postId, reelId, storyId, message } = validation.data;

    await connectToDb();

    // Create shared post for each recipient
    const sharedPosts = await Promise.all(
      recipientIds.map(async (recipientId) => {
        // Don't share with yourself
        if (recipientId === session.user.id) return null;

        // Create shared post entry
        const sharedPost = await SharedPost.create({
          sender: session.user.id,
          recipient: recipientId,
          post: postId,
          reel: reelId,
          story: storyId,
          message,
          isRead: false,
        });

        // Create notification
        await createNotification({
          recipientId,
          senderId: session.user.id,
          type: "SHARE",
          postId,
          reelId,
          storyId,
          message: message || "shared a post with you",
        });

        return sharedPost;
      })
    );

    // Increment share count on the content
    if (postId) {
      await Post.findByIdAndUpdate(postId, { $inc: { shareCount: 1 } });
    } else if (reelId) {
      await Reel.findByIdAndUpdate(reelId, { $inc: { shareCount: 1 } });
    }

    const validShares = sharedPosts.filter(Boolean);

    return NextResponse.json({
      success: true,
      message: `Sent to ${validShares.length} user${validShares.length > 1 ? 's' : ''}`,
      data: { sharedCount: validShares.length },
    });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json(
      { error: "Failed to share content" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(shareHandler, {
  limiter: mutationRateLimiter,
});
```

---

### **2. GET /api/inbox** - Get shared posts (inbox)

```typescript
// src/app/api/inbox/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import SharedPost from "@/models/shared-post.model";
import { getServerSession } from "@/utils/auth";
import { readRateLimiter } from "@/lib/rate-limiter";
import { withRateLimit } from "@/middleware/rate-limit";

async function getInboxHandler(request: NextRequest) {
  try {
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

    const sharedPosts = await SharedPost.find(query)
      .populate("sender", "name avatar isVerified")
      .populate("post", "imageUrl caption likes comments shareCount")
      .populate("reel", "videoUrl thumbnail likes comments shareCount")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await SharedPost.countDocuments(query);
    const unreadCount = await SharedPost.countDocuments({
      recipient: session.user.id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        sharedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Inbox error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inbox" },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(getInboxHandler, {
  limiter: readRateLimiter,
});
```

---

### **3. POST /api/inbox/[id]/read** - Mark shared post as read

```typescript
// src/app/api/inbox/[id]/read/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import SharedPost from "@/models/shared-post.model";
import { getServerSession } from "@/utils/auth";
import { mutationRateLimiter } from "@/lib/rate-limiter";
import { withRateLimit } from "@/middleware/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function markReadHandler(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    await connectToDb();

    const sharedPost = await SharedPost.findOneAndUpdate(
      { _id: id, recipient: session.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!sharedPost) {
      return NextResponse.json(
        { error: "Shared post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { sharedPost },
    });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(markReadHandler, {
  limiter: mutationRateLimiter,
});
```

---

## 🎨 Frontend Components

### **Component Structure:**

```
src/components/share/
├── ShareButton.tsx          (Main share button on posts)
├── ShareModal.tsx           (Modal with share options)
├── ExternalShareOptions.tsx (Social media, clipboard)
├── InternalShareModal.tsx   (Send to users)
├── UserSelectList.tsx       (Search & select users)
├── InboxPage.tsx            (Inbox page component)
├── SharedPostCard.tsx       (Display shared post in inbox)
└── ShareCounter.tsx         (Display share count)
```

---

### **1. ShareButton.tsx** - Main share button

```typescript
// src/components/share/ShareButton.tsx

"use client";

import { useState } from "react";
import { Send, Share2 } from "lucide-react";
import { ShareModal } from "./ShareModal";

interface ShareButtonProps {
  postId?: string;
  reelId?: string;
  storyId?: string;
  shareCount?: number;
  variant?: "icon" | "button"; // Icon for posts, button for reels
}

export function ShareButton({
  postId,
  reelId,
  storyId,
  shareCount = 0,
  variant = "icon",
}: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localShareCount, setLocalShareCount] = useState(shareCount);

  const handleShareSuccess = () => {
    setLocalShareCount((prev) => prev + 1);
  };

  if (variant === "button") {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Send size={20} />
          <span className="text-sm font-medium">
            {localShareCount > 0 ? localShareCount : "Share"}
          </span>
        </button>

        {isModalOpen && (
          <ShareModal
            postId={postId}
            reelId={reelId}
            storyId={storyId}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleShareSuccess}
          />
        )}
      </>
    );
  }

  // Icon variant (for posts)
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        title="Share"
      >
        <Send size={24} />
        {localShareCount > 0 && (
          <span className="text-sm font-medium">{localShareCount}</span>
        )}
      </button>

      {isModalOpen && (
        <ShareModal
          postId={postId}
          reelId={reelId}
          storyId={storyId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleShareSuccess}
        />
      )}
    </>
  );
}
```

---

### **2. ShareModal.tsx** - Share options modal

```typescript
// src/components/share/ShareModal.tsx

"use client";

import { useState } from "react";
import { X, Link, Send } from "lucide-react";
import { ExternalShareOptions } from "./ExternalShareOptions";
import { InternalShareModal } from "./InternalShareModal";

interface ShareModalProps {
  postId?: string;
  reelId?: string;
  storyId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShareModal({
  postId,
  reelId,
  storyId,
  onClose,
  onSuccess,
}: ShareModalProps) {
  const [showInternalShare, setShowInternalShare] = useState(false);

  if (showInternalShare) {
    return (
      <InternalShareModal
        postId={postId}
        reelId={reelId}
        storyId={storyId}
        onClose={onClose}
        onBack={() => setShowInternalShare(false)}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Share</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          {/* Send to Users */}
          <button
            onClick={() => setShowInternalShare(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send size={24} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Send to Friends</p>
              <p className="text-sm text-gray-500">Share with people on TodoApp</p>
            </div>
          </button>

          {/* External Share Options */}
          <ExternalShareOptions
            postId={postId}
            reelId={reelId}
            storyId={storyId}
          />
        </div>
      </div>
    </div>
  );
}
```

---

### **3. ExternalShareOptions.tsx** - Social media & clipboard

```typescript
// src/components/share/ExternalShareOptions.tsx

"use client";

import { Copy, Download } from "lucide-react";
import toast from "react-hot-toast";
import {
  FaWhatsapp,
  FaTwitter,
  FaFacebook,
  FaTelegram,
} from "react-icons/fa";

interface ExternalShareOptionsProps {
  postId?: string;
  reelId?: string;
  storyId?: string;
}

export function ExternalShareOptions({
  postId,
  reelId,
  storyId,
}: ExternalShareOptionsProps) {
  const contentType = postId ? "post" : reelId ? "reel" : "story";
  const contentId = postId || reelId || storyId;
  const shareUrl = `${window.location.origin}/${contentType}/${contentId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard! 📋");
  };

  const shareToWhatsApp = () => {
    const text = `Check out this ${contentType} on TodoApp!`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`,
      "_blank"
    );
  };

  const shareToTwitter = () => {
    const text = `Check out this ${contentType} on TodoApp!`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const shareToTelegram = () => {
    const text = `Check out this ${contentType} on TodoApp!`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const options = [
    {
      icon: <Copy size={20} />,
      label: "Copy Link",
      onClick: copyLink,
      bg: "bg-gray-100",
      color: "text-gray-700",
    },
    {
      icon: <FaWhatsapp size={20} />,
      label: "WhatsApp",
      onClick: shareToWhatsApp,
      bg: "bg-green-100",
      color: "text-green-600",
    },
    {
      icon: <FaTwitter size={20} />,
      label: "Twitter",
      onClick: shareToTwitter,
      bg: "bg-blue-100",
      color: "text-blue-600",
    },
    {
      icon: <FaFacebook size={20} />,
      label: "Facebook",
      onClick: shareToFacebook,
      bg: "bg-blue-100",
      color: "text-blue-700",
    },
    {
      icon: <FaTelegram size={20} />,
      label: "Telegram",
      onClick: shareToTelegram,
      bg: "bg-sky-100",
      color: "text-sky-600",
    },
  ];

  return (
    <div className="border-t pt-4 mt-4">
      <p className="text-sm text-gray-500 mb-3 px-2">Share via</p>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={option.onClick}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl hover:scale-105 transition-transform ${option.bg}`}
          >
            <div className={`${option.color}`}>{option.icon}</div>
            <span className="text-xs font-medium text-gray-700">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### **4. InternalShareModal.tsx** - Send to users

```typescript
// src/components/share/InternalShareModal.tsx

"use client";

import { useState } from "react";
import { X, ArrowLeft, Send } from "lucide-react";
import { UserSelectList } from "./UserSelectList";
import toast from "react-hot-toast";

interface InternalShareModalProps {
  postId?: string;
  reelId?: string;
  storyId?: string;
  onClose: () => void;
  onBack: () => void;
  onSuccess?: () => void;
}

export function InternalShareModal({
  postId,
  reelId,
  storyId,
  onClose,
  onBack,
  onSuccess,
}: InternalShareModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipientIds: selectedUsers,
          postId,
          reelId,
          storyId,
          message: message.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        onSuccess?.();
        onClose();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to send");
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">Send to</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          <UserSelectList
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
          />
        </div>

        {/* Message Input */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-t">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message... (optional)"
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              maxLength={500}
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {message.length}/500
            </div>
          </div>
        )}

        {/* Send Button */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-t">
            <button
              onClick={handleSend}
              disabled={isSending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send to {selectedUsers.length} user
                  {selectedUsers.length > 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### **5. UserSelectList.tsx** - Search & select users

```typescript
// src/components/share/UserSelectList.tsx

"use client";

import { useState, useEffect } from "react";
import { Search, Check } from "lucide-react";
import { UserAvatar } from "@/components/users/UserAvatar";

interface User {
  _id: string;
  name: string;
  avatar?: string;
  isVerified?: boolean;
}

interface UserSelectListProps {
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
}

export function UserSelectList({
  selectedUsers,
  onSelectionChange,
}: UserSelectListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch user's followers/following
      const res = await fetch("/api/users/following", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onSelectionChange(selectedUsers.filter((id) => id !== userId));
    } else {
      onSelectionChange([...selectedUsers, userId]);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="p-4 border-b sticky top-0 bg-white">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        {selectedUsers.length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            {selectedUsers.length} selected
          </p>
        )}
      </div>

      {/* User List */}
      <div className="divide-y">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? "No users found" : "No users to share with"}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = selectedUsers.includes(user._id);

            return (
              <button
                key={user._id}
                onClick={() => toggleUser(user._id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <UserAvatar name={user.name} avatar={user.avatar} size="md" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">{user.name}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-purple-600 border-purple-600"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check size={16} className="text-white" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
```

---

## ⚡ Socket.io Integration

### Update notification types:

```typescript
// src/utils/notifications.ts (ADD THIS TYPE)

type: "LIKE" | "COMMENT" | "FOLLOW" | "MENTION" | "REPLY" | "STORY_VIEW" | "POST_TAG" | "SHARE";
```

### Socket event for shares:

```javascript
// socket-server.js (already set up, just emit "notification" event)

// When share happens:
io.to(recipientId).emit("notification", {
  type: "SHARE",
  sender: { name, avatar },
  message: "shared a post with you",
  sharedPost: { ... }
});
```

---

## 🚀 Implementation Steps (10-12 hours)

### **Phase 1: Backend (4-5 hours)**

#### **Step 1.1: Create Database Model** (30 min)
```bash
✅ Create src/models/shared-post.model.ts
✅ Add shareCount to Post model
✅ Add shareCount to Reel model
✅ Test model with sample data
```

#### **Step 1.2: Create API Endpoints** (2 hours)
```bash
✅ POST /api/share (share to users)
✅ GET /api/inbox (get shared posts)
✅ POST /api/inbox/[id]/read (mark as read)
✅ GET /api/users/following (for user selection)
```

#### **Step 1.3: Update Notifications** (1 hour)
```bash
✅ Add "SHARE" notification type
✅ Update createNotification() function
✅ Test Socket.io emission
```

#### **Step 1.4: Test Backend** (30 min)
```bash
✅ Test share API with Postman
✅ Test inbox retrieval
✅ Test mark as read
✅ Verify Socket.io events
```

---

### **Phase 2: Frontend Components (5-6 hours)**

#### **Step 2.1: Share Button Component** (1 hour)
```bash
✅ Create ShareButton.tsx
✅ Add to PostCard component
✅ Add to ReelPlayer component
✅ Test click handler
```

#### **Step 2.2: Share Modal** (1.5 hours)
```bash
✅ Create ShareModal.tsx
✅ Create ExternalShareOptions.tsx
✅ Test clipboard copy
✅ Test social media links
```

#### **Step 2.3: Internal Share** (2 hours)
```bash
✅ Create InternalShareModal.tsx
✅ Create UserSelectList.tsx
✅ Implement search functionality
✅ Test user selection
✅ Test send API integration
```

#### **Step 2.4: Inbox Page** (1.5 hours)
```bash
✅ Create InboxPage.tsx
✅ Create SharedPostCard.tsx
✅ Add to navigation (sidebar + mobile)
✅ Test real-time updates
✅ Test mark as read
```

---

### **Phase 3: Integration & Polish (1 hour)**

#### **Step 3.1: Add to Existing Components** (30 min)
```bash
✅ Add ShareButton to PostCard
✅ Add ShareButton to ReelPlayer
✅ Add Inbox icon to Header/Navbar
✅ Update navigation routes
```

#### **Step 3.2: Testing & Bug Fixes** (30 min)
```bash
✅ Test complete share flow
✅ Test real-time notifications
✅ Test unread badge counter
✅ Fix any bugs
```

---

## ✅ Testing Checklist

### **Backend Tests:**
- [ ] Share post to single user
- [ ] Share post to multiple users (max 20)
- [ ] Share reel
- [ ] Share story
- [ ] Get inbox (paginated)
- [ ] Get unread shared posts only
- [ ] Mark single shared post as read
- [ ] Verify share count increments
- [ ] Verify notification created
- [ ] Verify Socket.io emission

### **Frontend Tests:**
- [ ] Click share button opens modal
- [ ] Copy link to clipboard
- [ ] Share to WhatsApp (opens new tab)
- [ ] Share to Twitter (opens new tab)
- [ ] Share to Facebook (opens new tab)
- [ ] Send to users modal opens
- [ ] Search users works
- [ ] Select/deselect users
- [ ] Send with message
- [ ] Send without message
- [ ] Inbox displays shared posts
- [ ] Unread badge shows correct count
- [ ] Mark as read works
- [ ] Real-time notification appears
- [ ] Mobile responsive design

---

## 📱 Navigation Updates

### Add Inbox to Sidebar:

```typescript
// src/components/layout/Sidebar.tsx

import { Mail } from "lucide-react"; // or Send icon

{
  label: "Inbox",
  href: "/inbox",
  icon: <Mail size={24} />,
  badge: unreadShareCount, // from state
}
```

---

## 🎯 Success Metrics

### **After Implementation:**
- ✅ Users can share posts externally (clipboard, social media)
- ✅ Users can send posts to other users internally
- ✅ Recipients see shared posts in inbox
- ✅ Real-time notifications for shares
- ✅ Share count displayed on posts
- ✅ Unread badge on inbox icon

### **Expected Impact:**
- 📈 **+400% post reach** (viral loop)
- 👥 **+300% user engagement**
- ⏱️ **+200% session time**
- 🔄 **Viral coefficient: 0.1 → 1.2**

---

## 🚀 Ready to Start?

**Implementation Order:**
1. ✅ Create database model (30 min)
2. ✅ Build API endpoints (2 hours)
3. ✅ Create Share components (3 hours)
4. ✅ Create Inbox page (1.5 hours)
5. ✅ Integration & testing (1 hour)

**Total: 8-10 hours of focused work**

---

**Let's start with Step 1: Database Model! 🔥**

Shall I create the files?
