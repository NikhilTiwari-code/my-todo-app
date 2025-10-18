// 📍 PASTE YOUR COMMENTS API CODE HERE
// POST: Add comment to reel

import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Reel from "@/models/reel.models";
import User from "@/models/user.models";
import { getUserIdFromRequest } from "@/utils/auth";

export async function POST(request: NextRequest) {
  try {
    await connectToDb();

    const authResult = await getUserIdFromRequest(request);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const { reelId, text } = await request.json();

    if (!reelId || !text) {
      return NextResponse.json(
        { error: "Reel ID and text are required" },
        { status: 400 }
      );
    }

    // Validate text length
    if (text.length > 500) {
      return NextResponse.json(
        { error: "Comment text must be 500 characters or less" },
        { status: 400 }
      );
    }

    const reel = await Reel.findById(reelId);

    if (!reel || !reel.isActive) {
      return NextResponse.json(
        { error: "Reel not found" },
        { status: 404 }
      );
    }

    // Get user info for the comment
    const user = await User.findById(userId).select("name avatar username");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create new comment
    const newComment = {
      userId: user._id,
      text: text.trim(),
      createdAt: new Date(),
    };

    // Add comment to reel
    const updatedReel = await Reel.findByIdAndUpdate(
      reelId,
      {
        $push: { comments: newComment },
      },
      { new: true }
    ).populate("comments.userId", "name avatar username");

    if (!updatedReel) {
      return NextResponse.json(
        { error: "Failed to add comment" },
        { status: 500 }
      );
    }

    // Get the newly added comment with populated user info
    const addedComment = updatedReel.comments[updatedReel.comments.length - 1];

    // For real-time notifications (you'll need to implement socket emission)
    // if (reel.userId.toString() !== userId) {
    //   // Emit socket event for notification
    //   // io.to(reel.userId.toString()).emit("reel:comment", { ... });
    // }

    return NextResponse.json({
      comment: {
        _id: (addedComment as any)._id,
        user: {
          _id: (addedComment.userId as any)._id,
          name: (addedComment.userId as any).name,
          avatar: (addedComment.userId as any).avatar,
          username: (addedComment.userId as any).username,
        },
        text: addedComment.text,
        createdAt: addedComment.createdAt,
      },
    });

  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
