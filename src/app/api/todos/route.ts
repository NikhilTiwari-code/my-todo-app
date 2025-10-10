
import { NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Todo from "@/models/todos.model";
import { getUserIdFromRequest } from "@/utils/auth";
import { createTodoSchema, todoQuerySchema, formatZodError } from "@/lib/validations";
import { cache, cacheKeys } from "@/lib/redis";
import crypto from "crypto";

 
/**
 * GET /api/todos
 * List todos with pagination, filters, search, and sorting
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 10, max 100)
 * - q: string (search in title/description)
 * - isCompleted: boolean
 * - priority: low|medium|high
 * - sortBy: createdAt|dueDate|title (default createdAt)
 * - order: asc|desc (default desc)
 */




export async function GET(request: Request) {
  // Auth guard
  const auth = await getUserIdFromRequest(request);
  if ("error" in auth) return auth.error;
    
  try {
    await connectToDb();

    // Parse and validate query params
    const { searchParams } = new URL(request.url);
    const queryData = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      q: searchParams.get("q"),
      isCompleted: searchParams.get("isCompleted"),
      priority: searchParams.get("priority"),
      sortBy: searchParams.get("sortBy"),
      order: searchParams.get("order"),
    };

    const validation = todoQuerySchema.safeParse(queryData);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: formatZodError(validation.error),
          },
        },
        { status: 400 }
      );
    }

    const { page, limit, q, isCompleted, priority, sortBy, order } = validation.data;

    // Provide defaults for sortBy and order
    const finalSortBy = sortBy || "createdAt";
    const finalOrder = order || "desc";
    
    // Generate cache key based on query params
    const queryHash = crypto
      .createHash("md5")
      .update(JSON.stringify({ page, limit, q, isCompleted, priority, sortBy: finalSortBy, order: finalOrder }))
      .digest("hex");
    const cacheKey = cacheKeys.todosList(auth.userId, queryHash);

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          "X-Cache": "HIT",
        },
      });
    }

    
    // Build filter
    const filter: Record<string, unknown> = { owner: auth.userId };

    // Search filter
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    // isCompleted filter
    if (isCompleted !== undefined) {
      filter.isCompleted = isCompleted;
    }

    // Priority filter
    if (priority) {
      filter.priority = priority;
    }

    // Build sort
    const sortOrder = finalOrder === "asc" ? 1 : -1;
    const sortFieldKey = finalSortBy as string; // TypeScript needs explicit type
    const sortFields: Record<string, 1 | -1> = {
      [sortFieldKey]: sortOrder,
    };

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [todos, total] = await Promise.all([
      Todo.find(filter)
        .select("-__v") // Exclude version key
        .sort(sortFields)
        .skip(skip)
        .limit(limit)
        .lean(), // Return plain objects for performance
      Todo.countDocuments(filter), 
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    const responseData = {
      data: todos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    };

    // Cache the result for 5 minutes
    await cache.set(cacheKey, responseData, 300);

    return NextResponse.json(
      responseData,
      {
        status: 200,
        headers: {
          "X-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch todos",
        },
      },
      { status: 500 }
    );
  }
}


// ***********************************************************************************
/**
 * POST /api/todos
 * Create a new todo
 * Body: { title, description, priority?, dueDate? }
 */


export async function POST(request: Request) {
  // Auth guard
  const auth = await getUserIdFromRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();

    // Validate with Zod
    const validation = createTodoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid todo data",
            details: formatZodError(validation.error),
          },
        },
        { status: 400 }
      );
    }

    const { title, description, priority, dueDate } = validation.data;

    await connectToDb();

    // Create todo
    const todoData: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      owner: auth.userId,
    };

    if (priority) todoData.priority = priority;
    if (dueDate) todoData.dueDate = new Date(dueDate);

    const newTodo = new Todo(todoData);
    await newTodo.save();

    // Return without __v
    const todoObj = newTodo.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __v, ...todoWithoutVersion } = todoObj;

    // Invalidate user's todo list cache
    await cache.delPattern(cacheKeys.userTodos(auth.userId));

    return NextResponse.json(
      {
        message: "Todo created successfully",
        todo: todoWithoutVersion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating todo:", error);

    // Handle Mongoose validation errors
    if (error instanceof Error && 'name' in error && error.name === "ValidationError") {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create todo",
        },
      },
      { status: 500 }
    );
  }
}

// this is a check of branch testing

// *************************************************************************************

