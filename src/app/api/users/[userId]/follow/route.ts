import { NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import User from "@/models/user.models";
import { getServerSession } from "@/utils/auth";
import { isValidObjectId } from "mongoose";
import { createNotification } from "@/utils/notifications";

// POST - Follow a user
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please login" } },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const currentUserId = session.user.id;

    // Can't follow yourself
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: { code: "INVALID_ACTION", message: "You cannot follow yourself" } },
        { status: 400 }
      );
    }

    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { error: { code: "INVALID_ID", message: "Invalid user ID" } },
        { status: 400 }
      );
    }

    await connectToDb();

    // Check if user to follow exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Check if already following
    const currentUser = await User.findById(currentUserId);
    if (currentUser?.following.includes(userId as any)) {
      return NextResponse.json(
        { error: { code: "ALREADY_FOLLOWING", message: "Already following this user" } },
        { status: 400 }
      );
    }

    // Add to following list of current user
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: userId }
    });

    // Add to followers list of target user
    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: currentUserId }
    });

    // Get updated counts
    const updatedUser = await User.findById(userId);
    const followersCount = updatedUser?.followers.length || 0;
    const followingCount = updatedUser?.following.length || 0;

    // Create follow notification (asynchronous, non-blocking)
    createNotification({
      recipientId: userId,
      senderId: currentUserId,
      type: "FOLLOW",
    }).catch(err => {
      // Log but don't fail the follow operation
      console.error("Failed to create follow notification:", err);
    });

    return NextResponse.json(
      {
        success: true,
        message: "User followed successfully",
        data: {
          followersCount,
          followingCount,
          isFollowing: true
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to follow user" } },
      { status: 500 }
    );
  }
}

// DELETE - Unfollow a user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please login" } },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const currentUserId = session.user.id;

    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { error: { code: "INVALID_ID", message: "Invalid user ID" } },
        { status: 400 }
      );
    }

    await connectToDb();

    // Remove from following list of current user
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userId }
    });

    // Remove from followers list of target user
    await User.findByIdAndUpdate(userId, {
      $pull: { followers: currentUserId }
    });

    // Get updated counts
    const updatedUser = await User.findById(userId);
    const followersCount = updatedUser?.followers.length || 0;
    const followingCount = updatedUser?.following.length || 0;

    return NextResponse.json(
      {
        success: true,
        message: "User unfollowed successfully",
        data: {
          followersCount,
          followingCount,
          isFollowing: false
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to unfollow user" } },
      { status: 500 }
    );
  }
}
