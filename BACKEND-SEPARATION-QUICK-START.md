# 🚀 Quick Start: Backend Separation Checklist

**Goal**: Extract APIs from Next.js into dedicated Express.js backend

---

## ✅ Phase 1: Initial Setup (Day 1-2)

### Step 1: Create Backend Directory
```bash
# In project root
mkdir backend
cd backend
npm init -y
```

### Step 2: Install Core Dependencies
```bash
# Runtime dependencies
npm install express cors helmet compression morgan
npm install mongoose ioredis jsonwebtoken bcryptjs zod
npm install dotenv socket.io cloudinary multer

# TypeScript & Dev Dependencies
npm install -D typescript @types/node @types/express
npm install -D @types/cors @types/jsonwebtoken @types/bcryptjs
npm install -D @types/multer nodemon ts-node

# Testing
npm install -D jest @types/jest ts-jest supertest @types/supertest
```

### Step 3: Create Basic Structure
```bash
mkdir -p src/{config,modules,shared,models,socket}
mkdir -p src/shared/{middleware,utils,errors,types}
mkdir -p src/modules/{auth,todos,posts,comments,messages,users}
```

### Step 4: Copy Environment Variables
```bash
# Copy .env.local from main project
cp ../my-todo-app/.env.local .env

# Add new variables
echo "PORT=4000" >> .env
echo "FRONTEND_URL=http://localhost:3000" >> .env
```

---

## ✅ Phase 2: Move Core Logic (Day 3-7)

### Step 5: Copy Models (Already Done!)
```bash
# Models are already in src/models/
# Just ensure they're using correct imports
```

**Files to Copy**:
- ✅ `src/models/user.model.ts`
- ✅ `src/models/todo.model.ts`
- ✅ `src/models/post.model.ts`
- ✅ `src/models/comment.model.ts`
- ✅ `src/models/message.model.ts`

### Step 6: Extract Database Connection
**Create**: `backend/src/config/database.ts`
```typescript
import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found');
  
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
};
```

### Step 7: Extract Redis Connection
**Create**: `backend/src/config/redis.ts`
```typescript
import Redis from 'ioredis';

export const connectRedis = async () => {
  if (process.env.SKIP_REDIS === 'true') return null;
  
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  console.log('✅ Redis connected');
  return client;
};
```

### Step 8: Create Auth Middleware
**Create**: `backend/src/shared/middleware/auth.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                  req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Step 9: Create Express App
**Create**: `backend/src/app.ts`
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Routes (will create these)
import authRoutes from './modules/auth/auth.routes';
import todoRoutes from './modules/todos/todos.routes';
import postRoutes from './modules/posts/posts.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/posts', postRoutes);

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

export default app;
```

### Step 10: Create Server Entry Point
**Create**: `backend/src/server.ts`
```typescript
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

---

## ✅ Phase 3: Create First Module (Day 8-10)

### Step 11: Create Todo Module Structure
```bash
cd src/modules/todos
touch todos.types.ts todos.validation.ts todos.repository.ts
touch todos.service.ts todos.controller.ts todos.routes.ts
```

### Step 12: Copy Business Logic from API Routes
**From**: `my-todo-app/src/app/api/todos/route.ts`
**To**: `backend/src/modules/todos/*.ts`

**See the detailed guide for complete code examples!**

Key transformations:
```typescript
// ❌ OLD: Next.js API Route
export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const todos = await Todo.find({ userId });
  return NextResponse.json(todos);
}

// ✅ NEW: Express Controller
export class TodoController {
  getTodos = async (req: Request, res: Response) => {
    const todos = await this.service.getTodos(req.user!.id);
    res.json({ success: true, data: todos });
  };
}
```

---

## ✅ Phase 4: Update Frontend (Day 11-14)

### Step 13: Install Axios
```bash
cd ../frontend  # or stay in my-todo-app
npm install axios
```

### Step 14: Create API Client
**Create**: `src/lib/api/client.ts`
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { apiClient };
```

### Step 15: Create API Functions
**Create**: `src/lib/api/todos.api.ts`
```typescript
import { apiClient } from './client';

export const todosApi = {
  getTodos: () => apiClient.get('/api/todos'),
  createTodo: (data: any) => apiClient.post('/api/todos', data),
  updateTodo: (id: string, data: any) => apiClient.patch(`/api/todos/${id}`, data),
  deleteTodo: (id: string) => apiClient.delete(`/api/todos/${id}`),
};
```

### Step 16: Replace API Route Calls
**Before** (in components):
```typescript
// ❌ OLD
const response = await fetch('/api/todos');
const data = await response.json();
```

**After**:
```typescript
// ✅ NEW
import { todosApi } from '@/lib/api/todos.api';
const response = await todosApi.getTodos();
const data = response.data;
```

---

## ✅ Phase 5: Testing (Day 15-21)

### Step 17: Test Backend Independently
```bash
# Start backend only
cd backend
npm run dev  # Port 4000

# Test endpoints with curl
curl http://localhost:4000/health
curl http://localhost:4000/api/todos -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 18: Test Frontend with Backend
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd my-todo-app && npm run dev

# Terminal 3: Test
curl http://localhost:3000
```

### Step 19: Write Unit Tests
```typescript
// backend/src/modules/todos/__tests__/todos.service.test.ts
describe('TodoService', () => {
  it('should create todo', async () => {
    const service = new TodoService();
    const todo = await service.createTodo(userId, data);
    expect(todo).toBeDefined();
  });
});
```

---

## 📊 Progress Checklist

### Backend Setup ☐
- [ ] Created `backend/` directory
- [ ] Installed dependencies
- [ ] Created folder structure
- [ ] Configured TypeScript
- [ ] Created `server.ts` and `app.ts`

### Infrastructure ☐
- [ ] Extracted database connection
- [ ] Extracted Redis connection
- [ ] Created auth middleware
- [ ] Created error handler middleware
- [ ] Created rate limiter middleware

### Modules (for each: Auth, Todos, Posts, Messages) ☐
- [ ] Created types file
- [ ] Created validation schemas
- [ ] Created repository (data layer)
- [ ] Created service (business logic)
- [ ] Created controller (API layer)
- [ ] Created routes
- [ ] Added tests

### Frontend Updates ☐
- [ ] Installed Axios
- [ ] Created API client
- [ ] Created API functions for each module
- [ ] Replaced fetch calls with API client
- [ ] Updated environment variables
- [ ] Tested all features

### Deployment ☐
- [ ] Backend deployed to Railway/Render
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] SSL certificates working

---

## 🎯 Quick Win Strategy

### Start Small:
**Week 1**: Extract Todos module only
- Focus on one module end-to-end
- Get it working perfectly
- Learn the pattern

**Week 2**: Extract Auth module
- More complex (JWT, cookies)
- Critical for everything else

**Week 3**: Extract Posts/Feed module
- Includes images (Cloudinary)
- More complex business logic

**Week 4**: Extract Messages module
- Includes Socket.io
- Real-time features

---

## 💡 Pro Tips

### 1. Keep Both Running During Migration
```bash
# Don't break existing app while migrating
# Run both Next.js API and Express backend
# Gradually migrate endpoints
```

### 2. Use Feature Flags
```typescript
// In frontend
const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_BACKEND === 'true';

const getTodos = async () => {
  if (USE_NEW_API) {
    return apiClient.get('/api/todos'); // New backend
  } else {
    return fetch('/api/todos');  // Old Next.js API
  }
};
```

### 3. Test Thoroughly
```bash
# Don't skip testing!
# Test each endpoint after migration
npm test
```

### 4. Document As You Go
```markdown
# Keep track of what's migrated
- [x] GET /api/todos
- [x] POST /api/todos
- [ ] GET /api/posts
- [ ] POST /api/posts
```

---

## 🚨 Common Pitfalls

### 1. CORS Issues
**Problem**: Frontend can't reach backend
**Solution**: Configure CORS properly
```typescript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

### 2. Authentication Tokens
**Problem**: JWT not sent from frontend
**Solution**: Use `withCredentials: true` in Axios

### 3. MongoDB Connection
**Problem**: Multiple connections from both apps
**Solution**: Use connection pooling

### 4. Port Conflicts
**Problem**: Both apps on same port
**Solution**: Backend on 4000, Frontend on 3000

---

## 📚 Resources

### Documentation:
- 📖 [Full Migration Guide](./MODULAR-MONOLITH-MIGRATION-DETAILED.md) - 100+ pages
- 🏗️ [Architecture Comparison](./docs/ARCHITECTURE-COMPARISON.md)
- 🔐 [Auth Migration Guide](./docs/AUTH-MIGRATION.md)

### Code Examples:
- 💻 Complete Todo module example (in detailed guide)
- 💻 Complete Auth module example (in detailed guide)
- 💻 Frontend API client examples (in detailed guide)

### Tools:
- 🔧 Postman collection (test APIs)
- 🔧 Insomnia collection (alternative)
- 🔧 Thunder Client (VS Code extension)

---

## 🎉 Success Criteria

### You'll Know You're Done When:
- ✅ Backend runs independently on port 4000
- ✅ Frontend runs independently on port 3000
- ✅ All features work exactly the same
- ✅ Tests pass (80%+ coverage)
- ✅ Both apps deployed separately
- ✅ Performance is same or better
- ✅ You can scale backend independently

---

## 🚀 Next Steps After Migration

1. **Add more tests** (aim for 90%+ coverage)
2. **Add monitoring** (Sentry, New Relic)
3. **Add logging** (Winston, Pino)
4. **Add API documentation** (Swagger)
5. **Consider microservices** (if needed)

---

**Ready to start?** Begin with Phase 1 and take it step by step! 💪

**Questions?** Check the detailed guide or ask for help! 🤝

**Time Estimate**: 4-6 weeks (working part-time, 2-3 hrs/day)

Good luck! 🍀
