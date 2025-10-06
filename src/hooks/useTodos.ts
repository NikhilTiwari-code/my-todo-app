/**
 * React Query hooks for Todos API
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Todo,
  TodosListResponse,
  TodoResponse,
  CreateTodoInput,
  UpdateTodoInput,
  PatchTodoInput,
  TodosQueryParams,
} from "@/types/api.types";

/**
 * Query Keys
 */
export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (params: TodosQueryParams) => [...todoKeys.lists(), params] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
};

/**
 * Build query string from params
 */

function buildQueryString(params: TodosQueryParams): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Fetch all todos with pagination and filters
 */



export function useTodos(params: TodosQueryParams = {}) {
  return useQuery({
    queryKey: todoKeys.list(params),
    queryFn: async () => {
      const queryString = buildQueryString(params);
      return apiClient.get<TodosListResponse>(`/api/todos${queryString}`);
    },
  });
}

/**
 * Fetch single todo by ID
 */


export function useTodo(id: string, enabled = true) {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: async () => {
      return apiClient.get<TodoResponse>(`/api/todos/${id}`);
    },
    enabled: enabled && !!id, // Only fetch if enabled and id exists
  });
}

/**
 * Create a new todo
 */
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTodoInput) => {
      return apiClient.post<TodoResponse>("/api/todos", input);
    },
    onSuccess: () => {
      // Invalidate and refetch todos list
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

/**
 * Update todo (PUT - full replacement)
 */
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTodoInput }) => {
      return apiClient.put<TodoResponse>(`/api/todos/${id}`, data);
    },
    onSuccess: (response, variables) => {
      // Invalidate specific todo and lists
      queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

/**
 * Patch todo (PATCH - partial update)
 */
export function usePatchTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PatchTodoInput }) => {
      return apiClient.patch<TodoResponse>(`/api/todos/${id}`, data);
    },
    onSuccess: (response, variables) => {
      // Invalidate specific todo and lists
      queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

/**
 * Toggle todo completion (convenience wrapper for PATCH)
 */
export function useToggleTodo() {
  const patchMutation = usePatchTodo();

  return {
    ...patchMutation,
    toggleTodo: (id: string, isCompleted: boolean) => {
      return patchMutation.mutate({ id, data: { isCompleted } });
    },
  };
}

/**
 * Delete todo
 */
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/todos/${id}`);
    },
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: todoKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}
