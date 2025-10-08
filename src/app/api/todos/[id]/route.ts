import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDb from "@/utils/db";
import Todo from "@/models/todos.model";
import { getUserIdFromRequest } from "@/utils/auth";
import { withRateLimit } from "@/middleware/rate-limit";
import { readRateLimiter, mutationRateLimiter } from "@/lib/rate-limiter";
import { objectIdSchema, updateTodoSchema, patchTodoSchema, formatZodError } from "@/lib/validations";
import { cache, cacheKeys } from "@/lib/redis";


function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/*
 * GET /api/todos/[id]
 * Fetch a single todo by ID (must be owned by authenticated user)
*/


async function getTodoHandler(request: Request, context: { params: { id: string } }) {
  // Auth guard
  const auth = await getUserIdFromRequest(request);
  if ("error" in auth) return auth.error;
 

  const { id } = context.params;

  // Validate ObjectId with Zod
  const validation = objectIdSchema.safeParse(id);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ID",
          message: "Invalid todo ID format",
          details: formatZodError(validation.error),
        },
      },
      { status: 400 }
    );
  }

  try {
    await connectToDb();

    // Try to get from cache
    const cacheKey = cacheKeys.todo(id);
    const cached = await cache.get(cacheKey);
    if (cached) {
      // Verify ownership from cached data
      if ((cached as any).owner !== auth.userId) {
        return NextResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Todo not found or access denied",
            },
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { todo: cached },
        {
          status: 200,
          headers: {
            "X-Cache": "HIT",
          },
        }
      );
    }

    const todo = await Todo.findOne({
      _id: id,
      owner: auth.userId, // Ownership check (ensure todo belongs to authenticated user) 
                          // Why ownership check? User A shouldn't see User B's todos!
                          // Even if User A knows the todo ID
    })
      .select("-__v")
      .lean();

    if (!todo) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Todo not found or access denied",
          },
        },
        { status: 404 }
      );
    }

    // Cache the todo for 10 minutes
    await cache.set(cacheKey, todo, 600);

    return NextResponse.json(
      {
        todo,
      },
      {
        status: 200,
        headers: {
          "X-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching todo:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch todo",
        },
      },
      { status: 500 }
    );
  }
}

// Apply lenient rate limiting for read operations
export const GET = withRateLimit(getTodoHandler, {
  limiter: readRateLimiter,
});



/**
 * PUT /api/todos/[id]
 * Full replacement update (all fields required except isCompleted)
 * Body: { title, description, priority?, dueDate? }
 */


async function updateTodoHandler(request: Request, context: { params: { id: string } }) {
  // Auth guard
  const auth = await getUserIdFromRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = context.params;

  // Validate ObjectId with Zod
  const idValidation = objectIdSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ID",
          message: "Invalid todo ID format",
          details: formatZodError(idValidation.error),
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    // Validate with Zod
    const validation = updateTodoSchema.safeParse(body);
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

    // Build update object
    const updateData: any = {
      title: title.trim(),
      description: description.trim(),
      priority: priority || "low",
    };

    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    } else {
      // Remove dueDate if not provided (full replacement)
      updateData.$unset = { dueDate: 1 };
    }

    // Update with ownership check
    const updatedTodo = await Todo.findOneAndUpdate(
      {
        _id: id,
        owner: auth.userId, // Ownership check
      },
      updateData,
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    ).select("-__v");

    if (!updatedTodo) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Todo not found or access denied",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Todo updated successfully",
        todo: updatedTodo,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating todo:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
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
          message: "Failed to update todo",
        },
      },
      { status: 500 }
    );
  }
}

// Apply moderate rate limiting for mutations
export const PUT = withRateLimit(updateTodoHandler, {
  limiter: mutationRateLimiter,
});




/**
 * PATCH /api/todos/[id]
 * Partial update (update only provided fields)
 * Body: { title?, description?, priority?, dueDate?, isCompleted? }
 */



async function patchTodoHandler(request: Request, context: { params: { id: string } }) {
  // Auth guard
  const auth = await getUserIdFromRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = context.params;

  // Validate ObjectId with Zod
  const idValidation = objectIdSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ID",
          message: "Invalid todo ID format",
          details: formatZodError(idValidation.error),
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    // Validate with Zod
    const validation = patchTodoSchema.safeParse(body);
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

    const { title, description, priority, dueDate, isCompleted } = validation.data;

    // Build update object with only provided fields
    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (dueDate !== undefined) {
      if (dueDate === null) {
        // Remove dueDate
        if (!updateData.$unset) updateData.$unset = {};
        updateData.$unset.dueDate = 1;
      } else {
        updateData.dueDate = dueDate;
      }
    }

    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
    }

    await connectToDb();

    // Update with ownership check
    const updatedTodo = await Todo.findOneAndUpdate(
      {
        _id: id,
        owner: auth.userId, // Ownership check
      },
      updateData,
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    ).select("-__v");

    if (!updatedTodo) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Todo not found or access denied",
          },
        },
        { status: 404 }
      );
    }

    // Invalidate cache
    await cache.del(cacheKeys.todo(id));
    await cache.delPattern(cacheKeys.userTodos(auth.userId));

    return NextResponse.json(
      {
        message: "Todo updated successfully",
        todo: updatedTodo,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error patching todo:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
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
          message: "Failed to update todo",
        },
      },
      { status: 500 }
    );
  }
}

// Apply moderate rate limiting for mutations
export const PATCH = withRateLimit(patchTodoHandler, {
  limiter: mutationRateLimiter,
});

/**
 * DELETE /api/todos/[id]
 * Delete a todo (must be owned by authenticated user)
 */



async function deleteTodoHandler(request: Request, context: { params: { id: string } }) {
  // Auth guard
  const auth = await getUserIdFromRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = context.params;

  // Validate ObjectId with Zod
  const validation = objectIdSchema.safeParse(id);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ID",
          message: "Invalid todo ID format",
          details: formatZodError(validation.error),
        },
      },
      { status: 400 }
    );
  }

  try {
    await connectToDb();

    // Delete with ownership check
    const deletedTodo = await Todo.findOneAndDelete({
      _id: id,
      owner: auth.userId, // Ownership check
    });

    if (!deletedTodo) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Todo not found or access denied",
          },
        },
        { status: 404 }
      );
    }

    // Invalidate cache
    await cache.del(cacheKeys.todo(id));
    await cache.delPattern(cacheKeys.userTodos(auth.userId));

    // Return 204 No Content (standard for successful DELETE)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete todo",
        },
      },
      { status: 500 }
    );
  }
}

// Apply moderate rate limiting for mutations
export const DELETE = withRateLimit(deleteTodoHandler, {
  limiter: mutationRateLimiter,
});
 
 