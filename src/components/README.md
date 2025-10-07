# UI Components Documentation

This directory contains all reusable UI components for the Todo App.

## 📁 Component Structure

```
components/
├── ui/              # Base UI components (buttons, inputs, cards, etc.)
├── auth/            # Authentication-specific components
└── todos/           # Todo-specific components
```

## 🎨 UI Components (`/ui`)

### Button
Versatile button component with multiple variants and loading states.

**Props:**
- `variant`: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
- `size`: "default" | "sm" | "lg" | "icon"
- `isLoading`: boolean - Shows spinner when true

**Usage:**
```tsx
import { Button } from "@/components/ui/Button";

<Button variant="default" size="lg" isLoading={false}>
  Click me
</Button>
```

### Input
Text input with label and error support.

**Props:**
- `label`: string - Label text
- `error`: string - Error message to display
- All standard HTML input props

**Usage:**
```tsx
import { Input } from "@/components/ui/Input";

<Input
  label="Email"
  type="email"
  error={errors.email}
  placeholder="john@example.com"
/>
```

### Textarea
Multi-line text input with label and error support.

**Props:**
- `label`: string - Label text
- `error`: string - Error message
- All standard HTML textarea props

**Usage:**
```tsx
import { Textarea } from "@/components/ui/Textarea";

<Textarea
  label="Description"
  rows={4}
  error={errors.description}
/>
```

### Card
Container component for grouping related content.

**Components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

### Badge
Small label for tags, status, priority, etc.

**Props:**
- `variant`: "default" | "success" | "warning" | "danger" | "secondary"

**Usage:**
```tsx
import { Badge } from "@/components/ui/Badge";

<Badge variant="success">Completed</Badge>
<Badge variant="danger">High Priority</Badge>
```

### Select
Dropdown select with label and error support.

**Props:**
- `label`: string
- `error`: string
- `options`: Array<{ value: string; label: string }>

**Usage:**
```tsx
import { Select } from "@/components/ui/Select";

<Select
  label="Priority"
  options={[
    { value: "low", label: "Low" },
    { value: "high", label: "High" }
  ]}
/>
```

### Checkbox
Checkbox input with label.

**Props:**
- `label`: string
- `error`: string

**Usage:**
```tsx
import { Checkbox } from "@/components/ui/Checkbox";

<Checkbox label="Remember me" />
```

### Alert
Notification/message component.

**Props:**
- `variant`: "default" | "success" | "warning" | "error"

**Components:**
- `Alert` - Container
- `AlertTitle` - Title
- `AlertDescription` - Description

**Usage:**
```tsx
import { Alert, AlertDescription } from "@/components/ui/Alert";

<Alert variant="error">
  <AlertDescription>Something went wrong!</AlertDescription>
</Alert>
```

### Spinner
Loading spinner with size variants.

**Props:**
- `size`: "sm" | "default" | "lg"

**Usage:**
```tsx
import { Spinner } from "@/components/ui/Spinner";

<Spinner size="lg" />
```

### Skeleton
Loading placeholder component.

**Usage:**
```tsx
import { Skeleton } from "@/components/ui/Skeleton";

<Skeleton className="h-4 w-48" />
```

---

## 🔐 Auth Components (`/auth`)

### LoginForm
Complete login form with validation and error handling.

**Props:**
- `onSuccess`: () => void - Callback after successful login

**Usage:**
```tsx
import { LoginForm } from "@/components/auth";

<LoginForm onSuccess={() => router.push("/todos")} />
```

**Features:**
- Email & password validation
- Loading states
- Error messages
- Auto-navigation to todos page

### RegisterForm
Complete registration form with validation.

**Props:**
- `onSuccess`: () => void - Callback after successful registration

**Usage:**
```tsx
import { RegisterForm } from "@/components/auth";

<RegisterForm onSuccess={() => router.push("/todos")} />
```

**Features:**
- Name, email, password validation
- Password confirmation
- Loading states
- Error messages

### AuthCard
Wrapper component for auth pages (login/register).

**Props:**
- `title`: string
- `description`: string
- `children`: ReactNode

**Usage:**
```tsx
import { AuthCard } from "@/components/auth";

<AuthCard 
  title="Welcome Back" 
  description="Login to your account"
>
  <LoginForm />
</AuthCard>
```

---

## ✅ Todo Components (`/todos`)

### TodoForm
Form for creating new todos.

**Props:**
- `onSuccess`: () => void - Called after successful creation
- `onCancel`: () => void - Cancel button callback

**Usage:**
```tsx
import { TodoForm } from "@/components/todos";

<TodoForm 
  onSuccess={() => refetch()}
  onCancel={() => setShowForm(false)}
/>
```

**Features:**
- Title, description, priority, due date fields
- Client-side validation
- Loading states
- Error handling

### TodoItem
Single todo item display with actions.

**Props:**
- `todo`: Todo object
- `onToggle`: (id: string) => void
- `onDelete`: (id: string) => void
- `onEdit`: (todo: Todo) => void (optional)

**Usage:**
```tsx
import { TodoItem } from "@/components/todos";

<TodoItem
  todo={todo}
  onToggle={handleToggle}
  onDelete={handleDelete}
  onEdit={handleEdit}
/>
```

**Features:**
- Checkbox for completion toggle
- Priority badge
- Due date with overdue indicator
- Edit and delete buttons

### TodoFilters
Filter and search controls for todo list.

**Props:**
- `search`: string
- `priority`: string
- `isCompleted`: string
- `sortBy`: string
- `onSearchChange`: (value: string) => void
- `onPriorityChange`: (value: string) => void
- `onCompletedChange`: (value: string) => void
- `onSortChange`: (value: string) => void
- `onReset`: () => void

**Usage:**
```tsx
import { TodoFilters } from "@/components/todos";

<TodoFilters
  search={search}
  priority={priority}
  isCompleted={isCompleted}
  sortBy={sortBy}
  onSearchChange={setSearch}
  onPriorityChange={setPriority}
  onCompletedChange={setIsCompleted}
  onSortChange={setSortBy}
  onReset={resetFilters}
/>
```

### Pagination
Pagination controls with page numbers.

**Props:**
- `currentPage`: number
- `totalPages`: number
- `hasMore`: boolean
- `onPageChange`: (page: number) => void
- `isLoading`: boolean

**Usage:**
```tsx
import { Pagination } from "@/components/todos";

<Pagination
  currentPage={page}
  totalPages={totalPages}
  hasMore={hasMore}
  onPageChange={setPage}
  isLoading={isLoading}
/>
```

### TodoSkeleton
Loading skeleton for todo list.

**Props:**
- `count`: number - Number of skeleton items (default: 3)

**Usage:**
```tsx
import { TodoSkeleton } from "@/components/todos";

{isLoading && <TodoSkeleton count={5} />}
```

### EmptyState
Empty state display when no todos exist.

**Props:**
- `message`: string
- `description`: string

**Usage:**
```tsx
import { EmptyState } from "@/components/todos";

{todos.length === 0 && (
  <EmptyState
    message="No todos found"
    description="Try adjusting your filters"
  />
)}
```

---

## 🎯 Design System

### Colors
- **Primary**: Blue - Actions, links, focus states
- **Success**: Green - Completed, success messages
- **Warning**: Yellow - Medium priority, warnings
- **Danger**: Red - High priority, errors, delete actions
- **Secondary**: Gray - Low priority, secondary actions

### Typography
- **Headings**: Semibold, tracking-tight
- **Body**: Regular, comfortable line-height
- **Labels**: Medium weight, smaller size

### Spacing
- Consistent padding: p-4, p-6
- Gap spacing: gap-2, gap-4
- Form spacing: space-y-4

### Dark Mode
All components support dark mode automatically using Tailwind's `dark:` variants.

---

## 🚀 Quick Start

### Basic Page Example

```tsx
"use client";

import { AuthCard, LoginForm } from "@/components/auth";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome Back"
      description="Login to your account"
    >
      <LoginForm />
    </AuthCard>
  );
}
```

### Todo List Page Example

```tsx
"use client";

import { useState } from "react";
import { 
  TodoForm, 
  TodoItem, 
  TodoFilters, 
  Pagination,
  TodoSkeleton,
  EmptyState 
} from "@/components/todos";

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-6">
      <TodoForm onSuccess={() => fetchTodos()} />
      <TodoFilters {...filterProps} />
      
      {isLoading ? (
        <TodoSkeleton count={5} />
      ) : todos.length === 0 ? (
        <EmptyState />
      ) : (
        todos.map(todo => (
          <TodoItem
            key={todo._id}
            todo={todo}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))
      )}
      
      <Pagination {...paginationProps} />
    </div>
  );
}
```

---

## 📦 Dependencies

- **clsx**: Conditional class names
- **tailwind-merge**: Merge Tailwind classes without conflicts
- **Tailwind CSS**: Utility-first CSS framework

---

## 🛠 Customization

All components use Tailwind classes and can be customized:

1. **Via className prop**: Add/override styles
2. **Via globals.css**: Customize theme colors
3. **Via Tailwind config**: Extend design tokens

---

## 🎨 Accessibility

All components follow accessibility best practices:
- Proper ARIA labels
- Keyboard navigation
- Focus states
- Screen reader support
- Color contrast compliance

---

## 📝 Notes

- All form components auto-generate IDs from labels
- Error states automatically update styling
- Loading states disable interaction
- Dark mode uses system preference by default
