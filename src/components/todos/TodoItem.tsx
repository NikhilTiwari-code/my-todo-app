"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { formatDate } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  _id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (todo: Todo) => void;
}

const priorityVariants = {
  low: "secondary" as const,
  medium: "warning" as const,
  high: "danger" as const,
};

export default function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.isCompleted;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandToggle = () => setIsExpanded((prev) => !prev);

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete(todo._id);
  };

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEdit?.(todo);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        isExpanded
          ? "border-blue-200 dark:border-blue-500"
          : "hover:border-blue-200 dark:hover:border-blue-500/70",
        todo.isCompleted && "opacity-70"
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col">
          <div
            className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-900/50"
            onClick={handleExpandToggle}
            role="button"
            aria-expanded={isExpanded}
          >
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={todo.isCompleted}
                onChange={() => onToggle(todo._id)}
                className="h-5 w-5"
              />
            </div>

            <h3
              className={cn(
                "flex-1 min-w-0 text-base font-semibold text-left",
                todo.isCompleted
                  ? "line-through text-gray-500 dark:text-gray-400"
                  : "text-gray-900 dark:text-gray-100"
              )}
            >
              {todo.title}
            </h3>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExpandToggle();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              aria-label={isExpanded ? "Collapse todo" : "Expand todo"}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
          </div>

          {isExpanded && (
            <div className="px-12 pb-4 pt-0 space-y-4 bg-gray-50/60 dark:bg-gray-900/50">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={priorityVariants[todo.priority]}>
                  {todo.priority}
                </Badge>
                <Badge variant={todo.isCompleted ? "success" : "secondary"}>
                  {todo.isCompleted ? "Completed" : "Pending"}
                </Badge>
                {isOverdue && <Badge variant="danger">Overdue</Badge>}
              </div>

              <p
                className={cn(
                  "text-sm leading-relaxed",
                  todo.isCompleted
                    ? "text-gray-400 dark:text-gray-500"
                    : "text-gray-600 dark:text-gray-300"
                )}
              >
                {todo.description || "No description provided."}
              </p>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>Created: {formatDate(todo.createdAt)}</span>
                <span>
                  Status: {todo.isCompleted ? "Completed" : "In progress"}
                </span>
                {todo.dueDate && (
                  <span className={isOverdue ? "text-red-600 dark:text-red-400" : ""}>
                    {isOverdue ? "Overdue since" : "Due"}: {formatDate(todo.dueDate)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    disabled={todo.isCompleted}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
