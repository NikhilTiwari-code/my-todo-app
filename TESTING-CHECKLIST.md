# ✅ Testing Checklist - Avatar & Follow System

## 🎯 Complete Testing Guide

Use this checklist to verify all features work correctly.

---

## 📋 Pre-Test Setup

- [ ] Dev server is running (`npm run dev`)
- [ ] MongoDB is connected
- [ ] At least 3 test user accounts created
- [ ] Browser console is open (F12)
- [ ] Network tab is open to monitor API calls

---

## 🧪 Test Suite 1: Avatar Upload

### **Test 1.1: Upload Valid Avatar**
- [ ] Navigate to http://localhost:3000/profile
- [ ] Click "Upload Photo" or "Change Photo"
- [ ] Select a valid image (JPG/PNG, < 5MB)
- [ ] Verify preview appears
- [ ] Verify "Uploading..." state shows
- [ ] Verify success message appears
- [ ] Verify avatar displays in profile page
- [ ] Navigate to Friends page
- [ ] Verify avatar displays in your user card
- [ ] Navigate to your user profile (`/friends/[your-id]`)
- [ ] Verify avatar displays (large)

**Expected:** ✅ Avatar appears everywhere, no errors

---

### **Test 1.2: File Validation**
- [ ] Try uploading a file > 5MB
- [ ] Verify error: "File size must be less than 5MB"
- [ ] Try uploading a non-image file (PDF, TXT)
- [ ] Verify error: "Please upload an image file"
- [ ] Try uploading without selecting file
- [ ] Verify nothing happens (graceful)

**Expected:** ✅ Proper error messages, no crashes

---

### **Test 1.3: Remove Avatar**
- [ ] Upload an avatar first
- [ ] Click "Remove" button
- [ ] Confirm in popup dialog
- [ ] Verify avatar is removed
- [ ] Verify initials appear instead
- [ ] Check Friends page - should show initials
- [ ] Check user profile - should show initials

**Expected:** ✅ Avatar removed, fallback to initials

---

### **Test 1.4: Avatar Fallback**
- [ ] Create new user without avatar
- [ ] View on Friends page
- [ ] Verify gradient avatar with first initial
- [ ] Verify correct initial letter
- [ ] Verify gradient colors (blue to purple)

**Expected:** ✅ Beautiful gradient avatar with correct initial

---

## 🧪 Test Suite 2: Bio System

### **Test 2.1: Add Bio**
- [ ] Navigate to Profile page
- [ ] Type bio in text area: "I love building todo apps! 🚀"
- [ ] Verify character counter updates
- [ ] Click "Update Bio"
- [ ] Verify "Updating..." state
- [ ] Verify success message
- [ ] Navigate to Friends page
- [ ] Verify bio appears in your card
- [ ] Navigate to your user profile
- [ ] Verify full bio displays

**Expected:** ✅ Bio saves and displays everywhere

---

### **Test 2.2: Bio Character Limit**
- [ ] Type 500 characters in bio
- [ ] Verify counter shows "500/500"
- [ ] Try typing more
- [ ] Verify text stops at 500 characters
- [ ] Update bio
- [ ] Verify saves correctly

**Expected:** ✅ Hard limit at 500 characters

---

### **Test 2.3: Bio with Emojis**
- [ ] Add bio with emojis: "Love coding 💻 and coffee ☕"
- [ ] Update bio
- [ ] Verify emojis display correctly
- [ ] Check on Friends page
- [ ] Check on user profile

**Expected:** ✅ Emojis render properly

---

### **Test 2.4: Empty Bio**
- [ ] Clear bio completely
- [ ] Update bio
- [ ] Verify saves
- [ ] Check Friends page
- [ ] Verify no bio section appears

**Expected:** ✅ No bio displayed when empty

---

## 🧪 Test Suite 3: Follow System

### **Test 3.1: Follow User**

**Setup:** Login as User A

- [ ] Navigate to Friends page
- [ ] Find User B card
- [ ] Verify button shows "Follow"
- [ ] Click "Follow" button
- [ ] Verify button shows "Loading..."
- [ ] Verify button changes to "Following ✓"
- [ ] Verify button style changes (outline)
- [ ] Click User B's profile
- [ ] Verify follower count increased
- [ ] Navigate to your Profile
- [ ] Verify following count increased

**Expected:** ✅ Follow successful, counts update

---

### **Test 3.2: Unfollow User**

**Setup:** Already following User B

- [ ] Find User B on Friends page
- [ ] Verify button shows "Following ✓"
- [ ] Click "Following ✓" button
- [ ] Verify button shows "Loading..."
- [ ] Verify button changes to "Follow"
- [ ] Verify button style changes (gradient)
- [ ] Click User B's profile
- [ ] Verify follower count decreased
- [ ] Navigate to your Profile
- [ ] Verify following count decreased

**Expected:** ✅ Unfollow successful, counts update

---

### **Test 3.3: Can't Follow Self**

**Setup:** Logged in as User A

- [ ] Navigate to your own profile (`/friends/[your-id]`)
- [ ] Verify no Follow button appears
- [ ] Manually try POST /api/users/[your-id]/follow
- [ ] Verify error: "You cannot follow yourself"

**Expected:** ✅ Can't follow yourself

---

### **Test 3.4: Can't Follow Twice**

**Setup:** Already following User B

- [ ] Follow User B
- [ ] Manually try POST /api/users/[user-b-id]/follow again
- [ ] Verify error: "You are already following this user"

**Expected:** ✅ Prevents duplicate follows

---

### **Test 3.5: Follow Without Login**
- [ ] Logout
- [ ] Try accessing /api/users/[id]/follow
- [ ] Verify 401 error
- [ ] Verify redirect or error message

**Expected:** ✅ Authentication required

---

### **Test 3.6: Follow Multiple Users**

**Setup:** Login as User A

- [ ] Follow User B
- [ ] Follow User C
- [ ] Follow User D
- [ ] Navigate to Profile
- [ ] Verify following count = 3
- [ ] Check each user's profile
- [ ] Verify each has follower count + 1

**Expected:** ✅ Can follow multiple users

---

### **Test 3.7: Multiple Users Follow One**

**Setup:** 3 users follow User A

- [ ] User B follows User A
- [ ] User C follows User A
- [ ] User D follows User A
- [ ] View User A's profile
- [ ] Verify followers count = 3

**Expected:** ✅ Follower count accurate

---

## 🧪 Test Suite 4: UI/UX Tests

### **Test 4.1: Responsive Design**
- [ ] Test on desktop (1920px)
- [ ] Test on laptop (1366px)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] Verify all features work
- [ ] Verify no layout breaks
- [ ] Verify buttons accessible

**Expected:** ✅ Works on all screen sizes

---

### **Test 4.2: Dark Mode**
- [ ] Enable dark mode
- [ ] Check Profile page
- [ ] Check Friends page
- [ ] Check User profile page
- [ ] Verify readable text
- [ ] Verify proper contrast
- [ ] Verify no white flashes

**Expected:** ✅ Dark mode works perfectly

---

### **Test 4.3: Loading States**
- [ ] Slow down network (DevTools → Network → Slow 3G)
- [ ] Upload avatar
- [ ] Verify loading spinner
- [ ] Follow a user
- [ ] Verify "Loading..." text
- [ ] Update bio
- [ ] Verify "Updating..." text

**Expected:** ✅ Clear loading indicators

---

### **Test 4.4: Error Handling**
- [ ] Disconnect internet
- [ ] Try uploading avatar
- [ ] Verify error message
- [ ] Try following user
- [ ] Verify error message
- [ ] Reconnect internet
- [ ] Verify features work again

**Expected:** ✅ Graceful error handling

---

### **Test 4.5: Empty States**
- [ ] View profile with no avatar
- [ ] Verify gradient initials
- [ ] View profile with no bio
- [ ] Verify no bio section
- [ ] View user with no followers
- [ ] Verify "0 Followers" displays

**Expected:** ✅ Proper empty states

---

## 🧪 Test Suite 5: API Tests

### **Test 5.1: GET /api/profile**
```bash
# In browser console or Postman
fetch('/api/profile', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "avatar": "...",
      "bio": "...",
      "followersCount": 0,
      "followingCount": 0,
      "createdAt": "..."
    }
  }
}
```

- [ ] Verify correct user data
- [ ] Verify counts are numbers
- [ ] Verify no password field

---

### **Test 5.2: POST /api/profile**
```bash
fetch('/api/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test bio'
  })
})
```

**Expected:**
- [ ] Status 200
- [ ] Updated user returned
- [ ] Avatar URL saved
- [ ] Bio text saved

---

### **Test 5.3: POST /api/users/[userId]/follow**
```bash
fetch('/api/users/USER_ID_HERE/follow', {
  method: 'POST',
  credentials: 'include'
})
```

**Expected:**
```json
{
  "success": true,
  "message": "User followed successfully",
  "data": {
    "followersCount": 1,
    "followingCount": 0,
    "isFollowing": true
  }
}
```

- [ ] Verify status 200
- [ ] Verify counts updated
- [ ] Verify isFollowing = true

---

### **Test 5.4: DELETE /api/users/[userId]/follow**
```bash
fetch('/api/users/USER_ID_HERE/follow', {
  method: 'DELETE',
  credentials: 'include'
})
```

**Expected:**
```json
{
  "success": true,
  "message": "User unfollowed successfully",
  "data": {
    "followersCount": 0,
    "followingCount": 0,
    "isFollowing": false
  }
}
```

- [ ] Verify status 200
- [ ] Verify counts updated
- [ ] Verify isFollowing = false

---

### **Test 5.5: GET /api/users**
```bash
fetch('/api/users', { credentials: 'include' })
```

**Expected:**
- [ ] Returns array of users
- [ ] Each user has avatar field
- [ ] Each user has bio field
- [ ] Each user has followersCount
- [ ] Each user has followingCount
- [ ] Each user has isFollowing boolean
- [ ] Each user has isCurrentUser boolean

---

### **Test 5.6: GET /api/users/[userId]**
```bash
fetch('/api/users/USER_ID_HERE', { credentials: 'include' })
```

**Expected:**
- [ ] Returns user object
- [ ] Has avatar field
- [ ] Has bio field
- [ ] Has followersCount
- [ ] Has followingCount
- [ ] Has isFollowing boolean
- [ ] Has isCurrentUser boolean

---

## 🧪 Test Suite 6: Database Tests

### **Test 6.1: User Schema Validation**
- [ ] Check MongoDB Compass or Atlas
- [ ] Find Users collection
- [ ] Verify fields exist:
  - [ ] avatar (String)
  - [ ] bio (String)
  - [ ] followers (Array)
  - [ ] following (Array)

---

### **Test 6.2: Follow Relationships**
- [ ] User A follows User B
- [ ] Check User A's document
- [ ] Verify following[] contains User B's ID
- [ ] Check User B's document
- [ ] Verify followers[] contains User A's ID

---

### **Test 6.3: Data Integrity**
- [ ] Follow User B
- [ ] Unfollow User B
- [ ] Check database
- [ ] Verify IDs removed from both arrays
- [ ] Verify no orphaned references

---

## 🧪 Test Suite 7: Security Tests

### **Test 7.1: Authentication Required**
- [ ] Logout
- [ ] Try POST /api/profile
- [ ] Verify 401 error
- [ ] Try POST /api/users/[id]/follow
- [ ] Verify 401 error
- [ ] Try GET /api/profile
- [ ] Verify 401 error

**Expected:** ✅ All require authentication

---

### **Test 7.2: Authorization**
- [ ] Login as User A
- [ ] Try to update User B's profile
- [ ] Verify only own profile updates
- [ ] Try accessing protected routes
- [ ] Verify proper access control

**Expected:** ✅ Can only modify own data

---

### **Test 7.3: Input Validation**
- [ ] Try uploading 10MB file
- [ ] Verify rejected
- [ ] Try bio with 1000 characters
- [ ] Verify truncated to 500
- [ ] Try invalid user ID in follow
- [ ] Verify 404 error

**Expected:** ✅ All inputs validated

---

## 🧪 Test Suite 8: Performance Tests

### **Test 8.1: Load Time**
- [ ] Open Friends page
- [ ] Check Network tab
- [ ] Verify page loads < 2 seconds
- [ ] Check avatar image sizes
- [ ] Verify reasonable file sizes

**Expected:** ✅ Fast loading

---

### **Test 8.2: Large Avatar Files**
- [ ] Upload 4.9MB avatar
- [ ] Verify upload succeeds
- [ ] Check loading time
- [ ] Verify image displays

**Expected:** ✅ Handles large files

---

### **Test 8.3: Many Users**
- [ ] Create 20+ test users
- [ ] Load Friends page
- [ ] Verify all users display
- [ ] Verify no lag
- [ ] Test search functionality

**Expected:** ✅ Handles many users

---

## 📊 Test Results Summary

### **Pass/Fail Tracker**

| Test Suite | Tests | Passed | Failed | Notes |
|------------|-------|--------|--------|-------|
| Avatar Upload | 4 | __ | __ | |
| Bio System | 4 | __ | __ | |
| Follow System | 7 | __ | __ | |
| UI/UX | 5 | __ | __ | |
| API | 6 | __ | __ | |
| Database | 3 | __ | __ | |
| Security | 3 | __ | __ | |
| Performance | 3 | __ | __ | |
| **Total** | **35** | **__** | **__** | |

---

## 🐛 Bug Report Template

If you find issues:

```markdown
**Bug:** [Brief description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Browser:** [Chrome/Firefox/Safari/Edge]
**OS:** [Windows/Mac/Linux]
**Screenshots:** [If applicable]
**Console Errors:** [If any]
```

---

## ✅ Final Checklist

Before considering testing complete:

- [ ] All 35 tests passed
- [ ] No console errors
- [ ] No network errors
- [ ] Works on multiple browsers
- [ ] Works on mobile
- [ ] Dark mode tested
- [ ] All features documented
- [ ] No data loss scenarios
- [ ] Performance acceptable
- [ ] Security validated

---

## 🎯 Critical Path Testing

**Minimum tests to run before deployment:**

1. ✅ Upload avatar → appears everywhere
2. ✅ Add bio → appears on profiles
3. ✅ Follow user → counts update
4. ✅ Unfollow user → counts update
5. ✅ Logout → can't access protected routes
6. ✅ Responsive on mobile
7. ✅ No console errors

---

## 🚀 Ready for Production?

After all tests pass:

- [ ] ✅ All features work
- [ ] ✅ No bugs found
- [ ] ✅ Performance good
- [ ] ✅ Security validated
- [ ] ✅ Mobile responsive
- [ ] ✅ Documentation complete

**If all checked, you're ready to deploy! 🎉**

---

## 📝 Testing Notes

**Date Tested:** _________________
**Tested By:** _________________
**Environment:** _________________
**Result:** ☐ Pass  ☐ Fail  ☐ Needs Work

**Issues Found:**
```
[List any issues or bugs discovered]
```

**Next Steps:**
```
[Action items or improvements needed]
```

---

**Happy Testing! 🧪✨**
