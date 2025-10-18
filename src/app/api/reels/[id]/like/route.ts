// 📍 PASTE YOUR LIKE API CODE HERE
// POST: Like/Unlike reel

import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Reel from "@/models/reel.models";
import { getUserIdFromRequest } from "@/utils/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDb();

    const { id } = await params;
    const authResult = await getUserIdFromRequest(request);
    
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const reel = await Reel.findById(id);

    if (!reel || !reel.isActive) {
      return NextResponse.json(
        { error: "Reel not found" },
        { status: 404 }
      );
    }

    const isLiked = reel.likes.some((likeId: any) => likeId.toString() === userId);

    let updateOperation;
    let liked;

    if (isLiked) {
      // Unlike: remove user from likes array
      updateOperation = { $pull: { likes: userId } };
      liked = false;
    } else {
      // Like: add user to likes array
      updateOperation = { $addToSet: { likes: userId } };
      liked = true;
    }

    const updatedReel = await Reel.findByIdAndUpdate(
      id,
      updateOperation,
      { new: true }
    ).populate("likes", "name avatar username");

    if (!updatedReel) {
      return NextResponse.json(
        { error: "Failed to update reel" },
        { status: 500 }
      );
    }

    // For real-time notifications (you'll need to implement socket emission)
    // if (liked && reel.userId.toString() !== userId) {
    //   // Emit socket event for notification
    //   // io.to(reel.userId.toString()).emit("reel:like", { ... });
    // }

    return NextResponse.json({
      liked,
      likesCount: updatedReel.likes.length,
    });

  } catch (error) {
    console.error("Like reel error:", error);
    return NextResponse.json(
      { error: "Failed to like/unlike reel" },
      { status: 500 }
    );
  }
}
