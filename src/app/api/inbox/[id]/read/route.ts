import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import SharedPost from "@/models/shared-post.model";
import { getUserIdFromRequest } from "@/utils/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const { id } = await context.params;

    await connectToDb();

    const sharedPost = await SharedPost.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!sharedPost) {
      return NextResponse.json(
        { error: "Shared post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { sharedPost },
    });
  } catch (error: any) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark as read" },
      { status: 500 }
    );
  }
}
