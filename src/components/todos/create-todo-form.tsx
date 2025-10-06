"use client";

import { useState } from "react";
import { useCreateTodo } from "@/hooks/useTodos";
import type { CreateTodoInput } from "@/types/api.types";

export default function CreateTodoForm() {
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: "",
    description: "",
    priority: "low",
    dueDate: null,
  });

  const createMutation = useCreateTodo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync(formData);
      // Reset form on success
      setFormData({
        title: "",
        description: "",
        priority: "low",
        dueDate: null,
      });
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg">
      <h2 className="text-2xl font-bold">Create New Todo</h2>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full px-4 py-2 border rounded-md"
          placeholder="Enter todo title"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          className="w-full px-4 py-2 border rounded-md h-24"
          placeholder="Enter todo description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            Priority
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) =>
              setFormData({
                ...formData,
                priority: e.target.value as "low" | "medium" | "high",
              })
            }
            className="w-full px-4 py-2 border rounded-md"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
            Due Date
          </label>
          <input
            id="dueDate"
            type="datetime-local"
            value={formData.dueDate || ""}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value || null })
            }
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>
      </div>

      {createMutation.isError && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {createMutation.error?.message || "Failed to create todo"}
        </div>
      )}

      {createMutation.isSuccess && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md">
          Todo created successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {createMutation.isPending ? "Creating..." : "Create Todo"}
      </button>
    </form>
  );
}
