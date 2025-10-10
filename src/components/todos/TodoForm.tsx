"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert, AlertDescription } from "@/components/ui/Alert";

interface TodoFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function TodoForm({ onSuccess, onCancel }: TodoFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    dueDate?: string;
  }>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const now = new Date();
      if (dueDate <= now) {
        newErrors.dueDate = "Due date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send cookies automatically
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          dueDate: formData.dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to create todo");
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
      });

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <Alert variant="error">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Input
        label="Title"
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="Buy groceries"
        disabled={isLoading}
      />

      <Textarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        error={errors.description}
        placeholder="Need to buy milk, bread, and eggs from the store"
        rows={4}
        disabled={isLoading}
      />

      <Select
        label="Priority"
        name="priority"
        value={formData.priority}
        onChange={handleChange}
        options={priorityOptions}
        disabled={isLoading}
      />

      <Input
        label="Due Date (optional)"
        type="datetime-local"
        name="dueDate"
        value={formData.dueDate}
        onChange={handleChange}
        error={errors.dueDate}
        disabled={isLoading}
      />

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          {isLoading ? "Creating..." : "Create Todo"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
