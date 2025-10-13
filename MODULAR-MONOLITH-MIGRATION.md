# 🏗️ Modular Monolith Migration Guide

## Phase 1: Setup Module Structure (Day 1)

### Step 1: Create Module Directories

```powershell
# Create auth module structure
New-Item -ItemType Directory -Force -Path src/modules/auth/{api,components,pages,context,hooks,services,models,types,validations}

# Create todos module structure
New-Item -ItemType Directory -Force -Path src/modules/todos/{api,components,pages,hooks,services,models,types,validations}

# Create shared directory
New-Item -ItemType Directory -Force -Path src/shared/{components/ui,lib,middleware,types,constants}
```

### Step 2: Update tsconfig.json

Add path mappings for clean imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/modules/*": ["./src/modules/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/modules/auth": ["./src/modules/auth"],
      "@/modules/todos": ["./src/modules/todos"]
    }
  }
}
```

---

## Phase 2: Migrate Shared Code (Day 2)

### Move Shared Components
```powershell
# Move UI components
Move-Item src/components/ui/* src/shared/components/ui/

# Move shared utilities
Move-Item src/lib/* src/shared/lib/
Move-Item src/middleware/* src/shared/middleware/
Move-Item src/types/api.types.ts src/shared/types/
Move-Item src/utils/* src/shared/lib/
```

---

## Phase 3: Migrate Auth Module (Day 3-4)

### Move Auth Components
```powershell
Move-Item src/components/auth/* src/modules/auth/components/
Move-Item src/contexts/AuthContext.tsx src/modules/auth/context/
Move-Item src/hooks/useEmailCheck.ts src/modules/auth/hooks/
```

### Move Auth API Routes
```powershell
Move-Item src/app/api/auth/* src/modules/auth/api/
```

### Move Auth Pages
```powershell
# Copy pages (keep originals for now)
Copy-Item src/app/(auth)/login/page.tsx src/modules/auth/pages/login.tsx
Copy-Item src/app/(auth)/register/page.tsx src/modules/auth/pages/register.tsx
Copy-Item src/app/(auth)/me/page.tsx src/modules/auth/pages/me.tsx
```

### Create Auth Service Layer
Create `src/modules/auth/services/auth.service.ts`

### Create Auth Public API
Create `src/modules/auth/index.ts` to export public interfaces

---

## Phase 4: Migrate Todos Module (Day 5-6)

### Move Todo Components
```powershell
Move-Item src/components/todos/* src/modules/todos/components/
Move-Item src/hooks/useTodos.ts src/modules/todos/hooks/
```

### Move Todo API Routes
```powershell
Move-Item src/app/api/todos/* src/modules/todos/api/
```

### Move Todo Pages
```powershell
Copy-Item src/app/(dashboard)/todos/page.tsx src/modules/todos/pages/todos.tsx
```

### Create Todo Service Layer
Create `src/modules/todos/services/todo.service.ts`

### Create Todo Public API
Create `src/modules/todos/index.ts`

---

## Phase 5: Update Imports (Day 7)

### Find and Replace All Imports

```powershell
# Example: Update component imports
# From: import { Button } from "@/components/ui/Button"
# To:   import { Button } from "@/shared/components/ui/Button"

# From: import { LoginForm } from "@/components/auth/LoginForm"
# To:   import { LoginForm } from "@/modules/auth"
```

---

## Phase 6: Create Module Boundaries (Day 8)

### Module Communication Rules

1. **Modules CANNOT directly import from each other**
2. **Modules communicate via:**
   - Public APIs (index.ts exports)
   - Events/Messages (future enhancement)
   - Shared contracts (types)

### Example Module Index (Public API)

**`src/modules/auth/index.ts`**
```typescript
// Public API - What other modules can use
export { AuthProvider, useAuth } from './context/AuthContext';
export { AuthGuard } from './components/AuthGuard';
export type { User } from './types/user.types';
export { getUserIdFromRequest } from './services/auth.service';
```

**`src/modules/todos/index.ts`**
```typescript
// Public API
export { TodoForm } from './components/TodoForm';
export { TodoList } from './components/TodoList';
export { useTodos } from './hooks/useTodos';
export type { Todo, CreateTodoInput } from './types/todo.types';
```

---

## Phase 7: Enforce Boundaries with ESLint (Day 9)

### Install boundary-eslint plugin

```powershell
npm install --save-dev eslint-plugin-boundaries
```

### Update eslint.config.mjs

```javascript
import boundaries from 'eslint-plugin-boundaries';

export default [
  {
    plugins: { boundaries },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'modules/auth',
              disallow: ['modules/todos', 'modules/profile'],
              message: 'Auth module cannot import from other modules'
            },
            {
              from: 'modules/todos',
              disallow: ['modules/auth', 'modules/profile'],
              message: 'Todos module cannot import from other modules'
            },
            {
              from: 'modules/*',
              allow: ['shared/*'],
              message: 'Modules can only import from shared'
            }
          ]
        }
      ]
    }
  }
];
```

---

## Phase 8: Testing & Cleanup (Day 10)

### Test Each Module in Isolation
```powershell
# Test auth module
npm test -- src/modules/auth

# Test todos module
npm test -- src/modules/todos
```

### Clean Up Old Structure
```powershell
# Remove old directories (after migration is complete)
Remove-Item -Recurse src/components/auth
Remove-Item -Recurse src/components/todos
Remove-Item -Recurse src/contexts
```

---

## Benefits After Migration

✅ **Clear Boundaries** - Each module is self-contained  
✅ **Easy Testing** - Test modules in isolation  
✅ **Parallel Development** - Teams work on different modules  
✅ **Feature Organization** - All related code in one place  
✅ **Easier to Extract** - Can become microservices later  
✅ **Better Code Review** - Changes isolated to one module  
✅ **Reduced Conflicts** - Less merge conflicts  
✅ **Clearer Ownership** - Teams own specific modules  

---

## Module Communication Patterns

### ❌ BAD (Direct Module Import)
```typescript
// In todos module - DON'T DO THIS
import { getUserIdFromRequest } from '../../auth/services/auth.service';
```

### ✅ GOOD (Via Public API)
```typescript
// In todos module
import { getUserIdFromRequest } from '@/modules/auth';
```

### ✅ GOOD (Via Shared)
```typescript
// In shared/lib/auth-utils.ts
export { getUserIdFromRequest } from '@/modules/auth';

// In todos module
import { getUserIdFromRequest } from '@/shared/lib/auth-utils';
```

---

## Next Steps

1. Start with Phase 1 (setup structure)
2. Migrate one module at a time
3. Test thoroughly after each phase
4. Update documentation
5. Train team on new structure

---

## Future Enhancements

- **Event Bus** - Modules communicate via events
- **Feature Flags** - Toggle modules on/off
- **Module Versioning** - Version individual modules
- **Lazy Loading** - Load modules on demand
- **Extract to Microservices** - When needed, modules can become separate services
