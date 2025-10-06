
import { NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Todo from "@/models/todos.model";
import { getUserIdFromRequest } from "@/utils/auth";

 
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const q = searchParams.get("q")?.trim() || "";
    const isCompletedParam = searchParams.get("isCompleted");
    const priority = searchParams.get("priority");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? 1 : -1;

    
    // Build filter
    const filter: any = { owner: auth.userId };

    // Search filter
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    // isCompleted filter
    if (isCompletedParam !== null && isCompletedParam !== "") {
      filter.isCompleted = isCompletedParam === "true";
    }

    // Priority filter
    if (priority && ["low", "medium", "high"].includes(priority)) {
      filter.priority = priority;
    }

    // Build sort
    const sortFields: Record<string, 1 | -1> = {};
    if (["createdAt", "dueDate", "title"].includes(sortBy)) {
      sortFields[sortBy] = order as 1 | -1;
    } else {
      sortFields.createdAt = -1; // fallback
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [todos, total] = await Promise.all([
      Todo.find(filter)
        .select("-__v") // Exclude version key
        .sort(sortFields as any)
        .skip(skip)
        .limit(limit)
        .lean(), // Return plain objects for performance
      Todo.countDocuments(filter), 
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json(
      {
        data: todos,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      },
      { status: 200 }
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
    const { title, description, priority, dueDate } = body as {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string | null;
    };

    // Validation
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

    // Create todo
    const todoData: any = {
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
    const { __v, ...todoWithoutVersion } = todoObj;

    return NextResponse.json(
      {
        message: "Todo created successfully",
        todo: todoWithoutVersion,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating todo:", error);

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
          message: "Failed to create todo",
        },
      },
      { status: 500 }
    );
  }
}

// this is a check of branch testing

// *************************************************************************************

