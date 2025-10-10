"use client";

import { useState } from "react";
import { useTodos, useDeleteTodo, useToggleTodo } from "@/hooks/useTodos";
import type { TodosQueryParams } from "@/types/api.types";

export default function TodoList() {
  const [params, setParams] = useState<TodosQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    order: "desc",
  });

  // Fetch todos with React Query
  const { data, isLoading, isError, error } = useTodos(params);
  const deleteMutation = useDeleteTodo();
  const { toggleTodo } = useToggleTodo();

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this todo?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle toggle completion
  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleTodo(id, !currentStatus);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading todos...</div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">
          Error: {error?.message || "Failed to fetch todos"}
        </div>
      </div>
    );
  }

  const todos = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={params.isCompleted?.toString() || "all"}
          onChange={(e) => {
            const value = e.target.value;
            setParams({
              ...params,
              isCompleted: value === "all" ? undefined : value === "true",
              page: 1,
            });
          }}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All Todos</option>
          <option value="false">Active</option>
          <option value="true">Completed</option>
        </select>

        <select
          value={params.priority || "all"}
          onChange={(e) => {
            const value = e.target.value;
            setParams({
              ...params,
              priority: value === "all" ? undefined : (value as "low" | "medium" | "high"),
              page: 1,
            });
          }}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={params.q || ""}
          onChange={(e) => {
            setParams({
              ...params,
              q: e.target.value || undefined,
              page: 1,
            });
          }}
          className="px-4 py-2 border rounded-md flex-1 min-w-[200px]"
        />
      </div>

      {/* Todo List */}
      {todos.length === 0 ? (
        <div className="text-center p-8 text-gray-500">No todos found</div>
      ) : (
        <div className="space-y-4">
          {todos.map((todo) => (
            <div
              key={todo._id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={todo.isCompleted}
                  onChange={() => handleToggle(todo._id, todo.isCompleted)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h3
                    className={`text-lg font-semibold ${
                      todo.isCompleted ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {todo.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{todo.description}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span
                      className={`px-2 py-1 rounded ${
                        todo.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : todo.priority === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {todo.priority}
                    </span>
                    {todo.dueDate && (
                      <span>Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(todo._id)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {todos.length} of {pagination.total} todos
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setParams({ ...params, page: params.page! - 1 })}
              disabled={params.page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setParams({ ...params, page: params.page! + 1 })}
              disabled={!pagination.hasMore}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
