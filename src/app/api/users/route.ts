import { NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import User from "@/models/user.models";
import Todo from "@/models/todos.model";

// GET all users with their todo counts
export async function GET() {
  try {
    await connectToDb();

    // Get all users (exclude password)
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    // Get todo counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const todoCount = await Todo.countDocuments({ owner: user._id });
        const completedCount = await Todo.countDocuments({ 
          owner: user._id, 
          isCompleted: true 
        });

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          stats: {
            totalTodos: todoCount,
            completedTodos: completedCount,
            activeTodos: todoCount - completedCount,
          },
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          users: usersWithCounts,
          total: usersWithCounts.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch users",
        },
      },
      { status: 500 }
    );
  }
}
