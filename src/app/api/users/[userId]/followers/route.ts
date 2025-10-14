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

    // Find the target user and populate their followers
    const user = await User.findById(userId).populate({
      path: "followers",
      select: "name email avatar bio createdAt",
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get follower details with additional stats
    const followersWithDetails = await Promise.all(
      user.followers.map(async (followerId: mongoose.Types.ObjectId) => {
        const follower = await User.findById(followerId).lean() as IUser | null;
        if (!follower) return null;
        
        // Count todos for each follower
        const todoCount = await Todo.countDocuments({ owner: follower._id });
        
        const completedCount = await Todo.countDocuments({ owner: follower._id, isCompleted: true });

        // Check if current user follows this follower
        let isFollowing = false;
        if (currentUserId) {
          const currentUser = await User.findById(currentUserId);
          isFollowing = currentUser?.following.some(
            (id) => String(id) === String(follower._id)
          ) || false;
        }

        return {
          id: String(follower._id),
          name: follower.name,
          email: follower.email,
          avatar: follower.avatar,
          bio: follower.bio,
          createdAt: follower.createdAt,
          stats: {
            totalTodos: todoCount,
            completedTodos: completedCount,
            followersCount: follower.followers.length,
            followingCount: follower.following.length,
          },
          isFollowing,
          isCurrentUser: currentUserId === String(follower._id),
        };
      })
    );

    // Filter out nulls
    const validFollowers = followersWithDetails.filter((f): f is NonNullable<typeof f> => f !== null);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: String(user._id),
            name: user.name,
          },
          followers: validFollowers,
          total: validFollowers.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
