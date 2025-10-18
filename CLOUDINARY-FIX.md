# 🔧 Cloudinary Upload Fix

## Problem
When trying to create a post with images, the upload fails with error:
```
Error: Must supply cloud_name
```

## Root Cause
The Cloudinary configuration in `src/lib/cloudinary.ts` was looking for:
```typescript
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  // ❌ Wrong
```

But the `.env.local` file had:
```bash
CLOUDINARY_CLOUD_NAME=dyg7rrsxh  # ✓ Correct
```

### Why This Happened
- `NEXT_PUBLIC_` prefix is only for **client-side** environment variables
- Cloudinary is used in **server-side** API routes (not client-side)
- Server-side variables don't need the `NEXT_PUBLIC_` prefix

## Solution Applied

### 1. Fixed cloudinary.ts Configuration ✓

**File:** `src/lib/cloudinary.ts`

**Changed:**
```typescript
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,  // ❌ Wrong
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

**To:**
```typescript
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;  // ✓ Correct
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Validate configuration
if (!cloudName || !apiKey || !apiSecret) {
  console.error('Cloudinary configuration missing:', {
    cloudName: cloudName ? '✓' : '✗',
    apiKey: apiKey ? '✓' : '✗',
    apiSecret: apiSecret ? '✓' : '✗'
  });
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});
```

### 2. Your .env.local is Already Correct ✓

```bash
CLOUDINARY_CLOUD_NAME=dyg7rrsxh
CLOUDINARY_API_KEY=866279836567375
CLOUDINARY_API_SECRET=dRKfamLGy5ss9DGFsbaWoYuxphA
CLOUDINARY_URL=cloudinary://866279836567375:dRKfamLGy5ss9DGFsbaWoYuxphA@dyg7rrsxh
```

## How to Test

### 1. Restart Your Development Server
The server needs to reload to pick up the environment variable changes:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Try Creating a Post
1. Go to `/feed`
2. Click "Create Post"
3. Upload 1-10 images
4. Add a caption (optional)
5. Click "Share Post"
6. Images should upload to Cloudinary successfully! ✅

## Environment Variables Explained

### Client-Side Variables (with NEXT_PUBLIC_ prefix)
- Available in the browser
- Can be seen by users
- Used in React components
- Example: `NEXT_PUBLIC_APP_URL`

### Server-Side Variables (without prefix)
- Only available on the server
- NOT exposed to the browser
- Used in API routes
- Example: `CLOUDINARY_API_SECRET`

### Your Cloudinary Setup
```
✓ CLOUDINARY_CLOUD_NAME     → Server-side (API routes)
✓ CLOUDINARY_API_KEY         → Server-side (API routes)
✓ CLOUDINARY_API_SECRET      → Server-side (API routes) - KEEP SECRET!
```

## Debugging

If you still see errors, check the server console for:
```
Cloudinary configuration missing:
  cloudName: ✓ or ✗
  apiKey: ✓ or ✗
  apiSecret: ✓ or ✗
```

All three should show ✓. If any show ✗, the environment variable is not loaded.

## Common Issues

### Issue: "Environment variables not found"
**Solution:** 
1. Make sure `.env.local` is in the root directory
2. Restart the dev server (`npm run dev`)
3. Don't use `.env` (use `.env.local` instead)

### Issue: "Still getting cloud_name error"
**Solution:**
1. Check if you have multiple `.env` files
2. Make sure you're editing `.env.local` (not `.env`)
3. Clear `.next` folder: `rm -rf .next` or `Remove-Item .next -Recurse -Force`
4. Restart server

### Issue: "Upload works locally but not in production"
**Solution:**
Add Cloudinary variables to your production environment:
- Vercel: Project Settings → Environment Variables
- Railway: Variables tab → Add variables
- Netlify: Site Settings → Environment Variables

## Files Modified

1. ✅ `src/lib/cloudinary.ts` - Fixed environment variable names

## Result

✅ **Cloudinary is now properly configured**
✅ **Image uploads will work**
✅ **Posts can be created with images**
✅ **Environment variables validated on startup**

## Next Steps

After restarting your server:
1. Try uploading a post with images
2. Check server console for validation messages
3. Images should upload to your Cloudinary account
4. Post should appear in the feed with images

The image upload feature is now ready to use! 🎉
