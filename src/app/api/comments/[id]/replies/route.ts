// src/app/api/comments/[id]/replies/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/auth";
import connectToDb from "@/utils/db";
import Comment from "@/models/comment.model";

// GET - Get replies for a comment
export async function GET(
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const replies = await Comment.getReplies(params.id, page, limit);

    // Add isLiked flag
    const repliesWithFlags = replies.map((reply: any) => ({
      ...reply,
      isLiked: reply.likes.some(
        (id: any) => id.toString() === userId
      ),
      likeCount: reply.likes.length,
    }));

    return NextResponse.json({
      success: true,
      replies: repliesWithFlags,
      page,
      hasMore: replies.length === limit,
    });
  } catch (error: any) {
    console.error("Get replies error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch replies" },
      { status: 500 }
    );
  }
}
