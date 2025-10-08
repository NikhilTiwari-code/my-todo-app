/**
 * Zod Validation Schemas
 * 
 * Type-safe request validation schemas for all API endpoints.
 * Benefits:
 * - Runtime type checking
 * - Automatic TypeScript type inference
 * - Clear error messages
 * - DRY (Don't Repeat Yourself) validation logic
 */

import { z } from "zod";

// ==========================================
// AUTH SCHEMAS
// ==========================================

/**
 * User registration schema
 * 
 * Requirements:
 * - Name: 2-50 characters
 * - Email: Valid email format, lowercase
 * - Password: Min 6 characters
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .trim(),
  
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * User login schema
 * 
 * Requirements:
 * - Email: Valid email format, lowercase
 * - Password: Required string
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ==========================================
// TODO SCHEMAS
// ==========================================

/**
 * Priority enum for todos
 */
export const priorityEnum = z.enum(["low", "medium", "high"], {
  message: "Priority must be one of: low, medium, high",
});

/**
 * Create todo schema
 * 
 * Requirements:
 * - Title: 1-200 characters, required
 * - Description: 1-2000 characters, required
 * - Priority: low|medium|high, optional (default: low)
 * - DueDate: Future date, optional
 */
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must not exceed 200 characters")
    .trim(),
  
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must not exceed 2000 characters")
    .trim(),
  
  priority: priorityEnum.optional(),
  
  dueDate: z
    .string()
    .datetime("Invalid date format")
    .refine(
      (date) => new Date(date) > new Date(),
      "Due date must be in the future"
    )
    .optional()
    .nullable(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

/**
 * Update todo schema (PUT - full replacement)
 * Same as create but all fields required
 */
export const updateTodoSchema = createTodoSchema.extend({
  priority: priorityEnum,
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

/**
 * Patch todo schema (PATCH - partial update)
 * All fields optional
 */
export const patchTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title must not exceed 200 characters")
    .trim()
    .optional(),
  
  description: z
    .string()
    .min(1, "Description cannot be empty")
    .max(2000, "Description must not exceed 2000 characters")
    .trim()
    .optional(),
  
  priority: priorityEnum.optional(),
  
  dueDate: z
    .string()
    .datetime("Invalid date format")
    .refine(
      (date) => new Date(date) > new Date(),
      "Due date must be in the future"
    )
    .optional()
    .nullable(),
  
  isCompleted: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided for update"
);

export type PatchTodoInput = z.infer<typeof patchTodoSchema>;

/**
 * Todo query parameters schema for GET /api/todos
 */
export const todoQuerySchema = z.object({
  page: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be positive"),
  
  limit: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10))
    .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100"),
  
  q: z.string().trim().nullable().optional(),
  
  isCompleted: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  
  priority: priorityEnum.nullable().optional(),
  
  sortBy: z.enum(["createdAt", "dueDate", "title"]).nullable().optional().default("createdAt"),
  
  order: z.enum(["asc", "desc"]).nullable().optional().default("desc"),
});

export type TodoQueryParams = z.infer<typeof todoQuerySchema>;

/**
 * MongoDB ObjectId validation
 */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export type ObjectId = z.infer<typeof objectIdSchema>;

// ==========================================
// RESPONSE SCHEMAS (for documentation)
// ==========================================

/**
 * Standard error response schema
 */
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

/**
 * Standard success response schema
 */
export const successResponseSchema = z.object({
  message: z.string(),
  data: z.any().optional(),
});

// ==========================================
// VALIDATION HELPER
// ==========================================

/**
 * Validate request body against a schema
 * Returns validated data or throws formatted error
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: result.error };
}

/**
 * Format Zod errors into user-friendly messages
 */
export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });
}
