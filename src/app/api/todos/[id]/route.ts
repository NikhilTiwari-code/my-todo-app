import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDb from "@/utils/db";
import Todo from "@/models/todos.model";
import { getUserIdFromRequest } from "@/utils/auth";


function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/*
 * GET /api/todos/[id]
 * Fetch a single todo by ID (must be owned by authenticated user)
*/


export async function GET(request: Request, context: { params: { id: string } }) {
  // Auth guard
  const auth = await getUserIdFromRequest(request);
  if ("error" in auth) return auth.error;
 

  const { id } = context.params;

  // Validate ObjectId
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ID",
          message: "Invalid todo ID format",
        },
      },
      { status: 400 }
    );
  }

  try {
    await connectToDb();

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

    return NextResponse.json(
      {
        todo,
      },
      { status: 200 }
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



/**
 * PUT /api/todos/[id]
 * Full replacement update (all fields required except isCompleted)
 * Body: { title, description, priority?, dueDate? }
 */


export async function PUT(request: Request, context: { params: { id: string } }) {
  // Auth guard
  const auth = await getUserIdFromRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = context.params;

  // Validate ObjectId
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ID",
          message: "Invalid todo ID format",
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, priority, dueDate } = body as {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string | null;
    };

    // Validation (PUT requires all fields)
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Title is required",
          },
        },
        { status: 400 }
      );
    }

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Description is required",
          },
        },
        { status: 400 }
      );
    }

    // Validate priority
    if (priority && !["low", "medium", "high"].includes(priority)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Priority must be one of: low, medium, high",
          },
        },
        { status: 400 }
      );
    }

    // Validate dueDate if provided
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid dueDate format",
            },
          },
          { status: 400 }
        );
      }
      if (dueDateObj <= new Date()) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "dueDate must be in the future",
            },
          },
          { status: 400 }
        );
      }
    }

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




/**
 * PATCH /api/todos/[id]
 * Partial update (update only provided fields)
 * Body: { title?, description?, priority?, dueDate?, isCompleted? }
 */



export async function PATCH(request: Request, context: { params: { id: string } }) {
  // Auth guard
  const auth = await getUserIdFromRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = context.params;

  // Validate ObjectId
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ID",
          message: "Invalid todo ID format",
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, priority, dueDate, isCompleted } = body as {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string | null;
      isCompleted?: boolean;
    };

    // Build update object with only provided fields
    const updateData: any = {};

    if (title !== undefined) {
      if (title.trim().length === 0) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Title cannot be empty",
            },
          },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (description.trim().length === 0) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Description cannot be empty",
            },
          },
          { status: 400 }
        );
      }
      updateData.description = description.trim();
    }

    if (priority !== undefined) {
      if (!["low", "medium", "high"].includes(priority)) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Priority must be one of: low, medium, high",
            },
          },
          { status: 400 }
        );
      }
      updateData.priority = priority;
    }

    if (dueDate !== undefined) {
      if (dueDate === null) {
        // Remove dueDate
        if (!updateData.$unset) updateData.$unset = {};
        updateData.$unset.dueDate = 1;
      } else {
        const dueDateObj = new Date(dueDate);
        if (isNaN(dueDateObj.getTime())) {
          return NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Invalid dueDate format",
              },
            },
            { status: 400 }
          );
        }
        if (dueDateObj <= new Date()) {
          return NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "dueDate must be in the future",
              },
            },
            { status: 400 }
          );
        }
        updateData.dueDate = dueDateObj;
      }
    }

    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
    }

    // Check if any fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "No fields provided for update",
          },
        },
        { status: 400 }
      );
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

/**
 * DELETE /api/todos/[id]
 * Delete a todo (must be owned by authenticated user)
 */



export async function DELETE(request: Request, context: { params: { id: string } }) {
  // Auth guard
  const auth = await getUserIdFromRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = context.params;

  // Validate ObjectId
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ID",
          message: "Invalid todo ID format",
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
 