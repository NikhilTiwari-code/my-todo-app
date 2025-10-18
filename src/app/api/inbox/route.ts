import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import SharedPost from "@/models/shared-post.model";
import { getUserIdFromRequest } from "@/utils/auth";

export async function GET(req: NextRequest) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    await connectToDb();

    const query: any = { recipient: userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;

    const sharedPosts = await SharedPost.find(query)
      .populate("sender", "name username avatar isVerified")
      .populate("post", "images caption likes commentCount shareCount createdAt")
      .populate("reel", "videoUrl thumbnail likes commentCount shareCount createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SharedPost.countDocuments(query);
    const unreadCount = await SharedPost.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        sharedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    });
  } catch (error: any) {
    console.error("Inbox error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch inbox" },
      { status: 500 }
    );
  }
}
