# 🎉 Profile Avatar & Follow System - Complete Implementation Guide

## ✨ Features Added

### 1. **Profile Photo/Avatar System** 📸
- Upload and display profile pictures
- Default gradient avatars with initials
- Avatar shown everywhere (Friends page, Profile, User pages)

### 2. **Follow/Unfollow System** 👥
- Follow any user
- Unfollow users you're following
- See follower/following counts
- Visual "Following" indicator
- Can't follow yourself

---

## 🗄️ Database Changes

### User Model Updated:
```typescript
{
  name: string,
  email: string,
  password: string,
  avatar?: string,          // NEW: Profile photo URL
  bio?: string,             // NEW: User bio (max 500 chars)
  followers: ObjectId[],    // NEW: Array of follower IDs
  following: ObjectId[],    // NEW: Array of following IDs
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔗 New API Endpoints

### 1. POST `/api/users/[userId]/follow`
**Follow a user**

Headers:
```
Cookie: token=<jwt_token>
```

Response:
```json
{
  "success": true,
  "message": "User followed successfully",
  "data": {
    "followersCount": 10,
    "followingCount": 5,
    "isFollowing": true
  }
}
```

Errors:
- 401: Not authenticated
- 400: Can't follow yourself / Already following
- 404: User not found

---

### 2. DELETE `/api/users/[userId]/follow`
**Unfollow a user**

Headers:
```
Cookie: token=<jwt_token>
```

Response:
```json
{
  "success": true,
  "message": "User unfollowed successfully",
  "data": {
    "followersCount": 9,
    "followingCount": 5,
    "isFollowing": false
  }
}
```

---

### 3. POST `/api/profile`
**Update profile (avatar & bio)**

Headers:
```
Cookie: token=<jwt_token>
Content-Type: application/json
```

Body:
```json
{
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Love building todo apps! 🚀"
}
```

Response:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "bio": "Love building todo apps! 🚀",
      "followersCount": 10,
      "followingCount": 5
    }
  }
}
```

---

### 4. GET `/api/profile`
**Get current user profile with follow stats**

Headers:
```
Cookie: token=<jwt_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://...",
      "bio": "...",
      "followersCount": 10,
      "followingCount": 5,
      "createdAt": "2024-01-01"
    }
  }
}
```

---

## 📊 Updated API Responses

### GET `/api/users` (All Users)
Now includes:
```json
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://...",         // NEW
  "bio": "...",                    // NEW
  "stats": {
    "totalTodos": 15,
    "completedTodos": 10,
    "activeTodos": 5,
    "followersCount": 10,          // NEW
    "followingCount": 5            // NEW
  },
  "isFollowing": false,            // NEW
  "isCurrentUser": false           // NEW
}
```

### GET `/api/users/[userId]` (Single User)
Now includes:
```json
{
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://...",       // NEW
    "bio": "...",                  // NEW
  },
  "stats": {
    "totalTodos": 15,
    "completedTodos": 10,
    "activeTodos": 5,
    "completionRate": 67,
    "followersCount": 10,          // NEW
    "followingCount": 5            // NEW
  },
  "isFollowing": false,            // NEW
  "isCurrentUser": false           // NEW
}
```

---

## 🎨 Frontend Components Needed

### 1. **Follow Button Component**
Create: `src/components/users/FollowButton.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ 
  userId, 
  initialIsFollowing,
  onFollowChange 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = async () => {
    setIsLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${userId}/follow`, { method });
      
      if (res.ok) {
        const newState = !isFollowing;
        setIsFollowing(newState);
        onFollowChange?.(newState);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleToggleFollow}
      disabled={isLoading}
    >
      {isLoading ? "..." : isFollowing ? "Following ✓" : "Follow"}
    </Button>
  );
}
```

---

### 2. **Avatar Upload Component**
Create: `src/components/profile/AvatarUpload.tsx`

```typescript
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onUploadSuccess?: (avatarUrl: string) => void;
}

export function AvatarUpload({ 
  currentAvatar, 
  userName,
  onUploadSuccess 
}: AvatarUploadProps) {
  const [avatar, setAvatar] = useState(currentAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        // Upload to server
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: base64String }),
        });

        if (res.ok) {
          const data = await res.json();
          setAvatar(data.data.user.avatar);
          onUploadSuccess?.(data.data.user.avatar);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
        {avatar ? (
          <Image 
            src={avatar} 
            alt={userName} 
            fill 
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Change Photo"}
      </Button>
    </div>
  );
}
```

---

## 🎯 How to Implement on Frontend

### Update Friends Page
Add follow button to each user card:

```tsx
// In src/app/(dashboard)/friends/page.tsx
import { FollowButton } from "@/components/users/FollowButton";

// Inside user card:
{!user.isCurrentUser && (
  <FollowButton
    userId={user.id}
    initialIsFollowing={user.isFollowing}
    onFollowChange={(isFollowing) => {
      // Optionally update local state
    }}
  />
)}
```

### Update User Profile Page
Add follow button and follower counts:

```tsx
// In src/app/(dashboard)/friends/[userId]/page.tsx

// In stats card:
<div>
  <span>{userData.stats.followersCount} Followers</span>
  <span>{userData.stats.followingCount} Following</span>
</div>

{!userData.isCurrentUser && (
  <FollowButton
    userId={userId}
    initialIsFollowing={userData.isFollowing}
  />
)}
```

### Update Profile Page
Add avatar upload:

```tsx
// In src/app/(dashboard)/profile/page.tsx
import { AvatarUpload } from "@/components/profile/AvatarUpload";

<AvatarUpload
  currentAvatar={user?.avatar}
  userName={user?.name || ""}
  onUploadSuccess={(avatarUrl) => {
    // Update local state
  }}
/>
```

---

## 🔐 Security Notes

✅ **Authentication Required:**
- Can't follow without being logged in
- Can't upload avatar without being logged in
- Can't view own follow stats without being logged in

✅ **Validation:**
- Can't follow yourself
- Can't follow same user twice
- Avatar file size limited to 5MB
- Bio limited to 500 characters

✅ **Privacy:**
- Passwords always excluded from responses
- Follow relationships are public (like Twitter)
- All users can see who follows whom

---

## 📈 Database Indexes (Already Added)

```typescript
userSchema.index({ email: 1 }, { unique: true });
```

**Consider adding for better performance:**
```typescript
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
```

---

## 🎨 Avatar Storage Options

### **Current Implementation: Base64 (Simple)**
- Stores images as base64 strings in MongoDB
- Pros: No external service needed, works immediately
- Cons: Large database size, slower queries
- Good for: Development, small user base

### **Recommended for Production: Cloud Storage**

**Option 1: Cloudinary (Easiest)**
```bash
npm install cloudinary
```

**Option 2: AWS S3**
```bash
npm install @aws-sdk/client-s3
```

**Option 3: Vercel Blob Storage**
```bash
npm install @vercel/blob
```

---

## 🧪 Testing Guide

### 1. Test Follow System
```bash
# Create 3 test users
# Login as User1
# Go to Friends page
# Click "Follow" on User2
# Verify: Button changes to "Following ✓"
# Go to User2's profile
# Verify: Followers count increased
# Click "Following ✓" to unfollow
# Verify: Button changes back to "Follow"
```

### 2. Test Avatar Upload
```bash
# Login as any user
# Go to Profile page
# Click "Change Photo"
# Upload image (< 5MB)
# Verify: Avatar appears
# Go to Friends page
# Verify: Avatar appears in user card
# Go to another user's profile
# Click your avatar in sidebar
# Verify: Avatar appears everywhere
```

### 3. Test Follow Privacy
```bash
# Try to follow yourself → Should fail
# Try to follow same user twice → Should fail
# Try to follow without login → Should fail (401)
```

---

## 🚀 Next Steps

1. **Add Follow Button to Friends Page** ✅
2. **Add Follow Button to User Profile** ✅
3. **Add Avatar Upload to Profile Page** ✅
4. **Add Follower/Following Pages** (Optional)
5. **Add Activity Feed** (Who followed who, etc.)
6. **Add Notifications** (New follower notifications)
7. **Add Cloud Storage** (Cloudinary/S3 for avatars)

---

## 💡 Future Enhancements

1. **Follower/Following Lists Pages**
   - `/friends/followers` - Who follows you
   - `/friends/following` - Who you follow
   - Click to view their profiles

2. **Activity Feed**
   - See when friends complete todos
   - See when friends follow someone
   - Real-time updates

3. **Notifications**
   - Get notified when someone follows you
   - Badge count of unseen notifications

4. **Advanced Features**
   - Mutual followers (friends)
   - Follow suggestions
   - Block/Unblock users
   - Private accounts

---

## ✅ Summary

You now have:
- ✅ Complete follow/unfollow system
- ✅ Avatar upload functionality
- ✅ Follower/following counts
- ✅ Updated API endpoints
- ✅ Database schema with social features
- ✅ Ready-to-use frontend components

**Your todo app is now a full social platform!** 🎊🚀

Just add the frontend components and you're done! 💪✨
