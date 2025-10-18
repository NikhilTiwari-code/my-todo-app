// src/app/api/posts/[id]/like/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/auth";
import connectToDb from "@/utils/db";
import Post from "@/models/post.model";
import { createNotification } from "@/utils/notifications";

// POST - Toggle like on post
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    const result = await Post.toggleLike(params.id, userId);

    // Create notification when post is liked (not on unlike)
    if (result.isLiked) {
      try {
        const post = await Post.findById(params.id).select('userId').lean();
        
        if (post && post.userId) {
          // Send notification asynchronously (don't block the response)
          createNotification({
            recipientId: post.userId.toString(),
            senderId: userId,
            type: "LIKE",
            postId: params.id,
          }).catch(err => {
            // Log error but don't fail the like operation
            console.error("Failed to create like notification:", err);
          });
        }
      } catch (notifError) {
        // Notification failure shouldn't affect the like operation
        console.error("Error in notification flow:", notifError);
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Like post error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to like post" },
      { status: 500 }
    );
  }
}