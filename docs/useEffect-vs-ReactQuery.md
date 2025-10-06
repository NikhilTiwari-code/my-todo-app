## 📊 useEffect vs React Query - Complete Comparison

### ❌ Old Way: useEffect

```tsx
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const fetchTodos = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        const response = await fetch(`/api/todos?page=${page}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const data = await response.json();
        
        if (!cancelled) {
          setTodos(data.data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchTodos();

    return () => {
      cancelled = true;
    };
  }, [page]); // Re-runs every time page changes

  // Manual refetch function
  const refetch = () => {
    setLoading(true);
    // ... repeat fetch logic
  };

  // Create todo
  const createTodo = async (data) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create');
      }

      // Manually refetch to update list
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete todo
  const deleteTodo = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Manually update state
      setTodos(todos.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {todos.map(todo => (
        <div key={todo._id}>
          <h3>{todo.title}</h3>
          <button onClick={() => deleteTodo(todo._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

**Problems:**
- ❌ 50+ lines of boilerplate
- ❌ Manual loading/error states
- ❌ Manual cleanup with `cancelled` flag
- ❌ No caching (refetches on every mount)
- ❌ Manual refetch after mutations
- ❌ Duplicate auth code in every request
- ❌ Complex dependency array
- ❌ Race conditions possible
- ❌ No automatic retry
- ❌ Manual optimistic updates

---

### ✅ New Way: React Query

```tsx
import { useTodos, useDeleteTodo } from "@/hooks/useTodos";

function TodoList() {
  const [page, setPage] = useState(1);
  
  // Fetch todos
  const { data, isLoading, isError, error } = useTodos({ page });
  
  // Delete mutation
  const deleteMutation = useDeleteTodo();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.data.map(todo => (
        <div key={todo._id}>
          <h3>{todo.title}</h3>
          <button onClick={() => deleteMutation.mutate(todo._id)}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Benefits:**
- ✅ 20 lines (60% less code)
- ✅ Automatic loading/error states
- ✅ Auto cleanup on unmount
- ✅ Smart caching (no refetch on remount)
- ✅ Auto refetch after mutations
- ✅ Auth handled in api-client
- ✅ No dependency array needed
- ✅ Race condition prevention built-in
- ✅ Automatic retry on failure
- ✅ Built-in optimistic updates

---

## 🎯 Side-by-Side Feature Comparison

| Feature | useEffect | React Query |
|---------|-----------|-------------|
| **Loading state** | Manual `useState` | Auto `isLoading` |
| **Error handling** | Manual `try/catch` + `useState` | Auto `isError`, `error` |
| **Caching** | None (always refetch) | Smart cache (5min default) |
| **Refetch after mutation** | Manual `refetch()` | Auto `invalidateQueries()` |
| **Auth headers** | Repeat in every fetch | Centralized in API client |
| **Race conditions** | Manual cleanup flag | Automatic |
| **Request deduplication** | None | Automatic |
| **Retry on failure** | Manual | Automatic (configurable) |
| **Cancel on unmount** | Manual cleanup | Automatic |
| **DevTools** | None | Built-in query inspector |
| **Background refetch** | Manual `setInterval` | Auto on window focus |
| **Pagination** | Complex state management | Built-in with query keys |
| **Optimistic updates** | Manual state manipulation | Built-in `onMutate` |
| **Code size** | 50-100 lines | 10-20 lines |

---

## 📈 Performance Comparison

### useEffect:
```
Component Mount → Fetch (500ms) → Display
Component Unmount
Component Mount → Fetch AGAIN (500ms) → Display
                  ↑ Unnecessary network call
```

### React Query:
```
Component Mount → Fetch (500ms) → Cache → Display
Component Unmount
Component Mount → Read from Cache (0ms) → Display
                  ↑ No network call!
```

---

## 🔄 Mutation Comparison

### useEffect:
```tsx
const [creating, setCreating] = useState(false);
const [createError, setCreateError] = useState(null);

const createTodo = async (data) => {
  try {
    setCreating(true);
    setCreateError(null);
    
    const token = localStorage.getItem("token");
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to create');
    }

    const result = await response.json();
    
    // Manually update todos list
    setTodos([result.todo, ...todos]);
    setCreating(false);
  } catch (err) {
    setCreateError(err.message);
    setCreating(false);
  }
};
```

### React Query:
```tsx
const createMutation = useCreateTodo();

createMutation.mutate({ title: "New Todo", description: "Details" });

// Access state:
createMutation.isPending  // true while creating
createMutation.isSuccess  // true when done
createMutation.isError    // true on error
createMutation.error      // error object
```

Auto refetch happens on success! ✨

---

## 💡 Real-World Benefits

### 1. **Less Code to Maintain**
- useEffect: ~200 lines for full CRUD
- React Query: ~50 lines for full CRUD
- **75% reduction in code**

### 2. **Better User Experience**
- Instant navigation (cached data)
- Automatic background updates
- Loading indicators without effort
- Error handling without try/catch everywhere

### 3. **Fewer Bugs**
- No race conditions
- No memory leaks
- No stale closures
- Automatic cleanup

### 4. **Developer Experience**
- DevTools to inspect cache
- TypeScript autocomplete
- Less boilerplate
- Predictable patterns

---

## 🚀 When to Use What?

### Use React Query for:
- ✅ API data fetching
- ✅ Server state management
- ✅ Pagination
- ✅ Infinite scroll
- ✅ Real-time updates
- ✅ Complex caching needs

### Use useEffect for:
- ✅ DOM manipulation
- ✅ Event listeners
- ✅ Non-data side effects
- ✅ Analytics tracking
- ✅ Local state sync

---

## 📊 Bundle Size

| Library | Size (gzipped) | Features |
|---------|----------------|----------|
| Manual useEffect | 0 KB | Basic fetch only |
| React Query | ~13 KB | Full data sync solution |
| Redux + RTK Query | ~38 KB | Similar features |
| Apollo Client | ~33 KB | GraphQL focused |

React Query gives you the most features per KB! 🎯
