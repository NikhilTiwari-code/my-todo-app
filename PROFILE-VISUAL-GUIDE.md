# 🎨 Instagram-Style Profile - Visual Guide

## 📸 Layout Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                     COVER PHOTO SECTION                       │
│                 (Gradient or uploaded image)                  │
│                  Hover: Upload/Change/Remove                  │
│                        Height: 64-96                          │
│                                                               │
│                           ┌─────┐                            │
└───────────────────────────┤     ├────────────────────────────┘
                            │     │  ← Avatar (overlapping)
┌───────────────────────────┤ 👤  ├────────────────────────────┐
│                           │     │                             │
│                           └─────┘                             │
│                                                               │
│   Name ✓ (if verified)                         [Edit] [📤]   │
│   Bio text here...                                            │
│   🔗 website.com  📍 Location  📅 Joined Date                │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│         Posts          Followers        Following             │
│          42              1.2K             856                 │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│   📷 Posts    ▶️ Reels    🔖 Saved    🏷️ Tagged             │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────┐  ┌─────┐  ┌─────┐                                   │
│  │ Img │  │ Img │  │ Img │   ← 3-column grid                 │
│  └─────┘  └─────┘  └─────┘                                   │
│                                                               │
│  ┌─────┐  ┌─────┐  ┌─────┐                                   │
│  │ Img │  │ Img │  │ Img │   Hover: Show likes + comments    │
│  └─────┘  └─────┘  └─────┘                                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Hierarchy

```
ProfilePage (page.tsx)
│
├─── ProfileHeader
│    │
│    ├─── ProfileCover
│    │    ├─ Cover Image/Gradient
│    │    ├─ Hover Overlay
│    │    └─ Upload Buttons
│    │
│    ├─── UserAvatar (overlapping)
│    │
│    ├─── Name + Verified Badge
│    │
│    ├─── ProfileBio
│    │    ├─ Bio text
│    │    ├─ Website link
│    │    ├─ Location
│    │    └─ Join date
│    │
│    ├─── ProfileStats
│    │    ├─ Posts count
│    │    ├─ Followers (clickable)
│    │    └─ Following (clickable)
│    │
│    └─── ProfileActions
│         ├─ Edit Profile (owner)
│         ├─ Follow/Message (visitor)
│         └─ Share button
│
├─── ProfileTabs
│    ├─ Posts tab
│    ├─ Reels tab
│    ├─ Saved tab (owner only)
│    └─ Tagged tab
│
├─── ProfileGrid
│    ├─ Content thumbnails
│    ├─ Hover overlays
│    └─ Empty states
│
└─── EditProfileModal (conditional)
     ├─ Avatar upload
     ├─ Form fields
     └─ Save/Cancel buttons
```

---

## 🎨 Color Palette

### Gradients
```css
/* Primary Gradient */
from-purple-600 to-pink-600

/* Cover Fallback */
from-blue-400 via-purple-500 to-pink-500

/* Hover Overlays */
bg-black bg-opacity-30

/* Glass Effect */
bg-white bg-opacity-90
```

### Text Colors
```css
/* Primary Text */
text-gray-900 dark:text-white

/* Secondary Text */
text-gray-600 dark:text-gray-400

/* Links */
text-blue-600 dark:text-blue-400

/* Stats */
text-purple-600 dark:text-purple-400
```

---

## 🎭 Animations

### Entrance Animations
```javascript
// Stagger effect for multiple elements
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.1 }}
```

### Hover Effects
```javascript
// Scale on hover
whileHover={{ scale: 1.05 }}

// Button press
whileTap={{ scale: 0.98 }}
```

### Tab Indicator
```javascript
// Sliding underline
<motion.div layoutId="activeTab" />
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
default: Mobile (< 640px)

/* Tablet */
sm: 640px  → 2-column grid, smaller avatars
md: 768px  → Show full labels, larger stats

/* Desktop */
lg: 1024px → 3-column grid, full layout
xl: 1280px → Max width 5xl (64rem)
```

---

## 🔧 Key Features

### 1. **Cover Photo Upload**
- Click/hover to upload
- 10MB max size
- Gradient fallback
- Cloudinary integration

### 2. **Stats Navigation**
- Click followers → `/friends/${userId}/followers`
- Click following → `/friends/${userId}/following`
- Animated numbers (1K, 1M format)

### 3. **Tab System**
- Posts: `/api/feed/user/${userId}`
- Reels: `/api/reels/user/${userId}`
- Saved: `/api/saved` (owner only)
- Tagged: `/api/tagged/${userId}`

### 4. **Edit Modal**
- Avatar upload (5MB max)
- Bio (150 char limit)
- Website, Location, Birthday
- Gender dropdown
- Privacy toggle

### 5. **Grid Layout**
```css
grid-cols-3      /* 3 columns */
gap-1 md:gap-2   /* Responsive gaps */
aspect-square    /* Perfect squares */
```

### 6. **Loading States**
- ProfileSkeleton (header)
- ProfileGridSkeleton (content)
- Button spinners
- Upload progress

---

## 🎯 User Flows

### Profile Owner Flow
```
1. Visit /profile
2. See own profile with "Edit Profile" button
3. Click "Edit Profile" → Modal opens
4. Update fields → Save
5. See updated profile immediately
6. Hover cover → Upload new cover photo
```

### Visitor Flow
```
1. Visit /profile/[userId]
2. See user's profile
3. Click "Follow" → Follow user
4. Click "Message" → Navigate to chat
5. Click stats → View followers/following
```

### Tab Navigation Flow
```
1. Click "Reels" tab
2. Indicator slides to Reels
3. Content loads (skeleton → grid)
4. Click reel thumbnail
5. Navigate to full reel view
```

---

## 🚀 Performance Optimizations

### 1. **Lazy Loading**
```tsx
// Only fetch content when tab changes
useEffect(() => {
  if (user && profileData) {
    fetchContent(activeTab);
  }
}, [activeTab]);
```

### 2. **Skeleton Loaders**
```tsx
// Show skeleton during load
{isLoading ? <ProfileSkeleton /> : <ProfileHeader />}
```

### 3. **Image Optimization**
```tsx
// Next.js Image with sizes
<NextImage
  src={imageUrl}
  fill
  sizes="(max-width: 768px) 33vw, 25vw"
/>
```

### 4. **Conditional Rendering**
```tsx
// Only show saved tab to owner
show: isOwner
```

---

## 🎨 Instagram-Inspired Elements

✅ Cover photo with gradient overlay
✅ Circular avatar overlapping cover
✅ Verified badge animation
✅ 3-column square grid
✅ Hover reveal engagement metrics
✅ Tab navigation with sliding indicator
✅ Edit modal with all profile fields
✅ Gradient action buttons
✅ Share functionality
✅ Private account toggle
✅ Bio link styling
✅ Stats formatting (K/M)
✅ Empty states with illustrations
✅ Smooth loading transitions

---

## 🎯 Next Steps for Users

### Setup Profile
1. Upload a cover photo
2. Change your avatar
3. Write an engaging bio
4. Add your website link
5. Set your location
6. Choose your birthday
7. Select gender preference
8. Toggle privacy if needed

### Grow Your Profile
1. Post content regularly
2. Engage with followers
3. Share your profile link
4. Use Instagram-style stories
5. Create engaging reels
6. Build your following

---

**Your profile is now Instagram-level professional! 🎉**
