import { NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import User from "@/models/user.models";
import Todo from "@/models/todos.model";
import { isValidObjectId } from "mongoose";
import { getServerSession } from "@/utils/auth";

// GET user by ID with their details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

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

    // Get current user session
    const session = await getServerSession();
    const currentUserId = session?.user?.id;

    // Get user (exclude password)
    const user = await User.findById(userId, { password: 0 });

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

    // Check if current user is following this user
    const isFollowing = currentUserId 
      ? user.followers.some((followerId) => followerId.toString() === currentUserId)
      : false;

    // Get user's todo counts
    const totalTodos = await Todo.countDocuments({ owner: userId });
    const completedTodos = await Todo.countDocuments({ 
      owner: userId, 
      isCompleted: true 
    });

    // Get recent todos (last 5)
    const recentTodos = await Todo.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            createdAt: user.createdAt,
          },
          stats: {
            totalTodos,
            completedTodos,
            activeTodos: totalTodos - completedTodos,
            completionRate: totalTodos > 0 
              ? Math.round((completedTodos / totalTodos) * 100) 
              : 0,
            followersCount: user.followers.length,
            followingCount: user.following.length,
          },
          isFollowing,
          isCurrentUser: currentUserId === String(user._id),
          recentTodos: recentTodos.map(todo => ({
            id: todo._id,
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            isCompleted: todo.isCompleted,
            dueDate: todo.dueDate,
            createdAt: todo.createdAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch user",
        },
      },
      { status: 500 }
    );
  }
}
