// src/app/api/posts/[id]/save/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/auth";
import connectToDb from "@/utils/db";
import Post from "@/models/post.model";

// POST - Toggle save on post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    const { id } = await params;
    const result = await Post.toggleSave(id, userId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Save post error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save post" },
      { status: 500 }
    );
  }
}