import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import User from "@/models/user.models";
import { getServerSession } from "@/utils/auth";

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
      user.following.map(async (followedUser: any) => {
        // Count todos for each followed user
        const todoCount = await require("@/models/todos.model")
          .default.countDocuments({ owner: followedUser._id });
        
        const completedCount = await require("@/models/todos.model")
          .default.countDocuments({ owner: followedUser._id, isCompleted: true });

        // Check if current user follows this person
        let isFollowing = false;
        if (currentUserId) {
          const currentUser = await User.findById(currentUserId);
          isFollowing = currentUser?.following.some(
            (id: any) => String(id) === String(followedUser._id)
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

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: String(user._id),
            name: user.name,
          },
          following: followingWithDetails,
          total: followingWithDetails.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
