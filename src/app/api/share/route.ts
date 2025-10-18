import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import SharedPost from "@/models/shared-post.model";
import Post from "@/models/post.model";
import { getUserIdFromRequest } from "@/utils/auth";
import { createNotification } from "@/utils/notifications";

export async function POST(req: NextRequest) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const body = await req.json();
    const { recipientIds, postId, reelId, storyId, message } = body;

    // Validation
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient required" },
        { status: 400 }
      );
    }

    if (recipientIds.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 recipients allowed" },
        { status: 400 }
      );
    }

    if (!postId && !reelId && !storyId) {
      return NextResponse.json(
        { error: "Must share at least one content type" },
        { status: 400 }
      );
    }

    if (message && message.length > 500) {
      return NextResponse.json(
        { error: "Message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    await connectToDb();

    // Create shared post for each recipient
    const sharedPosts = await Promise.all(
      recipientIds.map(async (recipientId) => {
        // Don't share with yourself
        if (recipientId === userId) return null;

        try {
          // Create shared post entry
          const sharedPost = await SharedPost.create({
            sender: userId,
            recipient: recipientId,
            post: postId,
            reel: reelId,
            story: storyId,
            message: message?.trim(),
            isRead: false,
          });

          // Create notification (async, non-blocking)
          createNotification({
            recipientId,
            senderId: userId,
            type: "SHARE",
            postId,
            reelId,
            storyId,
            message: message?.trim() || "shared a post with you",
          }).catch((err) => {
            console.error("Failed to create share notification:", err);
          });

          return sharedPost;
        } catch (error) {
          console.error(`Failed to share with user ${recipientId}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls
    const validShares = sharedPosts.filter(Boolean);

    // Increment share count on the content
    try {
      if (postId) {
        await Post.findByIdAndUpdate(postId, { $inc: { shareCount: 1 } });
      }
      // Note: Reel and Story models will be added in future
      // For now, only posts support share count
    } catch (error) {
      console.error("Failed to increment share count:", error);
      // Don't fail the whole operation
    }

    return NextResponse.json({
      success: true,
      message: `Sent to ${validShares.length} user${validShares.length > 1 ? "s" : ""}`,
      data: { sharedCount: validShares.length },
    });
  } catch (error: any) {
    console.error("Share error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to share content" },
      { status: 500 }
    );
  }
}
