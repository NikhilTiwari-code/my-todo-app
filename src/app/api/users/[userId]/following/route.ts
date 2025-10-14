import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import User, { IUser } from "@/models/user.models";
import Todo from "@/models/todos.model";
import { getServerSession } from "@/utils/auth";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectToDb();

    const { userId } = await params;

    // Get current user session (optional - for checking follow status)
    const session = await getServerSession();
    const currentUserId = session?.user?.id;

    // Find the target user and populate their following
    const user = await User.findById(userId).populate({
      path: "following",
      select: "name email avatar bio createdAt",
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get following details with additional stats
    const followingWithDetails = await Promise.all(
      user.following.map(async (followedUserId: mongoose.Types.ObjectId) => {
        const followedUser = await User.findById(followedUserId).lean() as IUser | null;
        if (!followedUser) return null;
        
        // Count todos for each followed user
        const todoCount = await Todo.countDocuments({ owner: followedUser._id });
        
        const completedCount = await Todo.countDocuments({ owner: followedUser._id, isCompleted: true });

        // Check if current user follows this person
        let isFollowing = false;
        if (currentUserId) {
          const currentUser = await User.findById(currentUserId);
          isFollowing = currentUser?.following.some(
            (id) => String(id) === String(followedUser._id)
          ) || false;
        }

        return {
          id: String(followedUser._id),
          name: followedUser.name,
          email: followedUser.email,
          avatar: followedUser.avatar,
          bio: followedUser.bio,
          createdAt: followedUser.createdAt,
          stats: {
            totalTodos: todoCount,
            completedTodos: completedCount,
            followersCount: followedUser.followers.length,
            followingCount: followedUser.following.length,
          },
          isFollowing,
          isCurrentUser: currentUserId === String(followedUser._id),
        };
      })
    );

    // Filter out nulls
    const validFollowing = followingWithDetails.filter((f): f is NonNullable<typeof f> => f !== null);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: String(user._id),
            name: user.name,
          },
          following: validFollowing,
          total: validFollowing.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
