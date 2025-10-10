"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  TodoForm, 
  TodoItem, 
  TodoFilters, 
  Pagination,
  TodoSkeleton,
  EmptyState 
} from "@/components/todos";
import { Button } from "@/components/ui/Button";
import { Alert, AlertDescription } from "@/components/ui/Alert";

interface Todo {
  _id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function TodosPage() {
  // State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  
  // Filter state
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [isCompleted, setIsCompleted] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Fetch todos
  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // Build query params
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        order: "desc",
      });

      if (search) params.append("q", search);
      if (priority !== "all") params.append("priority", priority);
      if (isCompleted !== "all") params.append("isCompleted", isCompleted);

      const response = await fetch(`/api/todos?${params}`, {
        credentials: "include", // Send cookies automatically
      });

      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }

      const data = await response.json();
      setTodos(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch todos");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, priority, isCompleted, sortBy]);

  // Toggle todo completion
  const handleToggle = async (id: string) => {
    try {
      const todo = todos.find((t) => t._id === id);
      
      if (!todo) return;

      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send cookies automatically
        body: JSON.stringify({ isCompleted: !todo.isCompleted }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle todo");
      }

      // Update local state
      setTodos((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, isCompleted: !t.isCompleted } : t
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle todo");
    }
  };

  // Delete todo
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
        credentials: "include", // Send cookies automatically
      });

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }

      // Remove from local state
      setTodos((prev) => prev.filter((t) => t._id !== id));
      
      // Update pagination
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setPriority("all");
    setIsCompleted("all");
    setSortBy("createdAt");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Todos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your tasks efficiently
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Todo"}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Create New Todo
          </h2>
          <TodoForm
            onSuccess={() => {
              setShowForm(false);
              fetchTodos();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Filters */}
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

      {/* Stats */}
      {!isLoading && (
        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Total: {pagination.total}</span>
          <span>•</span>
          <span>
            Active: {todos.filter((t) => !t.isCompleted).length}
          </span>
          <span>•</span>
          <span>
            Completed: {todos.filter((t) => t.isCompleted).length}
          </span>
        </div>
      )}

      {/* Todo List */}
      {isLoading ? (
        <TodoSkeleton count={5} />
      ) : todos.length === 0 ? (
        <EmptyState
          message={search || priority !== "all" || isCompleted !== "all" 
            ? "No todos found" 
            : "No todos yet"}
          description={
            search || priority !== "all" || isCompleted !== "all"
              ? "Try adjusting your filters"
              : "Create your first todo to get started!"
          }
        />
      ) : (
        <div className="space-y-4">
          {todos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && todos.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasMore={pagination.hasMore}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
