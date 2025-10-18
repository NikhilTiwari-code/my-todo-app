# ✅ Verify Your .env.local File

Open your `.env.local` file and make sure it has:

```env
# YouTube Data API v3
YOUTUBE_API_KEY=your_actual_youtube_api_key_here

# Example (replace with your real key):
# YOUTUBE_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrst
```

## ⚠️ Important Checks:

1. **Variable name must be exactly:** `YOUTUBE_API_KEY`
2. **No quotes needed** around the key
3. **No spaces** before or after the =
4. **Save the file** after adding

## 🔧 After Adding:

1. **Stop your dev server** (Ctrl+C)
2. **Restart it:**
   ```bash
   npm run dev
   ```
3. **Click the 🔥 button** on /trending page
4. **YouTube videos will appear!**

## 📺 Expected Result:

You'll get trending videos like:
- Top tech videos
- Popular gaming videos
- Viral entertainment content
- Thumbnails and view counts

---

**If it still doesn't work, check the terminal for error messages!**
