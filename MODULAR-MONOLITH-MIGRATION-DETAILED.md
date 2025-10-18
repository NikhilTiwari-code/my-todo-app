# 🏗️ Modular Monolith Migration Guide

**From**: Next.js Monolith (API Routes + UI)
**To**: Modular Monolith Backend + Next.js Frontend

---

## 📋 Table of Contents

1. [Why Refactor?](#why-refactor)
2. [Architecture Overview](#architecture-overview)
3. [Step-by-Step Migration](#step-by-step-migration)
4. [Folder Structure](#folder-structure)
5. [Implementation Examples](#implementation-examples)
6. [Testing Strategy](#testing-strategy)
7. [Deployment](#deployment)

---

## 🎯 Why Refactor?

### Current Problems:

```typescript
// ❌ CURRENT: Everything in API routes
// src/app/api/todos/route.ts
export async function POST(request: Request) {
  // 1. Auth logic
  const token = cookies().get('token');
  // 2. Validation logic
  const body = await request.json();
  // 3. Business logic
  const todo = await Todo.create({ ...body, userId });
  // 4. Response formatting
  return NextResponse.json(todo);
}
```

**Issues**:
- ❌ Can't test business logic independently
- ❌ Can't reuse logic across different endpoints
- ❌ Hard to scale (Next.js doesn't separate well)
- ❌ Tight coupling makes changes risky
- ❌ Can't easily move to microservices later

### After Refactoring:

```typescript
// ✅ AFTER: Clean separation
// Backend API
app.post('/api/todos', authMiddleware, async (req, res) => {
  const todo = await todoService.createTodo(req.user.id, req.body);
  res.json(todo);
});

// Frontend calls API
const createTodo = async (data) => {
  const response = await fetch('http://localhost:4000/api/todos', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

**Benefits**:
- ✅ Business logic testable independently
- ✅ Can deploy backend/frontend separately
- ✅ Can scale backend independently
- ✅ Clear boundaries & responsibilities
- ✅ Easy migration to microservices

---

## 🏛️ Architecture Overview

### Before (Current):

```
┌─────────────────────────────────────┐
│         Next.js Application         │
│  ┌─────────────────────────────┐   │
│  │   UI Components (React)     │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   API Routes (/app/api/*)   │   │
│  │  • Business Logic           │   │
│  │  • Database Calls           │   │
│  │  • Authentication           │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   MongoDB + Redis           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### After (Modular Monolith):

```
┌────────────────────┐         ┌─────────────────────────┐
│   Next.js          │         │   Express.js Backend    │
│   (Frontend Only)  │◄────────┤   (API + Business)      │
│                    │  HTTP   │                         │
│  • UI Components   │         │  ┌───────────────────┐  │
│  • Pages           │         │  │ Presentation      │  │
│  • Client State    │         │  │  • Controllers    │  │
│  • API Calls       │         │  │  • Middleware     │  │
└────────────────────┘         │  └───────────────────┘  │
                               │  ┌───────────────────┐  │
                               │  │ Business Logic    │  │
                               │  │  • Services       │  │
                               │  │  • Use Cases      │  │
                               │  └───────────────────┘  │
                               │  ┌───────────────────┐  │
                               │  │ Data Access       │  │
                               │  │  • Repositories   │  │
                               │  │  • Models         │  │
                               │  └───────────────────┘  │
                               │  ┌───────────────────┐  │
                               │  │ Infrastructure    │  │
                               │  │  • Database       │  │
                               │  │  • Cache (Redis)  │  │
                               │  │  • File Upload    │  │
                               │  └───────────────────┘  │
                               └─────────────────────────┘
```

---

## 📁 New Folder Structure

### Backend (Express.js) - `backend/`

```
backend/
├── src/
│   ├── config/                    # Configuration
│   │   ├── database.ts           # MongoDB connection
│   │   ├── redis.ts              # Redis connection
│   │   ├── cloudinary.ts         # Cloudinary config
│   │   └── env.ts                # Environment variables
│   │
│   ├── modules/                   # Domain modules (bounded contexts)
│   │   ├── auth/                 # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── todos/                # Todo module
│   │   │   ├── todos.controller.ts
│   │   │   ├── todos.service.ts
│   │   │   ├── todos.repository.ts
│   │   │   ├── todos.routes.ts
│   │   │   ├── todos.types.ts
│   │   │   ├── todos.validation.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── posts/                # Feed/Posts module
│   │   │   ├── posts.controller.ts
│   │   │   ├── posts.service.ts
│   │   │   ├── posts.repository.ts
│   │   │   ├── posts.routes.ts
│   │   │   ├── posts.types.ts
│   │   │   ├── posts.validation.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── comments/             # Comments module
│   │   │   ├── comments.controller.ts
│   │   │   ├── comments.service.ts
│   │   │   ├── comments.repository.ts
│   │   │   ├── comments.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── messages/             # Messaging module
│   │   │   ├── messages.controller.ts
│   │   │   ├── messages.service.ts
│   │   │   ├── messages.repository.ts
│   │   │   ├── messages.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   └── users/                # User management
│   │       ├── users.controller.ts
│   │       ├── users.service.ts
│   │       ├── users.repository.ts
│   │       ├── users.routes.ts
│   │       └── __tests__/
│   │
│   ├── shared/                    # Shared utilities
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   ├── validator.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   └── cors.middleware.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.util.ts
│   │   │   ├── bcrypt.util.ts
│   │   │   ├── logger.util.ts
│   │   │   └── cache.util.ts
│   │   │
│   │   ├── types/
│   │   │   ├── express.d.ts      # Express type extensions
│   │   │   └── common.types.ts
│   │   │
│   │   └── errors/
│   │       ├── AppError.ts
│   │       ├── ValidationError.ts
│   │       └── AuthError.ts
│   │
│   ├── models/                    # Mongoose models (shared)
│   │   ├── user.model.ts
│   │   ├── todo.model.ts
│   │   ├── post.model.ts
│   │   ├── comment.model.ts
│   │   └── message.model.ts
│   │
│   ├── socket/                    # Socket.io handlers
│   │   ├── socket.gateway.ts
│   │   ├── messageSocket.ts
│   │   ├── postSocket.ts
│   │   └── presenceSocket.ts
│   │
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
│
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Frontend (Next.js) - `frontend/`

```
frontend/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── todos/
│   │   │   ├── feed/
│   │   │   ├── messages/
│   │   │   └── profile/
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/                # React components
│   │   ├── auth/
│   │   ├── todos/
│   │   ├── feed/
│   │   ├── messages/
│   │   └── ui/
│   │
│   ├── lib/                       # Frontend utilities
│   │   ├── api/                   # API client
│   │   │   ├── client.ts         # Axios/Fetch wrapper
│   │   │   ├── auth.api.ts
│   │   │   ├── todos.api.ts
│   │   │   ├── posts.api.ts
│   │   │   └── messages.api.ts
│   │   │
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useTodos.ts
│   │   │   └── usePosts.ts
│   │   │
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── validators.ts
│   │
│   ├── contexts/                  # React Context
│   │   ├── AuthContext.tsx
│   │   └── SocketContext.tsx
│   │
│   └── types/                     # TypeScript types
│       ├── api.types.ts
│       └── models.types.ts
│
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🚀 Step-by-Step Migration

### Phase 1: Setup Backend Structure (Week 1)

#### Step 1.1: Create Backend Directory

```bash
# In project root
mkdir -p backend/src/{config,modules,shared,models,socket}
cd backend
npm init -y
```

#### Step 1.2: Install Backend Dependencies

```bash
npm install express cors helmet compression morgan
npm install mongoose ioredis jsonwebtoken bcryptjs
npm install zod multer cloudinary socket.io
npm install dotenv

# Dev dependencies
npm install -D typescript @types/express @types/node
npm install -D @types/cors @types/jsonwebtoken @types/bcryptjs
npm install -D nodemon ts-node
npm install -D jest @types/jest ts-jest supertest @types/supertest
```

#### Step 1.3: Setup TypeScript Configuration

**backend/tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@config/*": ["config/*"],
      "@modules/*": ["modules/*"],
      "@shared/*": ["shared/*"],
      "@models/*": ["models/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### Step 1.4: Create Package Scripts

**backend/package.json**:
```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

### Phase 2: Extract Core Infrastructure (Week 1-2)

#### Step 2.1: Database Configuration

**backend/src/config/database.ts**:
```typescript
import mongoose from 'mongoose';
import { logger } from '@shared/utils/logger.util';

export const connectDatabase = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI is not defined');
    }

    await mongoose.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};
```

#### Step 2.2: Redis Configuration

**backend/src/config/redis.ts**:
```typescript
import Redis from 'ioredis';
import { logger } from '@shared/utils/logger.util';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis | null> => {
  try {
    if (process.env.SKIP_REDIS === 'true') {
      logger.info('⚠️ Redis skipped (SKIP_REDIS=true)');
      return null;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('❌ Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    return redisClient;
    
  } catch (error) {
    logger.error('❌ Redis initialization failed:', error);
    return null;
  }
};

export const getRedisClient = (): Redis | null => redisClient;
```

#### Step 2.3: Environment Configuration

**backend/src/config/env.ts**:
```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  REDIS_URL: z.string().optional(),
  SKIP_REDIS: z.enum(['true', 'false']).default('false'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
```

---

### Phase 3: Build Modular Structure (Week 2-3)

#### Step 3.1: Create Todo Module

**backend/src/modules/todos/todos.types.ts**:
```typescript
import { Types } from 'mongoose';

export interface CreateTodoDTO {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

export interface UpdateTodoDTO {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  isCompleted?: boolean;
  dueDate?: Date;
}

export interface TodoFilters {
  isCompleted?: boolean;
  priority?: 'low' | 'medium' | 'high';
  q?: string;
}

export interface TodoQuery extends TodoFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'dueDate' | 'title';
  order?: 'asc' | 'desc';
}
```

**backend/src/modules/todos/todos.validation.ts**:
```typescript
import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  isCompleted: z.boolean().optional(),
  dueDate: z.string().datetime().optional(),
});

export const todoQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100)).default('10'),
  isCompleted: z.enum(['true', 'false']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  q: z.string().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'title']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
```

**backend/src/modules/todos/todos.repository.ts**:
```typescript
import { Types } from 'mongoose';
import Todo from '@models/todo.model';
import { CreateTodoDTO, UpdateTodoDTO, TodoFilters } from './todos.types';

export class TodoRepository {
  async create(userId: Types.ObjectId, data: CreateTodoDTO) {
    return await Todo.create({ ...data, userId });
  }

  async findById(id: Types.ObjectId) {
    return await Todo.findById(id).lean();
  }

  async findByIdAndUserId(id: Types.ObjectId, userId: Types.ObjectId) {
    return await Todo.findOne({ _id: id, userId }).lean();
  }

  async findAll(
    userId: Types.ObjectId,
    filters: TodoFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc'
  ) {
    const query: any = { userId };

    // Apply filters
    if (filters.isCompleted !== undefined) {
      query.isCompleted = filters.isCompleted;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.q) {
      query.$or = [
        { title: { $regex: filters.q, $options: 'i' } },
        { description: { $regex: filters.q, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [todos, total] = await Promise.all([
      Todo.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Todo.countDocuments(query),
    ]);

    return {
      todos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: Types.ObjectId, userId: Types.ObjectId, data: UpdateTodoDTO) {
    return await Todo.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true }
    ).lean();
  }

  async delete(id: Types.ObjectId, userId: Types.ObjectId) {
    return await Todo.findOneAndDelete({ _id: id, userId }).lean();
  }

  async count(userId: Types.ObjectId, filters: TodoFilters) {
    const query: any = { userId };
    if (filters.isCompleted !== undefined) {
      query.isCompleted = filters.isCompleted;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    return await Todo.countDocuments(query);
  }
}
```

**backend/src/modules/todos/todos.service.ts**:
```typescript
import { Types } from 'mongoose';
import { TodoRepository } from './todos.repository';
import { CreateTodoDTO, UpdateTodoDTO, TodoQuery } from './todos.types';
import { AppError } from '@shared/errors/AppError';
import { cacheUtil } from '@shared/utils/cache.util';

export class TodoService {
  private repository: TodoRepository;

  constructor() {
    this.repository = new TodoRepository();
  }

  async createTodo(userId: Types.ObjectId, data: CreateTodoDTO) {
    const todo = await this.repository.create(userId, data);
    
    // Invalidate cache
    await cacheUtil.invalidate(`todos:user:${userId}`);
    
    return todo;
  }

  async getTodoById(id: Types.ObjectId, userId: Types.ObjectId) {
    // Try cache first
    const cacheKey = `todo:${id}`;
    const cached = await cacheUtil.get(cacheKey);
    if (cached) return cached;

    const todo = await this.repository.findByIdAndUserId(id, userId);
    
    if (!todo) {
      throw new AppError('Todo not found', 404);
    }

    // Cache for 5 minutes
    await cacheUtil.set(cacheKey, todo, 300);
    
    return todo;
  }

  async getTodos(userId: Types.ObjectId, query: TodoQuery) {
    const { page, limit, sortBy, order, ...filters } = query;
    
    // Try cache
    const cacheKey = `todos:user:${userId}:${JSON.stringify(query)}`;
    const cached = await cacheUtil.get(cacheKey);
    if (cached) return cached;

    const result = await this.repository.findAll(
      userId,
      filters,
      page,
      limit,
      sortBy,
      order
    );

    // Cache for 5 minutes
    await cacheUtil.set(cacheKey, result, 300);
    
    return result;
  }

  async updateTodo(id: Types.ObjectId, userId: Types.ObjectId, data: UpdateTodoDTO) {
    const todo = await this.repository.update(id, userId, data);
    
    if (!todo) {
      throw new AppError('Todo not found or unauthorized', 404);
    }

    // Invalidate cache
    await cacheUtil.invalidate(`todo:${id}`);
    await cacheUtil.invalidate(`todos:user:${userId}`);
    
    return todo;
  }

  async deleteTodo(id: Types.ObjectId, userId: Types.ObjectId) {
    const todo = await this.repository.delete(id, userId);
    
    if (!todo) {
      throw new AppError('Todo not found or unauthorized', 404);
    }

    // Invalidate cache
    await cacheUtil.invalidate(`todo:${id}`);
    await cacheUtil.invalidate(`todos:user:${userId}`);
    
    return { message: 'Todo deleted successfully' };
  }
}
```

**backend/src/modules/todos/todos.controller.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { TodoService } from './todos.service';
import { createTodoSchema, updateTodoSchema, todoQuerySchema } from './todos.validation';

export class TodoController {
  private service: TodoService;

  constructor() {
    this.service = new TodoService();
  }

  createTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = new Types.ObjectId(req.user!.id);
      const data = createTodoSchema.parse(req.body);
      
      const todo = await this.service.createTodo(userId, data);
      
      res.status(201).json({
        success: true,
        data: todo,
      });
    } catch (error) {
      next(error);
    }
  };

  getTodos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = new Types.ObjectId(req.user!.id);
      const query = todoQuerySchema.parse(req.query);
      
      const result = await this.service.getTodos(userId, query);
      
      res.json({
        success: true,
        data: result.todos,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getTodoById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = new Types.ObjectId(req.user!.id);
      const id = new Types.ObjectId(req.params.id);
      
      const todo = await this.service.getTodoById(id, userId);
      
      res.json({
        success: true,
        data: todo,
      });
    } catch (error) {
      next(error);
    }
  };

  updateTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = new Types.ObjectId(req.user!.id);
      const id = new Types.ObjectId(req.params.id);
      const data = updateTodoSchema.parse(req.body);
      
      const todo = await this.service.updateTodo(id, userId, data);
      
      res.json({
        success: true,
        data: todo,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = new Types.ObjectId(req.user!.id);
      const id = new Types.ObjectId(req.params.id);
      
      const result = await this.service.deleteTodo(id, userId);
      
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}
```

**backend/src/modules/todos/todos.routes.ts**:
```typescript
import { Router } from 'express';
import { TodoController } from './todos.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { rateLimiterMiddleware } from '@shared/middleware/rateLimiter.middleware';

const router = Router();
const controller = new TodoController();

// All routes require authentication
router.use(authMiddleware);

// GET /api/todos - List todos with filters
router.get(
  '/',
  rateLimiterMiddleware('read'),
  controller.getTodos
);

// POST /api/todos - Create todo
router.post(
  '/',
  rateLimiterMiddleware('mutation'),
  controller.createTodo
);

// GET /api/todos/:id - Get single todo
router.get(
  '/:id',
  rateLimiterMiddleware('read'),
  controller.getTodoById
);

// PATCH /api/todos/:id - Update todo
router.patch(
  '/:id',
  rateLimiterMiddleware('mutation'),
  controller.updateTodo
);

// DELETE /api/todos/:id - Delete todo
router.delete(
  '/:id',
  rateLimiterMiddleware('mutation'),
  controller.deleteTodo
);

export default router;
```

---

### Phase 4: Frontend API Client (Week 3)

**frontend/src/lib/api/client.ts**:
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      timeout: 15000,
      withCredentials: true, // Send cookies
    });

    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired - redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

**frontend/src/lib/api/todos.api.ts**:
```typescript
import { apiClient } from './client';

export interface Todo {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  dueDate?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodosResponse {
  success: boolean;
  data: Todo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  isCompleted?: boolean;
  dueDate?: string;
}

export interface TodoFilters {
  page?: number;
  limit?: number;
  isCompleted?: boolean;
  priority?: 'low' | 'medium' | 'high';
  q?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'title';
  order?: 'asc' | 'desc';
}

export const todosApi = {
  // Get all todos with filters
  async getTodos(filters?: TodoFilters): Promise<TodosResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    return apiClient.get(`/api/todos?${params.toString()}`);
  },

  // Get single todo
  async getTodo(id: string): Promise<{ success: boolean; data: Todo }> {
    return apiClient.get(`/api/todos/${id}`);
  },

  // Create todo
  async createTodo(data: CreateTodoData): Promise<{ success: boolean; data: Todo }> {
    return apiClient.post('/api/todos', data);
  },

  // Update todo
  async updateTodo(id: string, data: UpdateTodoData): Promise<{ success: boolean; data: Todo }> {
    return apiClient.patch(`/api/todos/${id}`, data);
  },

  // Delete todo
  async deleteTodo(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/todos/${id}`);
  },
};
```

**frontend/src/lib/hooks/useTodos.ts**:
```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todosApi, TodoFilters, CreateTodoData, UpdateTodoData } from '@/lib/api/todos.api';
import { toast } from 'react-hot-toast';

export const useTodos = (filters?: TodoFilters) => {
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => todosApi.getTodos(filters),
  });
};

export const useTodo = (id: string) => {
  return useQuery({
    queryKey: ['todo', id],
    queryFn: () => todosApi.getTodo(id),
    enabled: !!id,
  });
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTodoData) => todosApi.createTodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create todo');
    },
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoData }) =>
      todosApi.updateTodo(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo', variables.id] });
      toast.success('Todo updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update todo');
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => todosApi.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete todo');
    },
  });
};
```

---

### Phase 5: Testing (Week 4)

**backend/src/modules/todos/__tests__/todos.service.test.ts**:
```typescript
import { Types } from 'mongoose';
import { TodoService } from '../todos.service';
import { TodoRepository } from '../todos.repository';
import { AppError } from '@shared/errors/AppError';

// Mock the repository
jest.mock('../todos.repository');

describe('TodoService', () => {
  let service: TodoService;
  let mockRepository: jest.Mocked<TodoRepository>;

  beforeEach(() => {
    mockRepository = new TodoRepository() as jest.Mocked<TodoRepository>;
    service = new TodoService();
    (service as any).repository = mockRepository;
  });

  describe('createTodo', () => {
    it('should create a todo successfully', async () => {
      const userId = new Types.ObjectId();
      const data = {
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'high' as const,
      };

      const mockTodo = {
        _id: new Types.ObjectId(),
        ...data,
        userId,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockTodo as any);

      const result = await service.createTodo(userId, data);

      expect(mockRepository.create).toHaveBeenCalledWith(userId, data);
      expect(result).toEqual(mockTodo);
    });
  });

  describe('getTodoById', () => {
    it('should return a todo when found', async () => {
      const userId = new Types.ObjectId();
      const todoId = new Types.ObjectId();

      const mockTodo = {
        _id: todoId,
        title: 'Test Todo',
        userId,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByIdAndUserId.mockResolvedValue(mockTodo as any);

      const result = await service.getTodoById(todoId, userId);

      expect(mockRepository.findByIdAndUserId).toHaveBeenCalledWith(todoId, userId);
      expect(result).toEqual(mockTodo);
    });

    it('should throw AppError when todo not found', async () => {
      const userId = new Types.ObjectId();
      const todoId = new Types.ObjectId();

      mockRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.getTodoById(todoId, userId)).rejects.toThrow(AppError);
      await expect(service.getTodoById(todoId, userId)).rejects.toThrow('Todo not found');
    });
  });

  describe('updateTodo', () => {
    it('should update a todo successfully', async () => {
      const userId = new Types.ObjectId();
      const todoId = new Types.ObjectId();
      const updateData = { title: 'Updated Todo' };

      const mockUpdatedTodo = {
        _id: todoId,
        title: 'Updated Todo',
        userId,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.update.mockResolvedValue(mockUpdatedTodo as any);

      const result = await service.updateTodo(todoId, userId, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(todoId, userId, updateData);
      expect(result).toEqual(mockUpdatedTodo);
    });

    it('should throw AppError when todo not found', async () => {
      const userId = new Types.ObjectId();
      const todoId = new Types.ObjectId();

      mockRepository.update.mockResolvedValue(null);

      await expect(service.updateTodo(todoId, userId, {})).rejects.toThrow(AppError);
    });
  });

  describe('deleteTodo', () => {
    it('should delete a todo successfully', async () => {
      const userId = new Types.ObjectId();
      const todoId = new Types.ObjectId();

      mockRepository.delete.mockResolvedValue({} as any);

      const result = await service.deleteTodo(todoId, userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(todoId, userId);
      expect(result).toEqual({ message: 'Todo deleted successfully' });
    });
  });
});
```

---

## 📊 Migration Timeline

| Phase | Duration | Complexity | Priority |
|-------|----------|------------|----------|
| **Phase 1**: Setup Backend | 3-5 days | Low | HIGH |
| **Phase 2**: Extract Infrastructure | 5-7 days | Medium | HIGH |
| **Phase 3**: Build Modules | 10-14 days | High | HIGH |
| **Phase 4**: Frontend Client | 5-7 days | Medium | HIGH |
| **Phase 5**: Testing | 7-10 days | Medium | MEDIUM |
| **Phase 6**: Deployment | 3-5 days | Low | HIGH |

**Total Estimated Time**: 4-6 weeks (working part-time)

---

## 🎯 Success Criteria

### Technical Metrics:
- ✅ Backend runs independently on port 4000
- ✅ Frontend runs independently on port 3000
- ✅ All API endpoints return same data format
- ✅ Authentication works across services
- ✅ Real-time features (Socket.io) working
- ✅ 80%+ test coverage on backend
- ✅ Zero breaking changes for users

### Performance Metrics:
- ✅ Response times < 200ms (cached)
- ✅ Response times < 500ms (uncached)
- ✅ Can handle 100+ concurrent users
- ✅ Database queries optimized (indexes)

### Code Quality Metrics:
- ✅ TypeScript strict mode enabled
- ✅ ESLint/Prettier configured
- ✅ No console.errors in production
- ✅ Proper error handling everywhere
- ✅ JSDoc comments on public APIs

---

## 🚀 Deployment Strategy

### Development:
```bash
# Backend (Terminal 1)
cd backend
npm run dev  # Port 4000

# Frontend (Terminal 2)
cd frontend
npm run dev  # Port 3000
```

### Production (Railway/Vercel):

**Backend (Railway)**:
```json
{
  "build": {
    "command": "npm run build"
  },
  "start": {
    "command": "npm start"
  },
  "env": {
    "NODE_ENV": "production",
    "PORT": "4000"
  }
}
```

**Frontend (Vercel)**:
```json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-backend.railway.app"
  }
}
```

---

## 📚 Next Steps

After completing this migration:

1. **Add More Tests**
   - Unit tests for all services
   - Integration tests for API routes
   - E2E tests with Playwright

2. **Implement CI/CD**
   - GitHub Actions for automated testing
   - Automated deployments on merge

3. **Add Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring (New Relic)
   - Logging (Winston + CloudWatch)

4. **Consider Microservices**
   - Extract messaging into separate service
   - Extract feed/posts into separate service
   - Use API Gateway (Kong/NGINX)

---

**This migration sets you up for scalable, maintainable, production-ready architecture!** 🚀

Let me know when you're ready to start, and I'll help with each phase! 💪
