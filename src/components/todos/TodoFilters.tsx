"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface TodoFiltersProps {
  search: string;
  priority: string;
  isCompleted: string;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCompletedChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onReset: () => void;
}

const priorityOptions = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const completedOptions = [
  { value: "all", label: "All Todos" },
  { value: "false", label: "Active" },
  { value: "true", label: "Completed" },
];

const sortOptions = [
  { value: "createdAt", label: "Created Date" },
  { value: "dueDate", label: "Due Date" },
  { value: "title", label: "Title" },
];

export default function TodoFilters({
  search,
  priority,
  isCompleted,
  sortBy,
  onSearchChange,
  onPriorityChange,
  onCompletedChange,
  onSortChange,
  onReset,
}: TodoFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActiveFilters = search || priority !== "all" || isCompleted !== "all" || sortBy !== "createdAt";

  const handleReset = () => {
    onReset();
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
              {[search, priority !== "all", isCompleted !== "all", sortBy !== "createdAt"].filter(Boolean).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Clear All
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          placeholder="Search todos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <Select
          options={priorityOptions}
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
        />

        <Select
          options={completedOptions}
          value={isCompleted}
          onChange={(e) => onCompletedChange(e.target.value)}
        />

        <Select
          options={sortOptions}
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        />
      </div>
    </div>
  );
}
