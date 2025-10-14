import { NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import User from "@/models/user.models";
import Todo, { ITodo } from "@/models/todos.model";
import { isValidObjectId, type FilterQuery } from "mongoose";

// GET all todos for a specific user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filters
    const priority = searchParams.get("priority");
    const completed = searchParams.get("completed");
    const search = searchParams.get("search");

    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ID",
            message: "Invalid user ID",
          },
        },
        { status: 400 }
      );
    }

    await connectToDb();

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 }
      );
    }

    // Build query
<<<<<<< HEAD
    const query: Record<string, unknown> = { owner: userId };
=======
  const query: FilterQuery<ITodo> = { owner: userId };
>>>>>>> image

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (completed !== null && completed !== undefined) {
      query.isCompleted = completed === "true";
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Get todos with pagination
    const todos = (await Todo.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)) as ITodo[];

    const total = await Todo.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: {
          todos: todos.map((todo: ITodo) => ({
            id: todo._id,
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            isCompleted: todo.isCompleted,
            dueDate: todo.dueDate,
            createdAt: todo.createdAt,
            updatedAt: todo.updatedAt,
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user todos:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch user todos",
        },
      },
      { status: 500 }
    );
  }
}
