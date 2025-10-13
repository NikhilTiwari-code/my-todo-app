# 🔧 Troubleshooting Guide - 500 Errors

## Issue: `/api/auth/me` returning 500 errors

### Quick Fixes:

### 1. **Restart the Dev Server** ⚡
The model import fixes require a server restart:

```powershell
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### 2. **Check MongoDB Connection** 🔌
Verify your `.env.local` has the correct MongoDB URI:

```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### 3. **Clear Next.js Cache** 🗑️
Sometimes Next.js caches old module resolutions:

```powershell
# Delete the .next folder
Remove-Item -Recurse -Force .next

# Restart dev server
npm run dev
```

### 4. **Check Database Connection** 
The error might be from MongoDB connection. Make sure:
- MongoDB Atlas is accessible
- Your IP is whitelisted in MongoDB Atlas
- Connection string has correct credentials

### 5. **Check Console for Detailed Errors**
Look at the terminal running `npm run dev` for detailed error messages. They will show exactly what's failing.

---

## Common Issues:

### **Issue: "Module not found: @/models/..."**
✅ **Fixed!** Changed from `@/models/todo.models` to `@/models/todos.model`

### **Issue: "Cannot connect to MongoDB"**
**Solution:** 
1. Check if MongoDB URI is in `.env.local`
2. Verify network connection
3. Check MongoDB Atlas IP whitelist

### **Issue: "User model errors"**
**Solution:**
The user model exists at `src/models/user.models.ts` and should work after server restart.

---

## Test Checklist:

1. ✅ Server restarted after code changes
2. ✅ `.env.local` has `MONGODB_URI` and `JWT_SECRET`
3. ✅ MongoDB Atlas is accessible
4. ✅ You're logged in (have valid JWT token)
5. ✅ Browser console shows no errors
6. ✅ Terminal shows server running on port 3000

---

## If Still Not Working:

**Share the exact error from the terminal!** 

The terminal running `npm run dev` will show detailed error messages like:
```
Error fetching user details: MongooseError: ...
```

This tells us exactly what's wrong! 📝
