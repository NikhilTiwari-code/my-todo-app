// src/app/api/comments/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/auth";
import connectToDb from "@/utils/db";
import Comment from "@/models/comment.model";

// DELETE - Delete comment (only owner)
export async function DELETE(
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

    const comment = await Comment.findById(params.id);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check ownership
    if (comment.userId.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await Comment.deleteComment(params.id);

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete comment" },
      { status: 500 }
    );
  }
}