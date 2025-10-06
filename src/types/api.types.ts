/**
 * API Response Types
 */

export interface Todo {
  _id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  owner: string;
  priority: "low" | "medium" | "high";
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodosListResponse {
  data: Todo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface TodoResponse {
  todo: Todo;
  message?: string;
}

export interface CreateTodoInput {
  title: string;
  description: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
}

export interface UpdateTodoInput {
  title: string;
  description: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
}

export interface PatchTodoInput {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
  isCompleted?: boolean;
}

export interface TodosQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  isCompleted?: boolean;
  priority?: "low" | "medium" | "high";
  sortBy?: "createdAt" | "dueDate" | "title";
  order?: "asc" | "desc";
}

export interface ApiError {
  status: number;
  message: string;
  code: string;
}
