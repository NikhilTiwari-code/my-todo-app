// src/app/api/comments/[id]/like/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/auth";
import connectToDb from "@/utils/db";
import Comment from "@/models/comment.model";

// POST - Toggle like on comment
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

    const result = await Comment.toggleLike(params.id, userId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Like comment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to like comment" },
      { status: 500 }
    );
  }
}
