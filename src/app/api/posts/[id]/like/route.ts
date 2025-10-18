// src/app/api/posts/[id]/like/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/auth";
import connectToDb from "@/utils/db";
import Post from "@/models/post.model";

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

    // TODO: Send real-time notification via Socket.IO
    // if (result.isLiked) {
    //   const post = await Post.findById(params.id);
    //   io.to(`user:${post.userId}`).emit("post-liked", {
    //     postId: params.id,
    //     userId: session.user.id,
    //   });
    // }

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