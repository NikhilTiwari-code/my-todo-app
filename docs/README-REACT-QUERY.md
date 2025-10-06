# React Query Setup for Todos API

## 📁 Project Structure

```
src/
├── lib/
│   ├── react-query-provider.tsx    # React Query provider with devtools
│   └── api-client.ts               # API client with auth handling
├── hooks/
│   └── useTodos.ts                 # All React Query hooks for todos
├── types/
│   └── api.types.ts                # TypeScript types for API
├── components/
│   └── todos/
│       ├── todo-list.tsx           # Displays todos with filters
│       └── create-todo-form.tsx    # Form to create new todos
└── app/
    ├── layout.tsx                  # Wrapped with ReactQueryProvider
    └── todos/
        └── page.tsx                # Main todos page
```

## 🚀 Usage Examples

### 1. Fetch Todos with Filters

```tsx
import { useTodos } from "@/hooks/useTodos";

function MyComponent() {
  const { data, isLoading, isError, error } = useTodos({
    page: 1,
    limit: 10,
    isCompleted: false,
    priority: "high",
    sortBy: "dueDate",
    order: "asc",
    q: "urgent",
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.data.map((todo) => (
        <div key={todo._id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

### 2. Create Todo

```tsx
import { useCreateTodo } from "@/hooks/useTodos";

function CreateTodoButton() {
  const createMutation = useCreateTodo();

  const handleCreate = () => {
    createMutation.mutate({
      title: "New Task",
      description: "Task details",
      priority: "high",
      dueDate: "2025-12-31T23:59:59.000Z",
    });
  };

  return (
    <button onClick={handleCreate} disabled={createMutation.isPending}>
      {createMutation.isPending ? "Creating..." : "Create Todo"}
    </button>
  );
}
```

### 3. Update Todo (Full Replacement)

```tsx
import { useUpdateTodo } from "@/hooks/useTodos";

function UpdateTodoButton({ todoId }: { todoId: string }) {
  const updateMutation = useUpdateTodo();

  const handleUpdate = () => {
    updateMutation.mutate({
      id: todoId,
      data: {
        title: "Updated Title",
        description: "Updated Description",
        priority: "medium",
        dueDate: null,
      },
    });
  };

  return <button onClick={handleUpdate}>Update</button>;
}
```

### 4. Patch Todo (Partial Update)

```tsx
import { usePatchTodo } from "@/hooks/useTodos";

function ToggleCompletionButton({ todoId, isCompleted }: { todoId: string; isCompleted: boolean }) {
  const patchMutation = usePatchTodo();

  const handleToggle = () => {
    patchMutation.mutate({
      id: todoId,
      data: { isCompleted: !isCompleted },
    });
  };

  return <button onClick={handleToggle}>Toggle</button>;
}
```

### 5. Delete Todo

```tsx
import { useDeleteTodo } from "@/hooks/useTodos";

function DeleteTodoButton({ todoId }: { todoId: string }) {
  const deleteMutation = useDeleteTodo();

  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      deleteMutation.mutate(todoId);
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### 6. Toggle Todo Helper

```tsx
import { useToggleTodo } from "@/hooks/useTodos";

function QuickToggle({ todoId, isCompleted }: { todoId: string; isCompleted: boolean }) {
  const { toggleTodo } = useToggleTodo();

  return (
    <input
      type="checkbox"
      checked={isCompleted}
      onChange={() => toggleTodo(todoId, !isCompleted)}
    />
  );
}
```

## 🎯 Key Features

### 1. **Automatic Caching**
- React Query caches data automatically
- Configurable stale time (5 minutes) and garbage collection (10 minutes)
- No need for manual cache management

### 2. **Optimistic Updates**
- Mutations automatically invalidate related queries
- UI updates instantly after mutations
- Background refetch ensures data consistency

### 3. **Query Invalidation Strategy**
```typescript
// After creating a todo:
queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
// ✅ Refetches all todo lists

// After updating a todo:
queryClient.invalidateQueries({ queryKey: todoKeys.detail(id) });
queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
// ✅ Refetches specific todo and all lists
```

### 4. **Type Safety**
- Full TypeScript support
- API response types defined in `api.types.ts`
- Autocomplete for all query params and mutations

### 5. **Error Handling**
```tsx
const { data, isError, error } = useTodos();

if (isError) {
  console.log(error.status);   // 400, 401, 404, 500, etc.
  console.log(error.message);  // "Title is required"
  console.log(error.code);     // "VALIDATION_ERROR"
}
```

### 6. **Loading States**
```tsx
const { isLoading, isFetching } = useTodos();
// isLoading: true only on first load
// isFetching: true on any background refetch

const createMutation = useCreateTodo();
// createMutation.isPending: true while creating
// createMutation.isSuccess: true after success
// createMutation.isError: true on error
```

## 🔑 Authentication

Store token in localStorage after login:

```tsx
// After successful login
const response = await fetch("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
const { token } = await response.json();
localStorage.setItem("token", token);
```

The API client automatically adds the token to all requests:

```typescript
// In api-client.ts
private getToken(): string | null {
  return localStorage.getItem("token");
}

// Automatically added to headers
headers["Authorization"] = `Bearer ${token}`;
```

## 🛠️ React Query DevTools

In development mode, you'll see the React Query DevTools in the bottom-right corner:
- View all queries and their states
- Manually refetch queries
- Inspect cache data
- Debug query/mutation states

## 📊 Query Keys Structure

```typescript
todoKeys = {
  all: ["todos"],                              // Base key
  lists: ["todos", "list"],                    // All lists
  list: ["todos", "list", { page: 1, ... }],   // Specific list
  details: ["todos", "detail"],                // All details
  detail: ["todos", "detail", "todo_id"],      // Specific todo
}
```

## 🎨 Example: Complete Todo Component

```tsx
"use client";

import { useTodos, useCreateTodo, useDeleteTodo } from "@/hooks/useTodos";
import { useState } from "react";

export default function TodoApp() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Queries
  const { data, isLoading } = useTodos({ page: 1, limit: 10 });

  // Mutations
  const createMutation = useCreateTodo();
  const deleteMutation = useDeleteTodo();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ title, description });
    setTitle("");
    setDescription("");
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <form onSubmit={handleCreate}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        <button disabled={createMutation.isPending}>Create</button>
      </form>

      {data?.data.map((todo) => (
        <div key={todo._id}>
          <h3>{todo.title}</h3>
          <p>{todo.description}</p>
          <button onClick={() => deleteMutation.mutate(todo._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## 🚀 Getting Started

1. Visit `/todos` page to see the complete implementation
2. Create, update, toggle, and delete todos
3. Use filters to search and filter todos
4. Open React Query DevTools to inspect cache

## 📝 Environment Variables

Add to `.env.local`:

```bash
# Optional: if API is on different domain
NEXT_PUBLIC_API_URL=http://localhost:3000
```

If not set, API client uses relative URLs (same domain).
